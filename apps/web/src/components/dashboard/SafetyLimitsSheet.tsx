function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SafetyLimitsSheet({
  open,
  maxAltitudeM,
  speedLimitPct,
  onMaxAltitudeChange,
  onSpeedLimitChange,
  onClose,
}: {
  open: boolean;
  maxAltitudeM: number;
  speedLimitPct: number;
  onMaxAltitudeChange: (m: number) => void;
  onSpeedLimitChange: (pct: number) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close safety limits"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-[84px] mx-auto max-w-md px-4">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Safety limits</div>
              <div className="mt-2 text-sm leading-6 text-slate-200/80">
                These limits cap your controls. Use them for safer practice and safer real flights.
              </div>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
              onClick={onClose}
            >
              Done
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[22px] bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200/70">Max altitude</div>
                <div className="text-xs font-semibold tabular-nums text-slate-200/80">
                  {maxAltitudeM.toFixed(1)}m
                </div>
              </div>
              <input
                type="range"
                min={0.5}
                max={6}
                step={0.1}
                value={maxAltitudeM}
                className="mt-3 h-10 w-full accent-white"
                onChange={(e) => onMaxAltitudeChange(clamp(Number(e.target.value), 0.5, 6))}
              />
              <div className="mt-2 text-xs text-slate-200/65">
                If the drone rises above this, throttle is capped to help keep you safe.
              </div>
            </div>

            <div className="rounded-[22px] bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200/70">Speed limiter</div>
                <div className="text-xs font-semibold tabular-nums text-slate-200/80">
                  {Math.round(speedLimitPct)}%
                </div>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={1}
                value={speedLimitPct}
                className="mt-3 h-10 w-full accent-white"
                onChange={(e) => onSpeedLimitChange(clamp(Number(e.target.value), 20, 100))}
              />
              <div className="mt-2 text-xs text-slate-200/65">
                Limits pitch/roll/yaw and caps throttle. Lower = gentler flight.
              </div>
            </div>

            <div className="rounded-[22px] border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Tip: Start with 1.5m max altitude and 40–60% speed while learning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
