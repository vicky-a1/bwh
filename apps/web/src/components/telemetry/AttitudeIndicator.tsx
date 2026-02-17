import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AttitudeIndicator({
  rollDeg,
  pitchDeg,
  className,
}: {
  rollDeg: number;
  pitchDeg: number;
  className?: string;
}) {
  const roll = clamp(rollDeg, -45, 45);
  const pitch = clamp(pitchDeg, -30, 30);
  const y = (pitch / 30) * 14;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-slate-200/10 bg-slate-950">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-label="Attitude indicator"
        >
          <g transform={`translate(50 50) rotate(${roll}) translate(-50 -50)`}>
            <rect x="0" y={0 + y} width="100" height="55" fill="rgb(15 23 42)" />
            <rect x="0" y={55 + y} width="100" height="55" fill="rgb(2 6 23)" />
            <line
              x1="0"
              x2="100"
              y1={55 + y}
              y2={55 + y}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
            />
            <line x1="25" x2="75" y1={45 + y} y2={45 + y} stroke="rgba(255,255,255,0.25)" />
            <line x1="25" x2="75" y1={65 + y} y2={65 + y} stroke="rgba(255,255,255,0.25)" />
          </g>
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" />
          <path
            d="M20 50 H40 M60 50 H80"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M48 50 L50 46 L52 50"
            fill="rgba(255,255,255,0.8)"
          />
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-200/70">Roll</span>
          <span className="font-semibold">{rollDeg.toFixed(1)}°</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-200/70">Pitch</span>
          <span className="font-semibold">{pitchDeg.toFixed(1)}°</span>
        </div>
        <div className="text-xs text-slate-200/70">
          Keep the horizon level for stable flight.
        </div>
      </div>
    </div>
  );
}

