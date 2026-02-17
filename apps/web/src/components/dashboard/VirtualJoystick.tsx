import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type StickValue = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function VirtualJoystick({
  label,
  disabled,
  className,
  onChange,
  onCommit,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: StickValue) => void;
  onCommit?: (value: StickValue) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const [target, setTarget] = useState<StickValue>({ x: 0, y: 0 });
  const [display, setDisplay] = useState<StickValue>({ x: 0, y: 0 });

  const radiusPx = 56;
  const knobPx = useMemo(
    () => ({
      x: (display.x / 100) * radiusPx,
      y: (-display.y / 100) * radiusPx,
    }),
    [display.x, display.y],
  );

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplay((d) => {
        const nx = lerp(d.x, target.x, 0.22);
        const ny = lerp(d.y, target.y, 0.22);
        return Math.abs(nx - d.x) < 0.15 && Math.abs(ny - d.y) < 0.15
          ? target
          : { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  useEffect(() => {
    onChange(display);
  }, [display, onChange]);

  const setFromClientPoint = (clientX: number, clientY: number) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const max = radiusPx;
    const k = dist > max ? max / (dist || 1) : 1;
    const clampedX = dx * k;
    const clampedY = dy * k;
    const xPct = clamp((clampedX / max) * 100, -100, 100);
    const yPct = clamp((-clampedY / max) * 100, -100, 100);
    setTarget({ x: xPct, y: yPct });
  };

  const release = () => {
    pointerIdRef.current = null;
    setTarget({ x: 0, y: 0 });
    onCommit?.({ x: 0, y: 0 });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-200/80">{label}</div>
        <div className="text-[11px] font-semibold tabular-nums text-slate-200/70">
          {Math.round(display.x)}, {Math.round(display.y)}
        </div>
      </div>
      <div
        ref={rootRef}
        className={cn(
          "relative h-[150px] select-none rounded-[28px] border border-white/10 bg-white/5",
          disabled ? "opacity-50" : "",
        )}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (disabled) return;
          pointerIdRef.current = e.pointerId;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setFromClientPoint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (disabled) return;
          if (pointerIdRef.current !== e.pointerId) return;
          setFromClientPoint(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          release();
        }}
        onPointerCancel={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          release();
        }}
        onPointerLeave={() => {
          if (pointerIdRef.current == null) return;
          release();
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-[112px] w-[112px] rounded-full border border-white/10 bg-black/10" />
        </div>
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full",
            "bg-white text-slate-950 shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
            disabled ? "" : "transition-transform duration-75",
          )}
          style={{ transform: `translate(calc(-50% + ${knobPx.x}px), calc(-50% + ${knobPx.y}px))` }}
        />
      </div>
    </div>
  );
}

