const steps = [
  {
    n: "01",
    title: "Güneş Işınımı",
    text: "Güneş panelleri gün boyu gelen ışınımı doğru akıma çevirir.",
  },
  {
    n: "02",
    title: "Panel Üretimi",
    text: "Yüksek verimli paneller çatınızda ya da arazinizde enerjiyi üretir.",
  },
  {
    n: "03",
    title: "İnvertör Dönüşümü",
    text: "İnvertör, doğru akımı tesisinizin kullandığı alternatif akıma çevirir.",
  },
  {
    n: "04",
    title: "Kullanım & Batarya",
    text: "Enerji anında kullanılır, fazlası bataryada depolanır ya da şebekeye verilir.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Nasıl Çalışır
      </p>
      <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Güneşten prize giden yol
      </h2>

      {/* Mobil: kompakt dikey zaman çizelgesi */}
      <ol className="relative mt-10 space-y-7 border-l border-line pl-7 sm:hidden">
        {steps.map((s) => (
          <li key={s.n} className="relative">
            <span className="absolute -left-[38px] top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand bg-paper font-mono-data text-[12px] font-semibold text-brand">
              {s.n}
            </span>
            <h3 className="font-display text-[15.5px] font-semibold text-ink">{s.title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate">{s.text}</p>
          </li>
        ))}
      </ol>

      {/* Tablet & masaüstü: yatay akış çizgili grid */}
      <div className="relative mt-14 hidden sm:block">
        <svg
          className="pointer-events-none absolute left-0 top-[26px] hidden w-full lg:block"
          height="4"
          viewBox="0 0 1000 4"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="60"
            y1="2"
            x2="940"
            y2="2"
            stroke="var(--brand)"
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <line
            x1="60"
            y1="2"
            x2="940"
            y2="2"
            stroke="var(--sun)"
            strokeWidth="2"
            className="animate-dash-flow"
          />
        </svg>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative flex flex-col items-start">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand bg-paper font-mono-data text-[15px] font-semibold text-brand">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-[16px] font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
