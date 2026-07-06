import type { Metadata } from "next";
import { services } from "@/lib/site-config";
import ServiceCard from "@/components/ServiceCard";

export const metadata: Metadata = {
  title: "Hizmetlerimiz",
  description:
    "Villa çatı GES, müteahhit projeleri, tarımsal sulama, rüzgar-hibrit sistemler, lityum batarya depolama ve daha fazlası — Aktürk Enerji hizmetleri.",
  alternates: { canonical: "/hizmetlerimiz" },
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Hizmetlerimiz
      </p>
      <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Solar sektörünün her ihtiyacına tek adresten çözüm
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        Konut çatılarından tarımsal arazilere, müteahhit projelerinden mühendislik
        başvurularına kadar güneş enerjisi ekosisteminin her aşamasında yer alıyoruz.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} />
        ))}
      </div>
    </div>
  );
}
