// Ürün maliyet alanlarını (admin formundan gelen) temizler: malzeme listesi
// (BOM) varsa alış maliyeti sunucuda ondan hesaplanır.

export type BomItem = { name: string; qty: number; unit: number };

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export function sanitizeCostFields(body: Record<string, unknown>) {
  if ("bom" in body) {
    const raw = Array.isArray(body.bom) ? body.bom : [];
    const bom: BomItem[] = raw
      .map((b) => ({ name: String((b as BomItem).name ?? "").trim(), qty: toNum((b as BomItem).qty) ?? 0, unit: toNum((b as BomItem).unit) ?? 0 }))
      .filter((b) => b.name && b.qty > 0);
    body.bom = bom;
    if (bom.length) body.cost_usd = Math.round(bom.reduce((s, b) => s + b.qty * b.unit, 0) * 100) / 100;
  }
  if ("cost_usd" in body) {
    const c = toNum(body.cost_usd);
    body.cost_usd = c !== null && c > 0 ? c : null;
  }
  if ("options" in body) {
    const raw = Array.isArray(body.options) ? body.options : [];
    body.options = raw
      .map((o) => {
        const x = o as Record<string, unknown>;
        const pos = (v: unknown) => {
          const n = toNum(v);
          return n !== null && n > 0 ? n : null;
        };
        return { label: String(x.label ?? "").trim(), cost_usd: pos(x.cost_usd), price_usd: pos(x.price_usd), list_price_usd: pos(x.list_price_usd) };
      })
      .filter((o) => o.label);
  }
  for (const k of ["margin_pct", "list_margin_pct"]) {
    if (!(k in body)) continue;
    const m = toNum(body[k]);
    body[k] = m !== null && m > -100 ? m : null;
  }
  return body;
}
