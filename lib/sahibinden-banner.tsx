import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE_URL } from "./data";
import { fonts } from "./social-card";
import type { StoreProduct } from "./store";

// Sahibinden ilan açıklamasının en üstündeki açılış görseli (1200×520 JPEG):
// yeni logo + bayilik satırı + paket adı + paketin öne çıkan özellikleri +
// firma bilgisi. Açıklamaya <img> olarak bu sitenin adresinden eklenir.

/** Paket içeriğinden kısa özellik satırı: "16 × 620 Wp Panel · 11 kW İnverter · 14,3 kWh Lityum". */
export function packageHighlights(p: StoreProduct): string[] {
  const out: string[] = [];
  const panel = p.contents.map((c) => c.match(/(\d+)\s*adet\s+TommaTech\s+(\d+)\s*Wp/i)).find(Boolean);
  if (panel) out.push(`${panel[1]} × ${panel[2]} Wp Panel`);
  const inv = p.contents.map((c) => c.match(/(?:TommaTech|adet)[^,(]*?\b([\d,]+)\s*kW\b[^,]*?(inverter|sürücü)/i)).find(Boolean);
  if (inv) out.push(`${inv[1]} kW ${/sürücü/i.test(inv[2]) ? "Pompa Sürücüsü" : "İnverter"}`);
  let kwh = 0;
  for (const c of p.contents) {
    const t = c.match(/toplam\s+([\d,]+)\s*kWh/i) ?? c.match(/\(([\d,]+)\s*kWh\)/i) ?? c.match(/([\d,]+)\s*kWh\s+(?:lityum|modüler)/i);
    if (t) kwh = Math.max(kwh, parseFloat(t[1].replace(",", ".")));
  }
  if (kwh) out.push(`${kwh.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kWh Lityum Batarya`);
  return out;
}

let logoPromise: Promise<string> | null = null;
function logo() {
  logoPromise ??= fetch(`${SITE_URL}/akturk-enerji-logo.png`)
    .then((r) => r.arrayBuffer())
    .then((b) => `data:image/png;base64,${Buffer.from(b).toString("base64")}`);
  return logoPromise;
}

export async function renderSahibindenBanner(p: StoreProduct | null): Promise<Buffer> {
  const width = 1200;
  const height = 520;
  const highlights = p ? packageHighlights(p) : [];
  const logoSrc = await logo();
  const png = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "Space Grotesk",
          borderBottom: "10px solid #2e7fc4",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) yalnızca düz img destekler */}
        <img src={logoSrc} width={760} height={136} alt="Aktürk Enerji" />
        <div style={{ display: "flex", marginTop: 26, fontSize: 30, fontWeight: 700, color: "#d62828", letterSpacing: 6 }}>
          — İÇ ANADOLU BÖLGE BAYİ —
        </div>
        {p ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 1120 }}>
            <div style={{ display: "flex", marginTop: 14, fontSize: p.name.length > 46 ? 36 : 42, fontWeight: 700, color: "#1f5fa0", textAlign: "center", justifyContent: "center" }}>
              {p.name}
            </div>
            {highlights.length > 0 && (
              <div style={{ display: "flex", marginTop: 12, fontSize: 27, fontWeight: 600, color: "#1b7a3a", textAlign: "center", justifyContent: "center" }}>
                {highlights.join("  ·  ")}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 14, fontSize: 42, fontWeight: 700, color: "#1f5fa0" }}>Güneşten ve Rüzgârdan Kendi Elektriğinizi Üretin</div>
        )}
        <div style={{ display: "flex", marginTop: 18, fontSize: 25, fontWeight: 500, color: "#3d3d3d" }}>
          {"2016'dan beri Ankara · 1265+ tamamlanan proje · 10+ MWp kurulu güç"}
        </div>
      </div>
    ),
    { width, height, fonts: await fonts() },
  );
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
