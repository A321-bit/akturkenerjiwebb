// Marka logoları sonsuz döngüde yavaşça kayar (admin → Mağaza Ayarları).
// Liste art arda basılır; animasyon -50%'ye kaydığında başa dönüş görünmez olur.
export default function BrandStrip({ title, brands }: { title: string; brands: { name: string; logo: string }[] }) {
  if (brands.length === 0) return null;
  const repeat = Math.max(2, Math.ceil(16 / brands.length)) * 2;
  const loop = Array.from({ length: repeat }, () => brands).flat();
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper-raised py-8">
      <h2 className="text-center font-display text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="brand-marquee relative mt-6">
        <div className="brand-marquee-track flex w-max items-center">
          {loop.map((b, i) => (
            <div key={`${b.name}-${i}`} className="flex h-16 w-[200px] shrink-0 items-center justify-center px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logo}
                alt={i < brands.length ? `${b.name} logosu` : ""}
                aria-hidden={i >= brands.length}
                loading="lazy"
                className="max-h-12 w-auto max-w-[150px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
