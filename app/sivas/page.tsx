import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ebru ❤",
  robots: { index: false, follow: false },
};

// Geçici sürpriz sayfası (kısa süre sonra kaldırılacak).
const BASE = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/sivas/";
const PHOTOS = Array.from({ length: 30 }, (_, i) => `${BASE}${String(i + 1).padStart(2, "0")}.webp`);
const TOP = PHOTOS.slice(0, 15);
const BOTTOM = PHOTOS.slice(15);

const HEARTS = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.7) % 8,
  duration: 6 + ((i * 13) % 7),
  size: 18 + ((i * 11) % 36),
  char: ["❤", "💖", "💕", "💗", "💘"][i % 5],
}));

function PhotoStrip({ photos, duration }: { photos: string[]; duration: number }) {
  const loop = [...photos, ...photos];
  return (
    <div className="relative z-10 w-full overflow-hidden py-2">
      <div className="flex w-max gap-3 will-change-transform" style={{ WebkitAnimation: `photo-slide ${duration}s linear infinite`, animation: `photo-slide ${duration}s linear infinite` }}>
        {loop.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="eager"
            decoding="async"
            className="h-[22vh] w-auto shrink-0 rounded-2xl border-4 border-white object-cover shadow-[0_8px_24px_rgba(225,29,72,0.3)] sm:h-[26vh]"
          />
        ))}
      </div>
    </div>
  );
}

export default function SivasPage() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-gradient-to-br from-rose-100 via-pink-200 to-rose-300 py-4">
      <style>{`
        @keyframes heart-rise {
          0% { transform: translateY(110vh) scale(0.8) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-20vh) scale(1.2) rotate(25deg); opacity: 0; }
        }
        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.12); }
          30% { transform: scale(1); }
          45% { transform: scale(1.08); }
        }
        @keyframes photo-slide {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {HEARTS.map((h, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute bottom-0 z-20"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animation: `heart-rise ${h.duration}s linear ${h.delay}s infinite`,
            opacity: 0,
          }}
        >
          {h.char}
        </span>
      ))}

      <PhotoStrip photos={TOP} duration={70} />

      <div className="relative z-10 px-6 text-center" style={{ animation: "heart-beat 1.6s ease-in-out infinite" }}>
        <h1 className="font-display text-5xl font-bold tracking-tight text-rose-600 drop-shadow-[0_4px_12px_rgba(225,29,72,0.35)] sm:text-7xl">
          ❤️ EBRUUU ❤️
        </h1>
        <p className="mt-2 font-display text-3xl font-bold text-rose-700 sm:text-5xl">SENİ ÇOK SEVİYORUM</p>
        <p className="mt-2 text-3xl sm:text-4xl">💖💕💗💘💞</p>
      </div>

      <PhotoStrip photos={BOTTOM} duration={60} />
    </div>
  );
}
