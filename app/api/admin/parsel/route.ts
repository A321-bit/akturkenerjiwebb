import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import type { Parcel } from "@/lib/teklif/locate";

// TKGM Parsel Sorgu aracılığı (tarayıcıdan doğrudan çağrılamaz). Yalnız admin; il, ilçe, mahalle
// listesi ve parsel sınırı döner, malik bilgisi içermez. Resmi dokümanı olmayan bir uçtur:
// değişirse ya da kapanırsa stüdyo koordinat ve adresle çalışmaya devam eder.

const TKGM = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api";
const INT = /^\d{1,7}$/;

type Feature = { properties: Record<string, unknown>; geometry: { type: string; coordinates: number[][][] | number[][][][] } };

function toParcel(f: Feature): Parcel {
  const p = f.properties;
  const outer = (f.geometry.type === "MultiPolygon" ? (f.geometry.coordinates as number[][][][])[0][0] : (f.geometry.coordinates as number[][][])[0]) ?? [];
  // TKGM alanı metin verir: "32.00"; virgüllü gelirse Türkçe biçim sayılır.
  const raw = String(p.alan ?? "");
  const alan = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw) || null;
  return {
    il: String(p.ilAd ?? ""),
    ilce: String(p.ilceAd ?? ""),
    mahalle: String(p.mahalleAd ?? ""),
    ada: String(p.adaNo ?? ""),
    parsel: String(p.parselNo ?? ""),
    alanM2: alan,
    nitelik: String(p.nitelik ?? ""),
    ring: outer.map(([lon, lat]) => [lat, lon]),
  };
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = new URL(req.url).searchParams;
  const type = q.get("type");

  let path: string | null = null;
  if (type === "il") path = "/idariYapi/ilListe";
  else if (type === "ilce" && INT.test(q.get("id") ?? "")) path = `/idariYapi/ilceListe/${q.get("id")}`;
  else if (type === "mahalle" && INT.test(q.get("id") ?? "")) path = `/idariYapi/mahalleListe/${q.get("id")}`;
  else if (type === "parsel" && INT.test(q.get("mahalle") ?? "") && INT.test(q.get("ada") ?? "") && INT.test(q.get("parsel") ?? "")) path = `/parsel/${q.get("mahalle")}/${q.get("ada")}/${q.get("parsel")}`;
  else if (type === "nokta") {
    const lat = Number(q.get("lat"));
    const lon = Number(q.get("lon"));
    if (lat >= 34 && lat <= 44 && lon >= 24 && lon <= 46) path = `/parsel/${lat.toFixed(6)}/${lon.toFixed(6)}/`;
  }
  if (!path) return NextResponse.json({ error: "Geçersiz sorgu." }, { status: 400 });

  try {
    const res = await fetch(TKGM + path, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (res.status === 404) return NextResponse.json({ error: "Bu bilgilerle parsel bulunamadı. Ada ve parsel numarasını kontrol edin." }, { status: 404 });
    if (!res.ok) throw new Error(`TKGM ${res.status}`);
    const data = await res.json();
    if (type === "parsel" || type === "nokta") return NextResponse.json(toParcel(data as Feature));
    const items = (data.features as Feature[]).map((f) => ({ id: f.properties.id as number, ad: String(f.properties.text) }));
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, max-age=86400" } });
  } catch (e) {
    console.error("[parsel]", e);
    return NextResponse.json({ error: "TKGM servisine şu an ulaşılamıyor." }, { status: 502 });
  }
}
