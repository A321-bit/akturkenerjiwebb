import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { LEGAL_NAME } from "@/lib/company";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Çerez Politikası",
    description: "Aktürk Enerji web sitesinde kullanılan çerezler, kullanım amaçları ve çerez tercihlerinizi nasıl değiştirebileceğiniz.",
    path: "/cerez-politikasi",
  }),
  robots: { index: false, follow: true },
};

const ROWS: { group: string; rows: [string, string, string][] }[] = [
  {
    group: "Zorunlu (onay gerekmez)",
    rows: [
      ["aktrk_cerez_tercih", "Çerez tercihinizi saklar (tarayıcı deposu)", "Siz silene kadar"],
      ["Oturum deposu kayıtları", "Canlı destek sohbetinin ve hesaplayıcı özetinin sayfa geçişlerinde korunması", "Sekme kapanana kadar"],
      ["admin_session", "Yalnız yönetim paneli girişi; ziyaretçilere yazılmaz", "Oturum süresince"],
    ],
  },
  {
    group: "Kaynak kaydı (birinci taraf, üçüncü kişiye gönderilmez)",
    rows: [
      ["aktrk_attribution", "Siteye hangi kaynak ve sayfadan geldiğiniz; form gönderirseniz talebinize eklenir. Reklam tıklama kimliği yalnız pazarlama onayıyla kaydedilir.", "30 gün"],
    ],
  },
  {
    group: "Analiz (onayınızla)",
    rows: [
      ["_ga, _ga_*", "Google Analytics: ziyaret ve sayfa ölçümü", "En çok 2 yıl"],
      ["_clck, _clsk, CLID, MUID", "Microsoft Clarity: sayfa kullanımı, tıklama ve oturum kayıtları", "1 gün - 1 yıl"],
    ],
  },
  {
    group: "Pazarlama (onayınızla)",
    rows: [
      ["_gcl_au", "Google Ads: reklam dönüşümü ölçümü", "Yaklaşık 3 ay"],
      ["_fbp, _fbc", "Meta Pikseli: reklam ölçümü ve hedefleme", "Yaklaşık 3 ay"],
    ],
  },
];

export default async function CookiePolicyPage() {
  const site = await getSiteSettings();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Yasal</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Çerez Politikası</h1>
      <p className="mt-2 text-[13px] text-slate">Son güncelleme: 1 Kasım 2026</p>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          Bu politika, {LEGAL_NAME} (&ldquo;Aktürk Enerji&rdquo;) tarafından işletilen web sitesinde kullanılan çerez ve benzeri
          teknolojileri açıklar. Çerezler üzerinden yapılan kişisel veri işleme hakkında ayrıntı için{" "}
          <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link>&apos;ni okuyabilirsiniz.
        </p>

        <h2>Tercihinizi nasıl değiştirirsiniz?</h2>
        <p>Analiz ve pazarlama çerezleri siz onay vermeden yüklenmez. Onayınızı istediğiniz an, verdiğiniz kadar kolay şekilde geri alabilirsiniz.</p>
        <p><CookieSettingsButton className="rounded-lg bg-ink px-4 py-2 text-[14px] font-semibold text-paper" /></p>

        <h2>Kullanılan çerezler</h2>
        {ROWS.map((g) => (
          <div key={g.group}>
            <h3>{g.group}</h3>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Ad</th><th>Amaç</th><th>Süre</th></tr></thead>
                <tbody>{g.rows.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        ))}
        <p>Süreler hizmet sağlayıcıların belgelerine göre yaklaşıktır ve sağlayıcılar tarafından değiştirilebilir.</p>

        <h2>Video ve harita</h2>
        <p>
          YouTube videoları ve Google Haritalar siz tıklamadan yüklenmez. Tıkladığınızda bu hizmetler kendi çerezlerini
          kullanabilir.
        </p>

        <h2>Çerez kullanmayan ölçüm</h2>
        <p>
          Sitemiz, hangi sayfaların görüntülendiğini ve iletişim düğmelerine kaç kez tıklandığını kendi sunucusunda sayar. Bu
          kayıtta sayfa, yönlendiren adres ve IP adresinden çıkarılan il ve ülke bilgisi tutulur; IP adresi ya da sizi tanımlayan bir
          kimlik saklanmaz.
        </p>

        <h2>Tarayıcı ayarları</h2>
        <p>Çerezleri tarayıcınızın ayarlarından da silebilir ya da engelleyebilirsiniz.</p>

        <h2>İletişim</h2>
        <p>Sorularınız için <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> adresine yazabilirsiniz.</p>
      </div>
    </div>
  );
}
