import { Star } from "lucide-react";

// Yarım yıldız destekli puan gösterimi (ör. 4,5).
export default function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`5 üzerinden ${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} puan`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 fill-line text-line" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="fill-sun text-sun" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
