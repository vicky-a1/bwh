import { cn } from "@/lib/cn";

function strengthFromRssi(rssiDbm: number) {
  if (rssiDbm >= -55) return 4;
  if (rssiDbm >= -65) return 3;
  if (rssiDbm >= -75) return 2;
  if (rssiDbm >= -85) return 1;
  return 0;
}

export function SignalBars({
  rssiDbm,
  className,
}: {
  rssiDbm: number;
  className?: string;
}) {
  const s = strengthFromRssi(rssiDbm);
  return (
    <div className={cn("flex items-end gap-1", className)} aria-label="Signal strength">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-sm",
            i <= s ? "bg-white" : "bg-white/20",
          )}
          style={{ height: 4 + i * 4 }}
        />
      ))}
      <div className="ml-2 text-[11px] font-semibold text-slate-200/80">
        {rssiDbm}dBm
      </div>
    </div>
  );
}

