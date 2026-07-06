export async function register() {
  // Vercel'in Node.js çalışma ortamında undici/fetch bazen Supabase'in IPv6
  // adresine bağlanmayı deneyip zaman aşımına uğruyor ("TypeError: fetch failed").
  // DNS çözümlemesini IPv4 öncelikli yapmak bu bilinen sorunu ortadan kaldırır.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
