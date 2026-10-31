import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient, getSiteSettings, SITE_URL } from "@/lib/data";
import { computeNumbers, type Proposal } from "@/lib/teklif/proposal";
import { DEFAULT_SETTINGS, type QuoteSettings } from "@/lib/teklif/pricing";
import { SHARE_TOKEN, forCustomer } from "@/lib/teklif/share";
import ProposalDocument from "@/components/admin/teklif/ProposalDocument";
import LiveProposal from "@/components/teklif/LiveProposal";

// Müşteriye özel canlı teklif sayfası: bağlantıyı bilen açar, arama motorlarına kapalıdır.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Güneş Enerjisi Teklifiniz", robots: { index: false, follow: false } };

const isExpired = (p: Proposal) => new Date(p.createdAt).getTime() + p.validDays * 864e5 < Date.now();

export default async function LiveProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!SHARE_TOKEN.test(token)) notFound();
  const [{ data }, site, { data: st }] = await Promise.all([adminClient().from("proposals").select("id, data").eq("data->>shareToken", token).maybeSingle(), getSiteSettings(), adminClient().from("quote_settings").select("data").eq("id", 1).maybeSingle()]);
  if (!data) notFound();
  // Yalnız belge sayfaları için gereken alanlar; fiyat kuralları ve maliyet buraya taşınmaz.
  const s = { ...DEFAULT_SETTINGS, ...(st?.data as Partial<QuoteSettings> | null) };
  const assets = { references: s.references, banks: s.banks, hesapSahibi: s.hesapSahibi, notlar: s.notlar, garantiDisi: s.garantiDisi };

  const p = { ...(data.data as Proposal), id: data.id };
  const n = computeNumbers(p);
  const company = { name: site.name, phone: site.contact.phoneDisplay, email: site.contact.email, address: site.contact.addressLine, web: SITE_URL.replace(/^https?:\/\//, "") };

  return (
    <>
      <div className="print:hidden">
        <LiveProposal p={forCustomer(p)} n={n} token={token} expired={isExpired(p)} phoneHref={site.contact.phoneHref} phoneDisplay={site.contact.phoneDisplay} whatsappNumber={site.contact.whatsappNumber} />
      </div>
      {/* PDF: yalnız yazdırmada görünür, sunucuda üretilir; maliyet bilgisi içermez. */}
      <div className="hidden print:block">
        <ProposalDocument p={p} n={n} company={company} assets={assets} />
      </div>
    </>
  );
}
