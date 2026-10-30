import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase";

// Personel girişi ve yetkileri. Parola özeti ve yetkiler integration_tokens tablosunda (yalnız sunucu erişir)
// "staff:<id>" anahtarıyla durur. Sahip hesabı bu düzenin dışındadır: şifre + iki adımlı doğrulama aynen geçerli.

export type StaffPerms = {
  /** Maliyet, kâr oranı ve kârı görür. */
  cost: boolean;
  /** Fiyat kurallarını ve katalog değerlerini değiştirir (maliyet yetkisi de gerekir). */
  rules: boolean;
  /** Tüm müşterileri görür; kapalıysa kendine atanmış ve atanmamış olanları. */
  allCustomers: boolean;
  /** Şirket özetini (ciro, personel, kanallar) görür. */
  dashboard: boolean;
};

export const NO_PERMS: StaffPerms = { cost: false, rules: false, allCustomers: false, dashboard: false };

export const ROLE_PRESETS: Record<string, { ad: string; perms: StaffPerms }> = {
  satis: { ad: "Satış", perms: NO_PERMS },
  muhendis: { ad: "Mühendis", perms: { ...NO_PERMS, allCustomers: true } },
  yonetici: { ad: "Yönetici", perms: { cost: true, rules: true, allCustomers: true, dashboard: true } },
};

export type SessionUser = { kind: "owner" } | { kind: "staff"; id: number; name: string; perms: StaffPerms };

export const ownerPerms: StaffPerms = { cost: true, rules: true, allCustomers: true, dashboard: true };
export const permsOf = (u: SessionUser | null): StaffPerms => (u?.kind === "owner" ? ownerPerms : u?.kind === "staff" ? u.perms : NO_PERMS);

/** Personel oturumu, sunucunun yazdığı bu önekle ayırt edilir. */
export const STAFF_UA_PREFIX = "staff:";

type Cred = { hash: string; salt: string; perms: StaffPerms };
const provider = (id: number) => `staff:${id}`;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

export function checkPassword(password: string, cred: { hash: string; salt: string }) {
  const a = Buffer.from(cred.hash, "hex");
  const b = scryptSync(password, cred.salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readCred(id: number): Promise<Cred | null> {
  const { data } = await supabaseAdmin().from("integration_tokens").select("token_enc").eq("provider", provider(id)).maybeSingle();
  if (!data) return null;
  try {
    const c = JSON.parse(data.token_enc) as Cred;
    return { ...c, perms: { ...NO_PERMS, ...c.perms } };
  } catch {
    return null;
  }
}

export async function writeCred(id: number, cred: Cred) {
  const { error } = await supabaseAdmin().from("integration_tokens").upsert({ provider: provider(id), token_enc: JSON.stringify(cred), updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function removeCred(id: number) {
  await supabaseAdmin().from("integration_tokens").delete().eq("provider", provider(id));
}

/** Oturum satırının user_agent alanından kullanıcı. Etkin olmayan ya da girişi kaldırılan personel geçersizdir. */
export async function userFromSession(userAgent: string | null): Promise<SessionUser | null> {
  if (!userAgent?.startsWith(STAFF_UA_PREFIX)) return { kind: "owner" };
  const id = Number(userAgent.slice(STAFF_UA_PREFIX.length).split("|")[0]);
  if (!Number.isFinite(id)) return null;
  const [{ data: s }, cred] = await Promise.all([supabaseAdmin().from("staff").select("full_name, active").eq("id", id).maybeSingle(), readCred(id)]);
  if (!s?.active || !cred) return null;
  return { kind: "staff", id, name: s.full_name, perms: cred.perms };
}

// Personelin girebileceği sayfa ve API'ler; geri kalan her şey (mağaza, reklam, güvenlik, ayarlar) kapalıdır.
const STAFF_PAGES = ["/admin/yonetim", "/admin/musteriler", "/admin/teklif-studyosu", "/admin/teklif-takip"];
const STAFF_APIS = ["/api/admin/customers", "/api/admin/crm", "/api/admin/proposals", "/api/admin/quote-settings", "/api/admin/parsel", "/api/admin/store/usd-rate", "/api/admin/logout", "/api/admin/me"];
const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const staffCanOpen = (path: string, perms: StaffPerms) => {
  if (path.startsWith("/api/")) return STAFF_APIS.some((b) => under(path, b)) || (perms.allCustomers && under(path, "/api/admin/calculations"));
  return STAFF_PAGES.some((b) => under(path, b)) || (perms.allCustomers && under(path, "/admin/hesaplama-talepleri"));
};
export const STAFF_HOME = "/admin/yonetim";
