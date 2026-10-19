import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE_URL } from "./data";
import { fonts } from "./social-card";

// Sahibinden ilan açıklamasının en üstüne konan sabit marka görseli (her ilanda aynı).
// 1370×620 üretilir (sahibinden açıklama alanı masaüstünde ~685 px → 2 kat net);
// mobilde ~360 px'e küçüldüğünde de okunsun diye yazılar büyük tutulur.
// Solda logo + bayilik + slogan + rozetler, sağda gerçek kurulumdan drone fotoğrafı,
// altta hizmet şeridi.

const W = 1370;
const H = 620;
const STRIP = 92;
const PHOTO_W = 540;
// Ankara, çok yüzeyli çatılı villa GES projesi (referanslar).
const PHOTO = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/references/355e52b2-fe22-4489-835c-3bff3a55e7e5-opt.webp";

async function dataUrl(url: string, w?: number, h?: number): Promise<string> {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const out = w && h ? await sharp(buf).resize(w, h, { fit: "cover", position: "centre" }).jpeg({ quality: 88 }).toBuffer() : buf;
  return `data:image/${w && h ? "jpeg" : "png"};base64,${out.toString("base64")}`;
}

let cache: Promise<Buffer> | null = null;

export function renderSahibindenBanner(): Promise<Buffer> {
  cache ??= render().catch((e) => {
    cache = null;
    throw e;
  });
  return cache;
}

async function render(): Promise<Buffer> {
  const [logo, photo] = await Promise.all([dataUrl(`${SITE_URL}/akturk-enerji-logo.png`), dataUrl(PHOTO, PHOTO_W + 80, H - STRIP)]);
  const chip = (text: string) => (
    <div style={{ display: "flex", background: "#1f5fa0", color: "#ffffff", fontSize: 30, fontWeight: 700, padding: "10px 20px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{text}</div>
  );
  const png = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#ffffff", fontFamily: "Space Grotesk" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) yalnızca düz img destekler */}
        <img src={photo} width={PHOTO_W + 80} height={H - STRIP} alt="" style={{ position: "absolute", top: 0, right: 0 }} />
        {/* Beyaz alanın çapraz kenarı ve mavi aksan çizgisi */}
        <div style={{ position: "absolute", top: -40, left: W - PHOTO_W - 140, width: 150, height: H + 80, background: "#2e7fc4", transform: "rotate(9deg)" }} />
        <div style={{ position: "absolute", top: -40, left: W - PHOTO_W - 170, width: 150, height: H + 80, background: "#ffffff", transform: "rotate(9deg)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: W - PHOTO_W - 60, height: H - STRIP, background: "#ffffff" }} />

        <div style={{ position: "absolute", top: 46, left: 60, width: W - PHOTO_W - 150, display: "flex", flexDirection: "column" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) yalnızca düz img destekler */}
          <img src={logo} width={640} height={114} alt="Aktürk Enerji" />
          <div style={{ display: "flex", marginTop: 26, fontSize: 32, fontWeight: 700, color: "#d62828", letterSpacing: 5 }}>İÇ ANADOLU BÖLGE BAYİ</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14, fontSize: 52, fontWeight: 700, color: "#12355b", lineHeight: 1.08 }}>
            <span>Güneşten ve Rüzgârdan</span>
            <span>Kendi Elektriğinizi Üretin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 30, gap: 14 }}>
            {chip("2016'dan beri")}
            {chip("1.265+ proje")}
            {chip("10+ MWp")}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: W,
            height: STRIP,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#12355b",
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          ON GRID · OFF GRID · HİBRİT · TARIMSAL SULAMA · RÜZGÂR
        </div>
      </div>
    ),
    { width: W, height: H, fonts: await fonts() },
  );
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
