import type { LatLon } from "./geometry";

// Teklif Stüdyosu konum bulma: koordinat metni ayrıştırma ve parsel verisi türü.

export type Parcel = { il: string; ilce: string; mahalle: string; ada: string; parsel: string; alanM2: number | null; nitelik: string; ring: LatLon[] };

const inTurkey = (lat: number, lon: number) => lat >= 34 && lat <= 44 && lon >= 24 && lon <= 46;

function dms(deg: string, min?: string, sec?: string, hemi?: string) {
  const v = Number(deg) + Number(min ?? 0) / 60 + Number((sec ?? "0").replace(",", ".")) / 3600;
  return /[SWGB]/i.test(hemi ?? "") ? -v : v;
}

/**
 * Şunları tanır: "39.9208, 32.8541", "39,9208 32,8541", "39°55'15"N 32°51'15"E",
 * ve Google Haritalar bağlantıları (@enlem,boylam, !3d..!4d.., q=, ll=).
 * Kısa bağlantılar (maps.app.goo.gl) koordinat içermediği için çözülemez.
 */
export function parseCoordinates(text: string): LatLon | null {
  const t = decodeURIComponent(text.trim().replace(/%(?![0-9a-f]{2})/gi, "%25"));
  const ok = (lat: number, lon: number): LatLon | null => (inTurkey(lat, lon) ? [lat, lon] : null);

  // Google Haritalar: !3d/!4d gerçek işaretin yeridir, @ ise görünümün merkezidir; önce işaret aranır.
  const pin = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pin) return ok(Number(pin[1]), Number(pin[2]));
  const param = t.match(/[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (param) return ok(Number(param[1]), Number(param[2]));
  const at = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return ok(Number(at[1]), Number(at[2]));
  if (/^https?:\/\//i.test(t)) return null;

  // Derece, dakika, saniye (N/E ya da K/D).
  const d = /(\d{1,2})\s*[°º]\s*(\d{1,2})\s*['’′]\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*["”″])?\s*([NSKG])?/i;
  const e = /(\d{1,2})\s*[°º]\s*(\d{1,2})\s*['’′]\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*["”″])?\s*([EWDB])?/i;
  const first = t.match(d);
  if (first && first.index !== undefined) {
    const rest = t.slice(first.index + first[0].length).match(e);
    if (rest) return ok(dms(first[1], first[2], first[3], first[4]), dms(rest[1], rest[2], rest[3], rest[4]));
  }

  // Ondalık: "39.92, 32.85" ya da virgüllü "39,92 32,85".
  const dec = t.match(/^(\d{2})[.,](\d+)[\s,;/]+(\d{2})[.,](\d+)$/);
  if (dec) return ok(Number(`${dec[1]}.${dec[2]}`), Number(`${dec[3]}.${dec[4]}`));
  return null;
}
