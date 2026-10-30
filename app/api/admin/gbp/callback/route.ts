import { cookies } from "next/headers";
import { exchangeCode, verifyState } from "@/lib/gbp";

// Google izin ekranından dönüş. Admin çerezi SameSite=Strict olduğundan bu istekte gönderilmez;
// proxy bu yolu serbest bırakır, yetki imzalı durum değeri ve Lax nonce çereziyle doğrulanır.
// Sonuç sayfası site içinden yönlendirir, böylece admin çerezi sonraki istekte yeniden gider.

const page = (ok: boolean, message: string) =>
  new Response(
    `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="${ok ? 1 : 6};url=/admin/google-isletme"><title>Google İşletme</title><body style="font:16px system-ui;padding:40px"><p>${message}</p><p><a href="/admin/google-isletme">Panele dön</a></p></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const store = await cookies();
  const nonce = store.get("gbp_oauth_nonce")?.value;
  store.delete({ name: "gbp_oauth_nonce", path: "/api/admin/gbp" });
  if (!verifyState(q.get("state"), nonce)) return page(false, "Bağlantı doğrulanamadı. Lütfen panelden yeniden deneyin.");
  if (q.get("error")) return page(false, "Google izni verilmedi.");
  const code = q.get("code");
  if (!code) return page(false, "Google yanıtı eksik.");
  try {
    await exchangeCode(code);
  } catch (e) {
    console.error("[gbp/callback]", e);
    return page(false, "Bağlantı tamamlanamadı. Lütfen yeniden deneyin.");
  }
  return page(true, "Google İşletme hesabı bağlandı, panele yönlendiriliyorsunuz…");
}
