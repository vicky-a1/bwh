import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pctColor(pct: number) {
  if (pct >= 60) return "text-emerald-300";
  if (pct >= 30) return "text-amber-300";
  return "text-rose-300";
}

export function BatteryGauge({
  percent,
  voltage,
  className,
}: {
  percent: number;
  voltage: number;
  className?: string;
}) {
  const p = clamp(percent, 0, 100);
  const barW = `${p}%`;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-end justify-between">
        <div className={cn("text-2xl font-semibold tracking-tight", pctColor(p))}>
          {p.toFixed(0)}%
        </div>
        <div className="text-xs font-semibold text-slate-200/70">
          {voltage.toFixed(2)}V
        </div>
      </div>
      <div className="h-3 w-full rounded-full bg-white/10">
        <div
          className={cn(
            "h-3 rounded-full",
            p >= 60 ? "bg-emerald-400" : p >= 30 ? "bg-amber-400" : "bg-rose-400",
          )}
          style={{ width: barW }}
        />
      </div>
      <div className="text-xs text-slate-200/70">
        Battery is safest above 30%. Land early if it drops fast.
      </div>
    </div>
  );
}

