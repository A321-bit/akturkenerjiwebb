import { NextResponse } from "next/server";

// Konuma özel güneş üretimi: Avrupa Komisyonu JRC PVGIS servisinden 1 kWp sistemin aylık
// üretimi (kWh). PVGIS tarayıcıdan doğrudan çağrılamadığı (CORS) için bu uç aracılık eder.
// Koordinat ~1 km'ye yuvarlanır; yanıt CDN'de 30 gün saklanır, aynı bölge için PVGIS'e tekrar gidilmez.

const PVGIS = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  // Türkiye ve çevresi dışındaki istekler reddedilir (servisin kötüye kullanımını önler).
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 34 || lat > 44 || lon < 24 || lon > 46) {
    return NextResponse.json({ error: "Konum Türkiye sınırları dışında." }, { status: 400 });
  }
  const angle = Math.round(clamp(Number(q.get("angle") ?? 30) || 0, 0, 60));
  const aspect = Math.round(clamp(Number(q.get("aspect") ?? 0) || 0, -180, 180));

  const url = `${PVGIS}?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}&peakpower=1&loss=14&angle=${angle}&aspect=${aspect}&outputformat=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`PVGIS ${res.status}`);
    const data = await res.json();
    const monthly: number[] = data.outputs.monthly.fixed.map((m: { E_m: number }) => Math.round(m.E_m * 10) / 10);
    if (monthly.length !== 12) throw new Error("PVGIS aylık veri eksik");
    return NextResponse.json(
      { monthly, annual: Math.round(data.outputs.totals.fixed.E_y), source: "PVGIS (Avrupa Komisyonu JRC)" },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000" } }
    );
  } catch (err) {
    console.error("[pvgis]", err);
    // Hesaplayıcı bu durumda bölge ortalamasıyla devam eder.
    return NextResponse.json({ error: "Üretim verisi şu an alınamadı." }, { status: 502 });
  }
}
