import { adminClient } from "./data";
import { googleAccessToken } from "./google-auth";

// Search Console → veritabanı. Servis hesabı (GSC_SERVICE_ACCOUNT ortam
// değişkeni, Google'ın verdiği JSON anahtarın tamamı) ile Search Analytics
// API'sinden tarih/sorgu/sayfa/cihaz kırılımında veri çekilir ve gsc_rows
// tablosuna yazılır. dataState "all": son 1–2 günün henüz kesinleşmemiş
// (ön) verisi de gelir; sonraki çekimlerde aynı günler yeniden yazılarak
// kesinleşmiş değerlerle güncellenir.

const SITE = "sc-domain:akturkenerji.com";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const accessToken = () => googleAccessToken(SCOPE);

type ApiRow = { keys: [string, string, string, string]; clicks: number; impressions: number; ctr: number; position: number };

const ymd = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 86400000));

/** start–end arası (dahil) günleri Search Console'dan çekip tabloya yazar. */
export async function syncGsc(start: string, end: string): Promise<{ rows: number }> {
  const db = adminClient();
  try {
    const token = await accessToken();
    const rows: ApiRow[] = [];
    for (let startRow = 0; startRow < 500000; startRow += 25000) {
      const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          dimensions: ["date", "query", "page", "device"],
          rowLimit: 25000,
          startRow,
          dataState: "all",
        }),
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(`Search Console: ${body.error?.message ?? res.status}`);
      const batch = (body.rows ?? []) as ApiRow[];
      rows.push(...batch);
      if (batch.length < 25000) break;
    }

    // Aynı günlerin eski kayıtları silinip yenileri yazılır (ön veri kesinleşince değerler değişir).
    const del = await db.from("gsc_rows").delete().gte("date", start).lte("date", end);
    if (del.error) throw new Error(del.error.message);
    const records = rows.map((r) => ({
      date: r.keys[0],
      query: r.keys[1],
      page: r.keys[2],
      device: r.keys[3].toLowerCase(),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
    for (let i = 0; i < records.length; i += 1000) {
      const ins = await db.from("gsc_rows").upsert(records.slice(i, i + 1000));
      if (ins.error) throw new Error(ins.error.message);
    }
    await db.from("gsc_sync_log").insert({ start_date: start, end_date: end, row_count: records.length });
    return { rows: records.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.from("gsc_sync_log").insert({ start_date: start, end_date: end, error: message });
    throw e;
  }
}
