// Admin panelden yüklenen fotoğrafları tarayıcıda büyük boyuttan kaynaklanan
// yavaşlamaya karşı küçültür ve fotoğrafların izinsiz kullanılmasını zorlaştırmak
// için üzerine silik, tekrarlayan bir logo filigranı basar. Sunucuya (ve Supabase
// Storage'a) her zaman bu işlenmiş hâli gider, orijinal dosya hiç yüklenmez.

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const WATERMARK_LOGO_SRC = "/logo.svg";

let cachedLogo: Promise<HTMLImageElement> | null = null;

function loadLogo(): Promise<HTMLImageElement> {
  if (!cachedLogo) {
    cachedLogo = new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Logo yüklenemedi."));
      img.src = WATERMARK_LOGO_SRC;
    });
  }
  return cachedLogo;
}

function drawTiledWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, logo: HTMLImageElement) {
  const logoW = Math.max(140, width * 0.32);
  const logoH = logoW * (logo.height / logo.width);
  const gapX = logoW * 0.9;
  const gapY = logoH * 2.4;
  const diag = Math.sqrt(width * width + height * height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-28 * Math.PI) / 180);
  ctx.globalAlpha = 0.16;

  for (let y = -diag; y < diag; y += gapY) {
    for (let x = -diag; x < diag; x += gapX) {
      ctx.drawImage(logo, x - logoW / 2, y - logoH / 2, logoW, logoH);
    }
  }
  ctx.restore();
}

export async function processImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  try {
    const logo = await loadLogo();
    drawTiledWatermark(ctx, width, height, logo);
  } catch {
    // Logo yüklenemezse filigransız devam et; boyut küçültme yine de uygulanmış olur.
  }

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
