import { NextResponse } from "next/server";
import { BIN_COUNT, BIN_MIN, BIN_STEP } from "@/lib/isipompasi-calc";

// Konuma özel iklim özeti: PVGIS tipik meteorolojik yıl (TMY) saatlik sıcaklıklarından
// aylık sıcaklık dağılımı (2 °C aralıklarla saat sayısı), aylık ortalama ve tasarım sıcaklığı.
// Isı pompası hesabı ısı ihtiyacını ve verimi (COP) bu dağılımla saat saat hesaplar.
// 8760 saatlik ham veri tarayıcıya gönderilmez; yanıt CDN'de 30 gün saklanır.

const PVGIS = "https://re.jrc.ec.europa.eu/api/v5_3/tmy";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 34 || lat > 44 || lon < 24 || lon > 46) {
    return NextResponse.json({ error: "Konum Türkiye sınırları dışında." }, { status: 400 });
  }
  try {
    const res = await fetch(`${PVGIS}?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}&outputformat=json`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`PVGIS ${res.status}`);
    const data = await res.json();
    const hours: { "time(UTC)": string; T2m: number }[] = data.outputs.tmy_hourly;
    if (!Array.isArray(hours) || hours.length < 8000) throw new Error("TMY eksik");

    const bins = Array.from({ length: 12 }, () => Array<number>(BIN_COUNT).fill(0));
    const sum = Array<number>(12).fill(0);
    const cnt = Array<number>(12).fill(0);
    const all: number[] = [];
    for (const h of hours) {
      const m = Number(h["time(UTC)"].slice(4, 6)) - 1;
      const t = h.T2m;
      const i = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor((t - BIN_MIN) / BIN_STEP)));
      bins[m][i]++;
      sum[m] += t;
      cnt[m]++;
      all.push(t);
    }
    all.sort((a, b) => a - b);
    // Tipik yıl uç soğukları yumuşatır; %1'lik dilimden 5 °C düşük alınınca TS 825 tasarım
    // sıcaklıklarına yaklaşır (Ankara: TMY %1 ≈ -6,5 °C → tasarım ≈ -12 °C).
    const designT = Math.round(all[Math.floor(all.length * 0.01)] - 5);
    return NextResponse.json(
      { bins, monthlyMeanT: sum.map((s, m) => Math.round((s / cnt[m]) * 10) / 10), designT, source: "PVGIS TMY (Avrupa Komisyonu JRC)" },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000" } }
    );
  } catch (err) {
    console.error("[iklim]", err);
    return NextResponse.json({ error: "İklim verisi şu an alınamadı." }, { status: 502 });
  }
}
