import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Sparkline({
  values,
  min,
  max,
  className,
}: {
  values: number[];
  min?: number;
  max?: number;
  className?: string;
}) {
  const w = 120;
  const h = 36;
  const safe = values.length > 1 ? values : [0, 0];

  const vMin =
    min ??
    safe.reduce((a, b) => (b < a ? b : a), Number.POSITIVE_INFINITY);
  const vMax =
    max ??
    safe.reduce((a, b) => (b > a ? b : a), Number.NEGATIVE_INFINITY);

  const span = vMax - vMin || 1;
  const step = w / (safe.length - 1);

  const points = safe
    .map((v, i) => {
      const x = i * step;
      const t = (v - vMin) / span;
      const y = h - clamp(t, 0, 1) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-9 w-28", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

