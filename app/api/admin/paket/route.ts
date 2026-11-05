import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { revalidateStore } from "@/lib/admin-crud";
import { sanitizeCostFields } from "@/lib/store-cost";
import { getPricingSettings, recomputePrices } from "@/lib/store-pricing";
import { cleanContents, cleanLines, hasInstall, COST_ITEM_FIELDS, PACKAGE_FIELDS, type CostItem } from "@/lib/package-builder";

// Paket Oluştur: maliyet listesi ve paket kayıtları. Maliyet içerdiği için yalnız maliyet yetkisi olan kullanıcı.
// action: saveItem | choose | savePackage | deletePackage | link

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!permsOf(await currentUser()).cost) return NextResponse.json({ error: "Maliyet yetkiniz yok." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const db = adminClient();
  const now = new Date().toISOString();

  // Kalem ekle / maliyetini düzelt (elle girilen maliyet "manual" işaretlenir).
  if (body.action === "saveItem") {
    const it = body.item ?? {};
    const name = String(it.name ?? "").trim().slice(0, 300);
    const cost = num(it.cost_usd);
    if (!name) return NextResponse.json({ error: "Kalem adı boş." }, { status: 400 });
    const row = {
      id: it.id ? String(it.id) : `u:${Date.now()}`,
      name,
      cost_usd: cost !== null && cost >= 0 ? Math.round(cost * 10000) / 10000 : null,
      manual: true,
      updated_at: now,
      ...(it.id ? {} : { code: String(it.code ?? "").trim() || null, grp: String(it.grp ?? "").trim() || "Elle eklenen", source: "Elle girildi", unit: String(it.unit ?? "adet"), currency: "USD" }),
    };
    const { data, error } = await db.from("cost_items").upsert(row).select(COST_ITEM_FIELDS).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  // Aynı ürün kodu birden çok listede: seçilen fiyat aktif, diğerleri pasif.
  if (body.action === "choose") {
    const id = String(body.id ?? "");
    const { data: chosen } = await db.from("cost_items").select("code").eq("id", id).single();
    if (!chosen?.code) return NextResponse.json({ error: "Kalem bulunamadı." }, { status: 404 });
    const off = await db.from("cost_items").update({ active: false, updated_at: now }).eq("code", chosen.code).neq("id", id);
    const on = await db.from("cost_items").update({ active: true, updated_at: now }).eq("id", id);
    if (off.error || on.error) return NextResponse.json({ error: (off.error ?? on.error)!.message }, { status: 500 });
    const { data } = await db.from("cost_items").select(COST_ITEM_FIELDS).eq("code", chosen.code);
    return NextResponse.json({ items: data ?? [] });
  }

  if (body.action === "savePackage") {
    const p = body.pkg ?? {};
    const name = String(p.name ?? "").trim().slice(0, 200);
    if (!name) return NextResponse.json({ error: "Paket adı boş." }, { status: 400 });
    const lines = cleanLines(p.lines);
    const sale = num(p.sale_usd);
    const row = { name, lines, note: String(p.note ?? "").trim() || null, product_id: num(p.product_id), sale_usd: sale !== null && sale > 0 ? Math.round(sale * 100) / 100 : null, contents: cleanContents(p.contents), updated_at: now };
    const q = p.id ? db.from("product_packages").update(row).eq("id", Number(p.id)) : db.from("product_packages").insert(row);
    const { data, error } = await q.select(PACKAGE_FIELDS).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Öğrenme: katalogda maliyeti boş olan kaleme pakette maliyet girildiyse kataloğa da yazılır.
    const ids = lines.filter((l) => l.itemId && l.unitUsd != null).map((l) => l.itemId!);
    const learned: CostItem[] = [];
    if (ids.length) {
      const { data: empty } = await db.from("cost_items").select("id").in("id", ids).is("cost_usd", null);
      for (const e of empty ?? []) {
        const l = lines.find((x) => x.itemId === e.id)!;
        const r = await db.from("cost_items").update({ cost_usd: l.unitUsd, manual: true, updated_at: now }).eq("id", e.id).select(COST_ITEM_FIELDS).single();
        if (r.data) learned.push(r.data as CostItem);
      }
    }
    return NextResponse.json({ pkg: data, learned });
  }

  if (body.action === "deletePackage") {
    const { error } = await db.from("product_packages").delete().eq("id", Number(body.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Paketi mağaza ürününe bağla (ürün tek paket olarak satılır):
  // - satırlar ürünün malzeme listesi (bom) olur, alış maliyeti oradan hesaplanır;
  // - paketin satış fiyatı girildiyse ürünün marjı o fiyatı verecek şekilde ayarlanır;
  // - ürünün seçenekleri (Ekonomik/Üst vb.) ve eski liste fiyatı kaldırılır;
  // - sitedeki "paket içeriği" paketin içerik maddeleriyle (fiyatsız) değiştirilir;
  // - pakette montaj hizmeti varsa ürün "kurulum dahil" işaretlenir.
  if (body.action === "link") {
    const pkgId = Number(body.id);
    const productId = Number(body.productId);
    const { data: pkg } = await db.from("product_packages").select(PACKAGE_FIELDS).eq("id", pkgId).single();
    if (!pkg || !productId) return NextResponse.json({ error: "Paket ya da ürün bulunamadı." }, { status: 404 });
    const lines = cleanLines(pkg.lines);
    // Maliyeti boş satırlar 0 sayılır (maliyeti başka kaleme dahil edilmiş olabilir).
    const contents = cleanContents(pkg.contents);
    if (!contents.length) return NextResponse.json({ error: "Sitede görünecek paket içeriği boş." }, { status: 400 });
    const { data: cur } = await db.from("store_products").select("margin_pct, category").eq("id", productId).single();
    if (!cur) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });

    const patch: Record<string, unknown> = sanitizeCostFields({ bom: lines.map((l) => ({ name: l.name, qty: l.qty, unit: l.unitUsd ?? 0 })) });
    const cost = Number(patch.cost_usd);
    const s = await getPricingSettings(db);
    const sale = pkg.sale_usd != null ? Number(pkg.sale_usd) : null;
    if (sale && cost > 0) patch.margin_pct = Math.round((sale / (cost * (1 + s.vatPct / 100)) - 1) * 10000) / 100;
    else {
      const { data: c } = await db.from("store_categories").select("margin_pct").eq("slug", cur.category).single();
      if (cur.margin_pct == null && c?.margin_pct == null && s.defaultMargin == null)
        return NextResponse.json({ error: "Pakete satış fiyatı girin (ürünün tanımlı marjı yok)." }, { status: 400 });
    }
    Object.assign(patch, { options: [], list_price: null, list_price_usd: null, contents, updated_at: now });
    if (hasInstall(lines)) patch.install_included = true;

    const up = await db.from("store_products").update(patch).eq("id", productId);
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
    await recomputePrices(db, { ids: [productId] });
    await db.from("product_packages").update({ product_id: productId, linked_at: now }).eq("id", pkgId);
    const { data: product } = await db.from("store_products").select("id, slug, name, category, cost_usd, margin_pct, price_usd, price").eq("id", productId).single();
    revalidateStore(product ?? undefined);
    return NextResponse.json({ product, linked_at: now });
  }

  return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}
