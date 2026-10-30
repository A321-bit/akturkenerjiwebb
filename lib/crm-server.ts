import { adminClient } from "@/lib/data";
import { phoneKey } from "@/lib/crm";

// Yeni talepler müşteri kartına kendiliğinden düşer. Talep akışını asla bozmaz: hata yalnız loglanır.

type NewCustomer = { name?: string | null; phone?: string | null; email?: string | null; province?: string | null; district?: string | null; address?: string | null; source: string; at?: string | null };

export async function ensureCustomers(list: NewCustomer[]) {
  try {
    const rows = new Map<string, Record<string, unknown>>();
    for (const c of list) {
      const key = phoneKey(c.phone);
      if (!key || rows.has(key)) continue;
      rows.set(key, { full_name: (c.name ?? "").trim().slice(0, 120) || "İsimsiz", phone: String(c.phone).slice(0, 30), phone_key: key, email: c.email || null, province: c.province || null, district: c.district || null, address: c.address || null, source: c.source.slice(0, 120), ...(c.at ? { created_at: c.at } : {}) });
    }
    if (!rows.size) return;
    const { error } = await adminClient().from("customers").upsert([...rows.values()], { onConflict: "phone_key", ignoreDuplicates: true });
    if (error) console.error("[crm] müşteri kartı açılamadı:", error.message);
  } catch (e) {
    console.error("[crm] müşteri kartı açılamadı:", e);
  }
}
