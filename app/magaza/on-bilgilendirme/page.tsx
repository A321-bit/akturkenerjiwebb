import type { Metadata } from "next";
import Link from "next/link";
import { DisputeTerms, SellerInfo, WithdrawalTerms } from "@/components/store/SalesTerms";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Ön Bilgilendirme Formu",
    description: "Aktürk Enerji Mağaza siparişleri için Mesafeli Sözleşmeler Yönetmeliği kapsamında ön bilgilendirme formu.",
    path: "/magaza/on-bilgilendirme",
  }),
  robots: { index: false, follow: true },
};

export default async function PreInformationPage() {
  const site = await getSiteSettings();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Ön Bilgilendirme Formu</h1>
      <p className="mt-2 text-[13px] text-slate">Son güncelleme: 1 Kasım 2026</p>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, siparişiniz
          kesinleşmeden önce bilgilendirilmeniz için hazırlanmıştır.
        </p>

        <h2>1. Satıcı</h2>
        <SellerInfo site={site} />

        <h2>2. Ürün ve fiyat</h2>
        <p>
          Ürünün temel nitelikleri, garanti süresi ve KDV dahil fiyatı ürün sayfasında yazar. Fiyatlar döviz kuruna bağlı olarak
          değişebilir; geçerli olan, sipariş onayından önce size yazılı olarak bildirilen ve onayladığınız toplam tutardır. Kurulum, ayrıca
          belirtilmedikçe fiyata dahil değildir.
        </p>

        <h2>3. Teslimat masrafı</h2>
        <p>
          Ürün fiyatlarına nakliye ücreti dahil değildir. Nakliye ücreti ürünün ağırlığına, hacmine ve teslimat adresine göre hesaplanır,
          sipariş onayından önce yazılı olarak bildirilir ve onayınız olmadan alınmaz.
        </p>

        <h2>4. Sipariş, ödeme ve teslimat</h2>
        <ul>
          <li>Sipariş WhatsApp, telefon veya e-posta ile verilir; size iletilen ürün, tutar ve teslimat bilgisini yazılı olarak onaylamanızla kesinleşir.</li>
          <li>Ödeme yöntemi ve varsa taksit koşulları sipariş onayından önce yazılı olarak bildirilir.</li>
          <li>Teslimat Türkiye genelinde yapılır. Süreler ve koşullar <Link href="/magaza/teslimat-ve-iade">Teslimat ve İade Politikası</Link>&apos;nda yazar. Teslim süresi siparişten itibaren 30 günü geçemez.</li>
          <li>Teklif ve fiyat bilgisinin geçerlilik süresi sipariş onayında belirtilir.</li>
        </ul>

        <h2>5. Cayma hakkı</h2>
        <WithdrawalTerms site={site} />

        <h2>6. Ayıplı mal ve garanti</h2>
        <p>
          Ayıplı mal hâlinde 6502 sayılı Kanun&apos;daki onarım, ücretsiz değişim, bedel indirimi ve sözleşmeden dönme seçimlik
          haklarınızı kullanabilirsiniz. Üretici garantisi süreleri ürün sayfasında yazar.
        </p>

        <h2>7. Şikâyet ve uyuşmazlık</h2>
        <DisputeTerms />
      </div>
    </div>
  );
}
