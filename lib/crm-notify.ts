// Aktürk CRM'e "yeni talep var" bildirimi. CRM talebi müşteri + satış hunisi kartı olarak aktarır.
// Kullanıcının isteğini yavaşlatmamak için yanıttan sonra (after) çağrılır; hata talebi etkilemez.
const CRM_URL = (process.env.CRM_URL ?? "https://akturk-crm.vercel.app").replace(/\/$/, "");

export async function notifyCrm(reason: string) {
  const secret = process.env.CRM_BRIDGE_SECRET ?? "";
  if (secret.length < 32) return;
  try {
    const res = await fetch(`${CRM_URL}/api/site/talep`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ reason }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) console.error("[CRM] bildirim başarısız:", res.status, reason);
  } catch (e) {
    console.error("[CRM] bildirim gönderilemedi:", e instanceof Error ? e.message : e);
  }
}
