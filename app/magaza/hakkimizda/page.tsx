import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";
import { getStoreSettings } from "@/lib/store-data";
import { priceNoteText } from "@/lib/store";
import MdxContent from "@/components/MdxContent";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mağaza Hakkında",
    description: "Aktürk Enerji Mağaza: 2016'dan beri Ankara merkezli güneş enerjisi paketleri, ürünleri ve anahtar teslim kurulum.",
    path: "/magaza/hakkimizda",
  }),
  robots: { index: false, follow: true },
};

export default async function StoreAboutPage() {
  const [site, google, store] = await Promise.all([getSiteSettings(), getGoogleReviews(), getStoreSettings()]);

  return (
    <div className="flex flex-col gap-10">
      <section className="max-w-3xl">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Hakkımızda</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {store.aboutTitle || `${site.foundedYear}'dan beri güneş enerjisi işindeyiz`}
        </h1>
        {store.aboutContent && (
          <div className="prose prose-neutral mt-5 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-slate prose-li:text-slate">
            <MdxContent source={store.aboutContent} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-6 rounded-2xl border border-line bg-paper-raised p-6 sm:grid-cols-3">
        {site.stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="mt-1 text-[13px] text-slate">{s.label}</p>
          </div>
        ))}
      </section>

      <TrustStrip google={google} items={store.trustItems} />
      <HowToOrder steps={store.orderSteps} note={priceNoteText(store)} />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/magaza"
          className="rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          Ürünlere göz atın
        </Link>
        <Link
          href="/magaza/referanslar"
          className="rounded-full border border-line px-5 py-3 text-[14.5px] font-semibold text-ink hover:border-ink"
        >
          Referanslarımız
        </Link>
      </div>
    </div>
  );
}
