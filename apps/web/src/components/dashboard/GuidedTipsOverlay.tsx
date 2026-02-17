import { cn } from "@/lib/cn";

type Tip = {
  title: string;
  body: string;
};

const TIPS: Tip[] = [
  {
    title: "1) Start the simulator",
    body: "Tap Start Simulator. Telemetry updates every second, just like your future drone.",
  },
  {
    title: "2) Safety first",
    body: "Check battery and signal before Takeoff. If anything feels wrong, hit Emergency Stop.",
  },
  {
    title: "3) Hover training",
    body: "Use Hover to practice staying near 1.5m altitude. Small changes are best.",
  },
  {
    title: "4) Advanced sticks",
    body: "When ready, switch to Advanced Mode. Left stick = Throttle/Yaw, Right stick = Pitch/Roll.",
  },
];

export function GuidedTipsOverlay({
  open,
  step,
  onStepChange,
  onClose,
  className,
}: {
  open: boolean;
  step: number;
  onStepChange: (next: number) => void;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  const t = TIPS[step] ?? TIPS[0];
  const canBack = step > 0;
  const canNext = step < TIPS.length - 1;

  return (
    <div className={cn("fixed inset-0 z-50", className)} role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close tips"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-[84px] mx-auto max-w-md px-4">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-200/80">{t.body}</div>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-200/60">
              Tip {step + 1} / {TIPS.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-2xl px-4 py-2 text-xs font-semibold",
                  canBack ? "bg-white/10 text-white" : "bg-white/5 text-white/40",
                )}
                disabled={!canBack}
                onClick={() => onStepChange(step - 1)}
              >
                Back
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-2xl px-4 py-2 text-xs font-semibold",
                  canNext ? "bg-white text-slate-950" : "bg-white/5 text-white/40",
                )}
                disabled={!canNext}
                onClick={() => onStepChange(step + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

