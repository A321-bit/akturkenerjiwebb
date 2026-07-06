import { createClient } from "@supabase/supabase-js";

// Vercel'in fonksiyon ortamında Supabase'e giden istekler bazen düşük seviyeli
// bir ağ hatasıyla (ECONNRESET/ETIMEDOUT/DNS vb.) başarısız oluyor ve bu,
// supabase-js'in normal { data, error } sonucuna değil, ham bir "TypeError:
// fetch failed" istisnasına dönüşüyor. Bu sarmalayıcı hem gerçek nedeni
// (error.cause) loglar hem de kısa bir geri çekilmeyle 3 kez dener — çoğu
// geçici ağ hatası bu şekilde kendiliğinden düzelir.
async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      const cause = err instanceof Error ? err.cause : undefined;
      console.error(
        `[supabase fetch] deneme ${attempt}/${maxAttempts} başarısız:`,
        err instanceof Error ? err.message : err,
        "cause:",
        cause
      );
      if (attempt === maxAttempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw new Error("unreachable");
}

// Herkese açık okuma için — tarayıcıda da güvenle kullanılabilir (RLS: sadece select).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: resilientFetch } }
);

// Sadece sunucu tarafında (API route, server component, admin sayfaları) kullanılır.
// RLS'i bypass eder — asla istemciye (browser bundle'a) sızdırılmamalı.
export function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    global: { fetch: resilientFetch },
  });
}
