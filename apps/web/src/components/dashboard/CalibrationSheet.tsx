import { cn } from "@/lib/cn";

export function CalibrationSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close checklist"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-[84px] mx-auto max-w-md px-4">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Pre-flight checklist</div>
              <div className="mt-2 text-sm leading-6 text-slate-200/80">
                Before flying real hardware, always do these quick checks.
              </div>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
              onClick={onClose}
            >
              Later
            </button>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-200/80">
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              1) Calibrate IMU (level surface)
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              2) Remove props while testing motors
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-3">
              3) Verify battery and signal are strong
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
              onClick={onClose}
            >
              Keep reminding me
            </button>
            <button
              type="button"
              className={cn(
                "rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950",
              )}
              onClick={onConfirm}
            >
              I did this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

