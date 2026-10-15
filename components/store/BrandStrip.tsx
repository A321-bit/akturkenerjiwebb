// "Yetkili Satış Bayiliklerimiz": logolar sonsuz döngüde yavaşça kayar.
// Logolar markaların resmi sitelerinden alındı (public/brands). Liste art arda
// basılır; animasyon -50%'ye kaydığında başa dönüş görünmez olur.
const BRANDS = [
  { name: "Tommatech", src: "/brands/tommatech.webp" },
  { name: "Orbus", src: "/brands/orbus.webp" },
  { name: "Havensis", src: "/brands/havensis.webp" },
  { name: "Solinved", src: "/brands/solinved.svg" },
  { name: "Orbit Enerji", src: "/brands/orbit.webp" },
];

export default function BrandStrip() {
  const loop = [...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS];
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper-raised py-8">
      <h2 className="text-center font-display text-xl font-semibold tracking-tight sm:text-2xl">
        Yetkili Satış Bayiliklerimiz
      </h2>
      <div className="brand-marquee relative mt-6">
        <div className="brand-marquee-track flex w-max items-center">
          {loop.map((b, i) => (
            <div key={`${b.name}-${i}`} className="flex h-16 w-[200px] shrink-0 items-center justify-center px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.src}
                alt={i < BRANDS.length ? `${b.name} logosu` : ""}
                aria-hidden={i >= BRANDS.length}
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
