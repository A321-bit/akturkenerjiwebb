import { createClient } from "@supabase/supabase-js";

// Herkese açık okuma için — tarayıcıda da güvenle kullanılabilir (RLS: sadece select).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// Sadece sunucu tarafında (API route, server component, admin sayfaları) kullanılır.
// RLS'i bypass eder — asla istemciye (browser bundle'a) sızdırılmamalı.
export function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
