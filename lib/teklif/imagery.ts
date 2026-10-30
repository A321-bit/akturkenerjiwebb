"use client";

// Uydu görüntüsü kaynağı: Google Map Tiles API anahtarı tanımlıysa Google uydu karoları
// (oturum belirteciyle), değilse ya da oturum açılamazsa Esri World Imagery.
// Anahtar yalnızca akturkenerji.com ve localhost'tan, yalnızca Map Tiles API için çalışır.

export type Imagery = { template: string; maxNativeZoom: number; attribution: string; source: "google" | "esri" };

export const ESRI: Imagery = {
  template: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  maxNativeZoom: 19,
  attribution: "Görüntü © Esri, Maxar, Earthstar Geographics",
  source: "esri",
};

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CACHE = "aktrk_gtile_session";
let pending: Promise<Imagery> | null = null;

/** Karo adresi şablonunu doldurur ({z}, {x}, {y}). */
export const tileUrl = (im: Imagery, z: number, x: number, y: number) => im.template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));

export function getImagery(): Promise<Imagery> {
  if (!KEY) return Promise.resolve(ESRI);
  pending ??= (async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE) ?? "null") as { session: string; expiry: number } | null;
      let session = cached && cached.expiry * 1000 > Date.now() + 3600e3 ? cached.session : null;
      if (!session) {
        const r = await fetch(`https://tile.googleapis.com/v1/createSession?key=${KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mapType: "satellite", language: "tr-TR", region: "TR" }),
        });
        if (!r.ok) throw new Error(`createSession ${r.status}`);
        const d = (await r.json()) as { session: string; expiry: string };
        session = d.session;
        try {
          sessionStorage.setItem(CACHE, JSON.stringify({ session, expiry: Number(d.expiry) }));
        } catch {
          // oturum deposu kapalıysa her açılışta yeni oturum
        }
      }
      return {
        template: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${KEY}`,
        maxNativeZoom: 20,
        attribution: `Görüntü ©${new Date().getFullYear()} Google`,
        source: "google" as const,
      };
    } catch (e) {
      console.warn("[uydu] Google karoları açılamadı, Esri kullanılıyor:", e);
      return ESRI;
    }
  })();
  return pending;
}
