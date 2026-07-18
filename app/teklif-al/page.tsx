import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, ShieldCheck, Wrench } from "lucide-react";
import { getSiteSettings, getReferences } from "@/lib/data";
import InstantLeadForm from "@/components/InstantLeadForm";

export const dynamic = "force-dynamic";

// Bu sayfa yalnızca Meta (Instagram/Facebook) reklamlarından gelen trafik
// için var — organik aramada görünmesi istenmiyor, bu yüzden noindex.
export const metadata: Metadata = {
  title: "Ücretsiz Keşif ve Fiyat Teklifi",
  description: "Formu doldurun, uzman ekibimiz size özel fiyat teklifiyle dönsün.",
  robots: { index: false, follow: false },
};

export default async function TeklifAlPage() {
  const [settings, references] = await Promise.all([getSiteSettings(), getReferences()]);
  const showcase = references.slice(0, 3);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-5 sm:px-8">
        <Image src="/logo.svg" alt={settings.name} width={281} height={50} priority className="h-9 w-auto" />
      </div>

      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              {settings.city} ve Türkiye Geneli
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Çatınızdan, arazinizden ya da işyerinizden bedava elektrik üretin
            </h1>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-slate">
              {settings.foundedYear}&apos;dan beri villa, tarım, müteahhit ve fabrika
              projelerinde anahtar teslim güneş enerjisi sistemleri kuruyoruz. Formu
              doldurun, uzman ekibimiz size özel fiyat teklifiyle dönsün.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3">
              {settings.stats.slice(0, 3).map((s) => (
                <div key={s.label} className="rounded-xl border border-line bg-paper-raised p-3.5 text-center">
                  <p className="font-display text-[17px] font-bold text-ink sm:text-[19px]">{s.value}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-soft">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              {[
                { icon: BadgeCheck, text: "Ücretsiz keşif ve projelendirme" },
                { icon: ShieldCheck, text: "Ürün ve işçilik garantisi" },
                { icon: Wrench, text: "Anahtar teslim kurulum ve EDAŞ süreci" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-[14px] text-ink">
                  <Icon size={18} className="shrink-0 text-brand" />
                  {text}
                </div>
              ))}
            </div>

            {showcase.length > 0 && (
              <div className="mt-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-soft">
                  Son projelerimizden
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {showcase.map((r) => (
                    <div key={r.id} className="overflow-hidden rounded-lg border border-line">
                      {r.image ? (
                        <Image
                          src={r.image}
                          alt={r.title}
                          width={200}
                          height={140}
                          className="h-20 w-full object-cover sm:h-24"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-8">
            <InstantLeadForm />
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6 text-center text-[12.5px] text-slate-soft">
        © {new Date().getFullYear()} {settings.name} · {settings.contact.phoneDisplay}
      </footer>
    </div>
  );
}
