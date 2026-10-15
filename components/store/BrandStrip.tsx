// Kullandığımız markalar. Logolar üreticilerin resmi sitelerinden alındı (public/brands).
const BRANDS = [
  { name: "Tommatech", src: "/brands/tommatech.webp" },
  { name: "Deye", src: "/brands/deye.webp" },
  { name: "Exelon", src: "/brands/exelon.webp" },
  { name: "Kalyon PV", src: "/brands/kalyon.svg" },
];

export default function BrandStrip() {
  return (
    <section className="rounded-2xl border border-line bg-paper-raised px-6 py-7">
      <p className="text-center font-mono-data text-[12px] uppercase tracking-[0.16em] text-slate-soft">
        Paketlerimizde kullandığımız markalar
      </p>
      <div className="mt-5 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-4">
        {BRANDS.map((b) => (
          <div key={b.name} className="flex h-14 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.src}
              alt={`${b.name} logosu`}
              loading="lazy"
              className="max-h-12 w-auto max-w-[160px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
