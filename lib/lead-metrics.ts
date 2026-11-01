// Raporlardaki sayımlar: gerçek talep (bırakılan numara) ile buton tıklaması ayrı tutulur. Tıklama,
// mesaj yazıldığını veya arandığını kanıtlamaz; reklam ağı botları da aynı butona art arda basabiliyor.

const phoneKey = (phone?: string | null) => (phone ?? "").replace(/\D/g, "").slice(-10);

// Şirket içi deneme numaraları (virgülle ayrılmış) talep sayılmaz.
const INTERNAL_PHONES = new Set((process.env.INTERNAL_LEAD_PHONES ?? "").split(",").map(phoneKey).filter(Boolean));

/** Aynı numaranın ilk talebini bırakır; `seen` paylaşılırsa kaynaklar arası tekrar da elenir. */
export function firstByPhone<T>(rows: T[], phone: (row: T) => string | null | undefined, seen = new Set<string>()): T[] {
  return rows.filter((row) => {
    const key = phoneKey(phone(row));
    if (!key) return true;
    if (INTERNAL_PHONES.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const isContactClick = (label?: string | null) => /whatsapp|call_button|store_call/.test(label ?? "");
export const isWhatsappClick = (label?: string | null) => /whatsapp/.test(label ?? "");

/** Aynı şehirden aynı butona 30 dakika içindeki tekrar tıklamaları tek sayar. */
export function dedupeClicks<T extends { label: string | null; city: string | null; created_at: string }>(rows: T[]): T[] {
  const last = new Map<string, number>();
  return [...rows]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .filter((r) => {
      const key = `${r.label}|${r.city ?? "?"}`;
      const at = new Date(r.created_at).getTime();
      const prev = last.get(key);
      last.set(key, at);
      return prev == null || at - prev > 30 * 60e3;
    });
}

/** Google dönüşüm işleminin yalnızca site butonuna dokunma olup olmadığı. */
export const isClickConversion = (action: string) => /whatsapp_click|phone_call_click/.test(action);
