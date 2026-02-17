import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function barColor(pct: number) {
  if (pct >= 80) return "bg-emerald-400";
  if (pct >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

function ProgressRow({
  label,
  pct,
  hint,
}: {
  label: string;
  pct: number;
  hint: string;
}) {
  const p = clamp(Math.round(pct), 0, 100);
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs font-semibold tabular-nums text-slate-200/70">{p}%</div>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div className={cn("h-3 rounded-full", barColor(p))} style={{ width: `${p}%` }} />
      </div>
      <div className="text-xs text-slate-200/65">{hint}</div>
    </div>
  );
}

export type SkillProgressData = {
  safetyPct: number;
  hoverPct: number;
  controlPct: number;
  summary: string;
};

export function SkillProgress({
  data,
  className,
}: {
  data: SkillProgressData;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Skill Progress</h2>
          <p className="mt-1 text-xs text-slate-200/70">{data.summary}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <ProgressRow
          label="Safety"
          pct={data.safetyPct}
          hint="Avoid low-battery takeoffs and use Emergency Stop only when needed."
        />
        <ProgressRow
          label="Hover"
          pct={data.hoverPct}
          hint="Hold 1–2m altitude with small adjustments for longer periods."
        />
        <ProgressRow
          label="Control"
          pct={data.controlPct}
          hint="Keep roll/pitch steady while moving smoothly (Advanced mode helps)."
        />
      </div>
    </Card>
  );
}

