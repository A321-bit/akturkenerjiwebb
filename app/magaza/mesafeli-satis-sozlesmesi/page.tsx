import type { Metadata } from "next";
import Link from "next/link";
import { DisputeTerms, SellerInfo, WithdrawalTerms } from "@/components/store/SalesTerms";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mesafeli Satış Sözleşmesi",
    description: "Aktürk Enerji Mağaza siparişleri için mesafeli satış sözleşmesi.",
    path: "/magaza/mesafeli-satis-sozlesmesi",
  }),
  robots: { index: false, follow: true },
};

export default async function DistanceSalesPage() {
  const site = await getSiteSettings();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Mesafeli Satış Sözleşmesi</h1>
      <p className="mt-2 text-[13px] text-slate">Son güncelleme: 1 Kasım 2026</p>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <h2>1. Taraflar</h2>
        <p><strong>Satıcı:</strong></p>
        <SellerInfo site={site} />
        <p><strong>Alıcı:</strong> Siparişi veren ve ad, adres ve iletişim bilgileri sipariş onayında yer alan kişi.</p>

        <h2>2. Konu</h2>
        <p>
          Bu sözleşme, Alıcı&apos;nın Satıcı&apos;dan uzaktan iletişim araçlarıyla satın aldığı ürünlerin satışı ve teslimine ilişkin
          hak ve yükümlülükleri, 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde düzenler.
        </p>

        <h2>3. Ürün, bedel ve teslimat bilgisi</h2>
        <p>
          Ürünün adı, adedi, KDV dahil satış bedeli, nakliye ücreti, ödeme yöntemi, teslimat adresi ve teslim süresi, Alıcı&apos;ya yazılı
          olarak iletilen sipariş onayında yer alır. Sipariş onayı bu sözleşmenin ayrılmaz parçasıdır.
        </p>

        <h2>4. Kurulma ve teyit</h2>
        <p>
          Alıcı, <Link href="/magaza/on-bilgilendirme">Ön Bilgilendirme Formu</Link>&apos;nu okuduğunu ve sipariş onayını yazılı olarak
          onayladığında sözleşme kurulur. Satıcı, sözleşme metnini ve sipariş bilgilerini Alıcı&apos;ya e-posta veya WhatsApp gibi kalıcı
          bir veri saklayıcısıyla, en geç teslimata kadar iletir.
        </p>

        <h2>5. Teslimat</h2>
        <ul>
          <li>Ürün, siparişten itibaren en geç 30 gün içinde Alıcı&apos;nın bildirdiği adrese teslim edilir. Bu süre aşılacaksa Alıcı bilgilendirilir.</li>
          <li>Ürün teslim edilene kadar oluşan kayıp ve hasardan Satıcı sorumludur.</li>
          <li>Alıcı&apos;nın, teslim sırasında ambalajı kontrol etmesi ve hasar varsa tutanak tutturup aynı gün Satıcı&apos;ya bildirmesi istenir; bu, Alıcı&apos;nın yasal haklarını ortadan kaldırmaz.</li>
          <li>Ürün tedarik edilemezse Satıcı durumu derhal bildirir ve ödenen tutarı en geç 14 gün içinde iade eder.</li>
        </ul>

        <h2>6. Cayma hakkı</h2>
        <WithdrawalTerms site={site} />

        <h2>7. Ayıplı mal ve garanti</h2>
        <p>
          Ayıplı malda Alıcı, 6502 sayılı Kanun&apos;daki seçimlik haklarını kullanabilir. Ürünler üretici garantisi kapsamındadır; garanti
          başvurularında süreci Satıcı yürütür.
        </p>

        <h2>8. Kişisel veriler</h2>
        <p>Alıcı&apos;nın kişisel verileri <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link>&apos;ne uygun olarak işlenir.</p>

        <h2>9. Uyuşmazlık</h2>
        <DisputeTerms />
      </div>
    </div>
  );
}
