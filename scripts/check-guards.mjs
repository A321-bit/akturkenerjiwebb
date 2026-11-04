// Derlemeden önce (npm run build → prebuild) çalışır. Kasım 2026'da Vercel ISR ve Supabase
// veri çıkışı kotalarını dolduran hataların geri gelmesini engeller; kural bozulursa derleme
// durur ve canlı site eski, sağlam sürümde kalır. Kurallar ve nedenleri: docs/BAKIM-REHBERI.md
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx|js|mjs)$/.test(e.name) ? [path.join(d, e.name)] : [],
  );
const rel = (f) => path.relative(ROOT, f).replaceAll("\\", "/");
const files = ["app", "components", "lib"].flatMap((d) => walk(path.join(ROOT, d)));

// Admin, API ve kişiye özel teklif sayfası zaten her istekte çalışır; kurallar herkese açık sayfalar için.
const isPrivate = (f) => /^(app\/(admin|api|teklif)|components\/admin)\//.test(f);
const problems = [];

for (const file of files) {
  const f = rel(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const at = `${f}:${i + 1}`;
    // 1) Görseller Supabase'den doğrudan değil, önbellekli /gorsel yolundan (lib/imageLoader.ts) gelir.
    if (line.includes("supabase.co/storage/v1/object/public") && !["lib/imageLoader.ts", "app/gorsel/[...path]/route.ts"].includes(f)) {
      problems.push(`${at}  Supabase görsel adresi doğrudan yazılmış. cdnImage / cdnThumb / cdnImageUrl (lib/imageLoader.ts) kullanın.`);
    }
    if (isPrivate(f)) return;
    // 2) Herkese açık sayfalar önbellekten verilir; bir saatten sık yenileme ISR kotasını doldurur.
    const rv = line.match(/revalidate\s*[:=]\s*(\d+)/);
    if (rv && Number(rv[1]) > 0 && Number(rv[1]) < 3600) {
      problems.push(`${at}  revalidate ${rv[1]} sn: en az 3600 olmalı (Vercel ISR kotası). Değişiklikte admin kaydı önbelleği zaten temizler.`);
    }
    // 3) Herkese açık sayfa her ziyarette yeniden çalıştırılmaz.
    if (/dynamic\s*=\s*["']force-dynamic["']/.test(line) || /revalidate\s*=\s*0\b/.test(line)) {
      problems.push(`${at}  Herkese açık sayfa her istekte çalışacak şekilde ayarlanmış (force-dynamic / revalidate 0).`);
    }
    // 4) Sunucu verisi önbelleği atlanmaz.
    // (lib/ hariç: oradaki no-store çağrılar yalnız admin ve cron'dan kullanılır.)
    if (/cache\s*:\s*["']no-store["']/.test(line) && !/^(lib|app\/gorsel)\//.test(f)) {
      problems.push(`${at}  fetch cache: "no-store" herkese açık kodda: her ziyarette dış servise gider.`);
    }
  });
}

if (problems.length) {
  console.error(`\n✖ Kota koruma kontrolü başarısız (${problems.length}):\n\n  ${problems.join("\n  ")}\n\nAyrıntı: docs/BAKIM-REHBERI.md → "Kod kuralları"\n`);
  process.exit(1);
}
console.log("✓ Kota koruma kontrolü geçti.");
