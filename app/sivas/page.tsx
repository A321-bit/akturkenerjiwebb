import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ebru ❤",
  robots: { index: false, follow: false },
};

// Geçici sürpriz sayfası (kısa süre sonra kaldırılacak).
const HEARTS = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.7) % 8,
  duration: 6 + ((i * 13) % 7),
  size: 18 + ((i * 11) % 36),
  char: ["❤", "💖", "💕", "💗", "💘"][i % 5],
}));

export default function SivasPage() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-pink-200 to-rose-300">
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
      `}</style>

      {HEARTS.map((h, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute bottom-0"
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

      <div className="relative px-6 text-center" style={{ animation: "heart-beat 1.6s ease-in-out infinite" }}>
        <p className="text-[80px] leading-none sm:text-[120px]">❤️</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-rose-600 drop-shadow-[0_4px_12px_rgba(225,29,72,0.35)] sm:text-7xl">
          EBRUUU
        </h1>
        <p className="mt-4 font-display text-3xl font-bold text-rose-700 sm:text-5xl">SENİ ÇOK SEVİYORUM</p>
        <p className="mt-6 text-4xl sm:text-5xl">💖💕💗💘💞</p>
      </div>
    </div>
  );
}
