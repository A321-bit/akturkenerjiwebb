import { ChevronDown } from "lucide-react";

// Mağaza SSS (admin panel → Mağaza → Mağaza Ayarları).
export default function StoreFaq({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (faqs.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Sık sorulan sorular</h2>
      <div className="mt-4 flex flex-col gap-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-paper-raised px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
              {f.q}
              <ChevronDown size={18} className="shrink-0 text-brand transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-slate">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
