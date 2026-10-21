// Meta form başvurusu durumları ve tipi (istemci tarafında da kullanılır; sunucu kodu içermez).

/** Personelin seçtiği durumlar ve Meta'ya gidecek CRM aşaması adları (null: gönderilmez). */
export const LEAD_STATUSES = [
  { key: "Yeni", event: null },
  { key: "Ulaşılamadı", event: "Ulasilamadi" },
  { key: "İlgisiz", event: "Ilgisiz" },
  { key: "Nitelikli", event: "Nitelikli" },
  { key: "Keşif Planlandı", event: "Kesif_Planlandi" },
  { key: "Teklif Verildi", event: "Teklif_Verildi" },
  { key: "Satış", event: "Satis" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["key"];

export type MetaLead = {
  id: string;
  created_time: string;
  form_name: string | null;
  ad_name: string | null;
  adset_name: string | null;
  campaign_name: string | null;
  platform: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  answers: { name: string; value: string }[];
  status: LeadStatus;
  note: string | null;
  status_changed_at: string | null;
  capi_log: { event: string; at: string; ok: boolean; error?: string }[];
};
