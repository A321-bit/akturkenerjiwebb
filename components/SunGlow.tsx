export default function SunGlow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--sun)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#sunGlow)" className="animate-pulse-slow" />
      <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <line
              key={i}
              x1="200"
              y1="200"
              x2="200"
              y2="60"
              stroke="var(--sun)"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}
      </g>
      <circle cx="200" cy="200" r="46" fill="var(--sun)" fillOpacity="0.15" />
      <circle cx="200" cy="200" r="30" fill="var(--sun)" fillOpacity="0.25" />
    </svg>
  );
}
