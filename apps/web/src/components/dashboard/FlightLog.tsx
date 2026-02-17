import { useMemo } from "react";
import { Card } from "@/components/Card";
import { Sparkline } from "@/components/telemetry/Sparkline";
import { cn } from "@/lib/cn";
import type { DroneTelemetryFrame } from "@/lib/telemetry/types";

type FlightEvent = {
  ts: number;
  label: string;
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${Math.max(1, s)}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function FlightLog({
  frames,
  events,
  className,
}: {
  frames: DroneTelemetryFrame[];
  events: FlightEvent[];
  className?: string;
}) {
  const alt = useMemo(() => frames.map((f) => f.altitudeM), [frames]);
  const bat = useMemo(() => frames.map((f) => f.battery.percent), [frames]);
  const last = frames[frames.length - 1] ?? null;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Flight Log</h2>
          <p className="mt-1 text-xs text-slate-200/70">
            Watch trends while you practice. The same log will work on real hardware.
          </p>
        </div>
        <div className="text-right text-[11px] font-semibold text-slate-200/70">
          {last ? new Date(last.ts).toLocaleTimeString() : "—"}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200/70">
              <span>Altitude</span>
              <span className="tabular-nums">{last ? `${last.altitudeM.toFixed(2)}m` : "—"}</span>
            </div>
            <Sparkline values={alt} className="mt-3 opacity-90" />
          </div>
          <div className="rounded-3xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200/70">
              <span>Battery</span>
              <span className="tabular-nums">{last ? `${Math.round(last.battery.percent)}%` : "—"}</span>
            </div>
            <Sparkline values={bat} className="mt-3 opacity-90" />
          </div>
        </div>

        <div className="rounded-3xl bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-200/70">Events</div>
            <div className="text-[11px] font-semibold text-slate-200/50">{events.length}</div>
          </div>
          {events.length === 0 ? (
            <div className="mt-2 text-xs text-slate-200/60">No events yet. Try Takeoff or Hover.</div>
          ) : (
            <div className="mt-2 grid gap-2">
              {events.slice(0, 5).map((e) => (
                <div
                  key={`${e.ts}-${e.label}`}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="font-semibold">{e.label}</div>
                  <div className="text-slate-200/60">{timeAgo(e.ts)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

