"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { AttitudeIndicator } from "@/components/telemetry/AttitudeIndicator";
import { BatteryGauge } from "@/components/telemetry/BatteryGauge";
import { Sparkline } from "@/components/telemetry/Sparkline";
import { CalibrationSheet } from "@/components/dashboard/CalibrationSheet";
import { FlightLog } from "@/components/dashboard/FlightLog";
import { GuidedTipsOverlay } from "@/components/dashboard/GuidedTipsOverlay";
import { SafetyLimitsSheet } from "@/components/dashboard/SafetyLimitsSheet";
import { SignalBars } from "@/components/dashboard/SignalBars";
import { SkillProgress } from "@/components/dashboard/SkillProgress";
import { VirtualJoystick } from "@/components/dashboard/VirtualJoystick";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api/react";
import { useTelemetrySimulator } from "@/lib/telemetry/useTelemetry";
import type { DroneControls, DroneMode } from "@/lib/telemetry/types";
import type { FirmwareRelease } from "@/lib/api/types";

const MODES: { key: DroneMode; label: string; hint: string }[] = [
  { key: "STABILIZE", label: "Stabilize", hint: "Keeps the drone level." },
  { key: "ALT_HOLD", label: "Altitude Hold", hint: "Helps keep height steady." },
  { key: "GUIDED", label: "Guided", hint: "Assisted moves for lessons." },
];

const DEFAULT_DRONE_WS_URL = process.env.NEXT_PUBLIC_DRONE_WS_URL ?? "";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deadzone(n: number, zone: number) {
  return Math.abs(n) < zone ? 0 : n;
}

type PracticeStats = {
  sessions: number;
  takeoffs: number;
  landings: number;
  emergencyStops: number;
  crashes: number;
  flightSeconds: number;
  hoverSeconds: number;
  stableSeconds: number;
  advancedSeconds: number;
  lowBatteryTakeoffs: number;
  maxAltitudeM: number;
};

export function DashboardClient() {
  const api = useApi();
  const {
    running,
    frame,
    controls,
    altitudeHistory,
    batteryHistory,
    frames,
    events,
    connection,
    connectSimulator,
    connectWebSocket,
    disconnect,
    setControls,
    logEvent,
  } = useTelemetrySimulator();

  const connected = running && !!frame;

  const [uiMode, setUiMode] = useState<"beginner" | "advanced">(() => {
    if (typeof window === "undefined") return "beginner";
    return window.localStorage.getItem("bwh_dash_mode") === "advanced"
      ? "advanced"
      : "beginner";
  });
  const [training, setTraining] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("bwh_dash_training") !== "0";
  });
  const [tipsOpen, setTipsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("bwh_dash_tips_dismissed") !== "1";
  });
  const [tipsStep, setTipsStep] = useState(0);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistDone, setChecklistDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("bwh_dash_checklist_done") === "1";
  });
  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"sim" | "real">(() => {
    if (typeof window === "undefined") return "sim";
    return window.localStorage.getItem("bwh_dash_connection_mode") === "real" ? "real" : "sim";
  });
  const [wsUrl, setWsUrl] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_DRONE_WS_URL;
    return window.localStorage.getItem("bwh_dash_ws_url") ?? DEFAULT_DRONE_WS_URL;
  });
  const [maxAltitudeM, setMaxAltitudeM] = useState(() => {
    if (typeof window === "undefined") return 1.5;
    const raw = window.localStorage.getItem("bwh_dash_max_alt_m");
    const n = raw ? Number(raw) : 1.5;
    return Number.isFinite(n) ? clamp(n, 0.5, 6) : 1.5;
  });
  const [speedLimitPct, setSpeedLimitPct] = useState(() => {
    if (typeof window === "undefined") return 60;
    const raw = window.localStorage.getItem("bwh_dash_speed_limit");
    const n = raw ? Number(raw) : 60;
    return Number.isFinite(n) ? clamp(n, 20, 100) : 60;
  });
  const [latestFirmware, setLatestFirmware] = useState<FirmwareRelease | null>(null);
  const [practice, setPractice] = useState<PracticeStats>(() => {
    if (typeof window === "undefined") {
      return {
        sessions: 0,
        takeoffs: 0,
        landings: 0,
        emergencyStops: 0,
        crashes: 0,
        flightSeconds: 0,
        hoverSeconds: 0,
        stableSeconds: 0,
        advancedSeconds: 0,
        lowBatteryTakeoffs: 0,
        maxAltitudeM: 0,
      };
    }

    const raw = window.localStorage.getItem("bwh_dash_practice_v1");
    if (!raw) {
      return {
        sessions: 0,
        takeoffs: 0,
        landings: 0,
        emergencyStops: 0,
        crashes: 0,
        flightSeconds: 0,
        hoverSeconds: 0,
        stableSeconds: 0,
        advancedSeconds: 0,
        lowBatteryTakeoffs: 0,
        maxAltitudeM: 0,
      };
    }

    try {
      const parsed = JSON.parse(raw) as PracticeStats;
      return {
        sessions: Number(parsed.sessions ?? 0) || 0,
        takeoffs: Number(parsed.takeoffs ?? 0) || 0,
        landings: Number(parsed.landings ?? 0) || 0,
        emergencyStops: Number(parsed.emergencyStops ?? 0) || 0,
        crashes: Number(parsed.crashes ?? 0) || 0,
        flightSeconds: Number(parsed.flightSeconds ?? 0) || 0,
        hoverSeconds: Number(parsed.hoverSeconds ?? 0) || 0,
        stableSeconds: Number(parsed.stableSeconds ?? 0) || 0,
        advancedSeconds: Number(parsed.advancedSeconds ?? 0) || 0,
        lowBatteryTakeoffs: Number(parsed.lowBatteryTakeoffs ?? 0) || 0,
        maxAltitudeM: Number(parsed.maxAltitudeM ?? 0) || 0,
      };
    } catch {
      return {
        sessions: 0,
        takeoffs: 0,
        landings: 0,
        emergencyStops: 0,
        crashes: 0,
        flightSeconds: 0,
        hoverSeconds: 0,
        stableSeconds: 0,
        advancedSeconds: 0,
        lowBatteryTakeoffs: 0,
        maxAltitudeM: 0,
      };
    }
  });

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_training", training ? "1" : "0");
  }, [training]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_connection_mode", connectionMode);
  }, [connectionMode]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_ws_url", wsUrl);
  }, [wsUrl]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_max_alt_m", String(maxAltitudeM));
  }, [maxAltitudeM]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_speed_limit", String(speedLimitPct));
  }, [speedLimitPct]);

  useEffect(() => {
    window.localStorage.setItem("bwh_dash_practice_v1", JSON.stringify(practice));
  }, [practice]);

  const safety = useMemo(() => {
    if (!frame) return { ready: false, label: "Waiting" };
    if (frame.battery.percent < 20) return { ready: false, label: "Low battery" };
    if (frame.link.rssiDbm < -75) return { ready: false, label: "Weak signal" };
    return { ready: true, label: "Ready" };
  }, [frame]);

  const warnings = useMemo(() => {
    if (!frame) return [];
    const w: { tone: "danger" | "warn"; text: string }[] = [];
    if (frame.battery.percent < 20) w.push({ tone: "danger", text: "Low battery — land soon." });
    else if (frame.battery.percent < 35) w.push({ tone: "warn", text: "Battery getting low." });
    if (frame.link.rssiDbm < -80) w.push({ tone: "danger", text: "Weak signal — stay close." });
    else if (frame.link.rssiDbm < -72) w.push({ tone: "warn", text: "Signal is dropping." });
    if (latestFirmware && frame.firmwareVersion && frame.firmwareVersion !== latestFirmware.version) {
      w.push({
        tone: "warn",
        text: `Firmware mismatch — drone ${frame.firmwareVersion}, latest ${latestFirmware.version}.`,
      });
    }
    if (connected && !checklistDone) w.push({ tone: "warn", text: "Calibration reminder — check before real flights." });
    return w;
  }, [checklistDone, connected, frame, latestFirmware]);

  const throttleCapPct = useMemo(() => {
    const altCap = (maxAltitudeM / 6) * 100;
    return clamp(Math.min(speedLimitPct, altCap), 0, 100);
  }, [maxAltitudeM, speedLimitPct]);

  const stickCapPct = useMemo(() => {
    const maxStick = training ? 55 : 100;
    return clamp(Math.min(maxStick, speedLimitPct), 10, 100);
  }, [speedLimitPct, training]);

  const refreshLatestFirmware = async () => {
    try {
      const fw = await api.getLatestFirmware();
      setLatestFirmware(fw);
    } catch {
      return;
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fw = await api.getLatestFirmware();
        if (!cancelled) setLatestFirmware(fw);
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const sendControls = useCallback(
    (next: Partial<DroneControls>) => {
      const out: Partial<DroneControls> = { ...next };
      if (typeof out.throttle === "number") out.throttle = clamp(out.throttle, 0, throttleCapPct);
      if (typeof out.yaw === "number") out.yaw = clamp(out.yaw, -stickCapPct, stickCapPct);
      if (typeof out.pitch === "number") out.pitch = clamp(out.pitch, -stickCapPct, stickCapPct);
      if (typeof out.roll === "number") out.roll = clamp(out.roll, -stickCapPct, stickCapPct);
      setControls(out);
    },
    [setControls, stickCapPct, throttleCapPct],
  );

  const skillData = useMemo(() => {
    const flight = Math.max(practice.flightSeconds, 1);
    const safetyPct = clamp(
      100 - practice.emergencyStops * 6 - practice.lowBatteryTakeoffs * 12 - practice.crashes * 10,
      0,
      100,
    );
    const hoverPct = clamp((practice.hoverSeconds / flight) * 100, 0, 100);
    const controlPct = clamp(((practice.stableSeconds + practice.advancedSeconds * 0.3) / flight) * 100, 0, 100);
    const minutes = Math.round(practice.flightSeconds / 60);
    const summary =
      practice.sessions > 0
        ? `${practice.sessions} practice sessions • ${minutes} min flight time • ${practice.crashes} crash events`
        : "Start a session to track your practice.";

    return { safetyPct, hoverPct, controlPct, summary };
  }, [practice]);

  const onTakeoff = () => {
    sendControls({
      armed: true,
      mode: training ? "GUIDED" : "ALT_HOLD",
      throttle: training ? 28 : 35,
    });
    setPractice((prev) => ({
      ...prev,
      takeoffs: prev.takeoffs + 1,
      lowBatteryTakeoffs: prev.lowBatteryTakeoffs + (frame && frame.battery.percent < 25 ? 1 : 0),
    }));
    logEvent("Takeoff");
  };

  const onLand = () => {
    sendControls({ throttle: 0 });
    window.setTimeout(() => sendControls({ armed: false }), 900);
    setPractice((prev) => ({ ...prev, landings: prev.landings + 1 }));
    logEvent("Land");
  };

  const onHover = () => {
    sendControls({
      armed: true,
      mode: "ALT_HOLD",
      throttle: 25,
      yaw: 0,
      pitch: 0,
      roll: 0,
    });
    logEvent("Hover");
  };

  const onEmergency = () => {
    sendControls({ throttle: 0, armed: false, yaw: 0, roll: 0, pitch: 0 });
    setPractice((prev) => ({ ...prev, emergencyStops: prev.emergencyStops + 1 }));
    logEvent("Emergency Stop");
  };

  const leftRef = useRef({ x: 0, y: 0 });
  const rightRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(frame);
  const lastCrashTsRef = useRef(0);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    if (!connected) return;

    const id = window.setInterval(() => {
      const f = frameRef.current;
      if (!f) return;

      if (f.status.armed && f.altitudeM > 0.2) {
        setPractice((prev) => ({
          ...prev,
          flightSeconds: prev.flightSeconds + 1,
          hoverSeconds: prev.hoverSeconds + (f.altitudeM >= 1 && f.altitudeM <= 2.1 ? 1 : 0),
          stableSeconds:
            prev.stableSeconds +
            (Math.abs(f.attitude.rollDeg) < 8 && Math.abs(f.attitude.pitchDeg) < 8 ? 1 : 0),
          advancedSeconds: prev.advancedSeconds + (uiMode === "advanced" ? 1 : 0),
          maxAltitudeM: Math.max(prev.maxAltitudeM, f.altitudeM),
        }));
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [connected, uiMode]);

  useEffect(() => {
    if (!connected) return;
    if (frames.length < 3) return;

    const last = frames[frames.length - 1];
    const prev = frames[frames.length - 2];
    const dt = last.ts - prev.ts;
    if (dt < 10 || dt > 2000) return;

    const possibleCrash =
      prev.status.armed &&
      prev.altitudeM > 1.0 &&
      last.altitudeM < 0.18 &&
      Math.abs(prev.altitudeM - last.altitudeM) > 0.9;

    if (!possibleCrash) return;

    if (last.ts - lastCrashTsRef.current < 8000) return;
    lastCrashTsRef.current = last.ts;

    window.setTimeout(() => {
      setPractice((p) => ({ ...p, crashes: p.crashes + 1 }));
      logEvent("Crash detected");
    }, 0);
  }, [connected, frames, logEvent]);

  useEffect(() => {
    if (!connected) return;
    if (uiMode !== "advanced") return;

    const id = window.setInterval(() => {
      if (!safety.ready) return;
      if (!controls.armed) return;

      const left = leftRef.current;
      const right = rightRef.current;

      const yaw = deadzone(left.x, 6);
      const throttlePct = clamp((left.y + 100) / 2, 0, 100);
      const throttle = training ? clamp(throttlePct, 0, 70) : throttlePct;

      const pitch = deadzone(right.y, 6);
      const roll = deadzone(right.x, 6);

      sendControls({
        mode: training ? "GUIDED" : controls.mode,
        throttle,
        yaw,
        pitch,
        roll,
      });
    }, 50);

    return () => window.clearInterval(id);
  }, [connected, controls.armed, controls.mode, safety.ready, sendControls, training, uiMode]);

  const statusChip = useMemo(() => {
    if (connection.kind === "ws") {
      if (connection.status === "connecting") return { label: "Connecting…", tone: "neutral" as const };
      if (connection.status === "connected") return { label: "Real Drone", tone: "ok" as const };
      return { label: "Drone Error", tone: "danger" as const };
    }
    if (connection.kind === "sim") return { label: "Simulator", tone: "ok" as const };
    return { label: connectionMode === "real" ? "Real Drone" : "Simulator", tone: "neutral" as const };
  }, [connection, connectionMode]);

  return (
    <main className="flex min-h-[calc(100dvh-160px)] flex-col">
      <header className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Drone Control</h1>
            <p className="mt-1 text-sm leading-6 text-slate-200/80">
              Telemetry on top. Thumb controls on the bottom.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                "rounded-2xl px-3 py-1 text-xs font-semibold",
                statusChip.tone === "ok"
                  ? "bg-emerald-400 text-slate-950"
                  : statusChip.tone === "danger"
                    ? "bg-rose-500/20 text-rose-100"
                    : "bg-white/10 text-white",
              )}
            >
              {statusChip.label}
            </div>
            <div className="text-[11px] font-semibold text-slate-200/60">
              {frame?.droneId ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                connectionMode === "sim" ? "bg-white text-slate-950" : "bg-white/10 text-white",
              )}
              onClick={() => {
                if (connected) disconnect();
                setConnectionMode("sim");
              }}
            >
              Simulator
            </button>
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                connectionMode === "real" ? "bg-white text-slate-950" : "bg-white/10 text-white",
              )}
              onClick={() => {
                if (connected) disconnect();
                setConnectionMode("real");
              }}
            >
              Real Drone
            </button>
          </div>

          {connectionMode === "real" ? (
            <div className="rounded-[28px] bg-white/5 p-4">
              <div className="text-xs font-semibold text-slate-200/70">Drone WebSocket URL</div>
              <input
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder={DEFAULT_DRONE_WS_URL || "wss://…"}
                className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <div className="mt-2 text-xs text-slate-200/65">
                Use your ESP32 bridge URL. This dashboard also works with simple JSON frames.
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                !connected ? "bg-white text-slate-950" : "bg-white/10 text-white",
              )}
              onClick={() => {
                if (!connected) {
                  void refreshLatestFirmware();
                  setPractice((p) => ({ ...p, sessions: p.sessions + 1 }));
                  if (connectionMode === "sim") connectSimulator();
                  else connectWebSocket(wsUrl.trim());
                  if (!checklistDone) setChecklistOpen(true);
                  return;
                }
                disconnect();
              }}
            >
              {connected ? "Stop" : connectionMode === "sim" ? "Start Simulator" : "Connect Drone"}
            </button>

            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                uiMode === "beginner" ? "bg-white text-slate-950" : "bg-white/10 text-white",
                !connected ? "opacity-70" : "",
              )}
              onClick={() => setUiMode("beginner")}
            >
              Beginner
            </button>
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                uiMode === "advanced" ? "bg-white text-slate-950" : "bg-white/10 text-white",
                !connected ? "opacity-70" : "",
              )}
              onClick={() => setUiMode("advanced")}
            >
              Advanced
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => setSafetySheetOpen(true)}
            >
              Safety Limits
            </button>
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => setChecklistOpen(true)}
            >
              Pre-flight List
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[28px] bg-white/5 p-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200/70">Battery</div>
                <div className={cn("text-xs font-semibold", frame && frame.battery.percent < 20 ? "text-rose-200" : "text-slate-200/80")}>
                  {frame ? `${Math.round(frame.battery.percent)}%` : "—"}
                </div>
              </div>
              {frame ? (
                <BatteryGauge percent={frame.battery.percent} voltage={frame.battery.voltage} />
              ) : (
                <div className="text-xs text-slate-200/60">Start the simulator to view battery.</div>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200/70">Signal</div>
                <div className={cn("text-xs font-semibold", safety.ready ? "text-emerald-200" : "text-rose-200")}>
                  {frame ? safety.label : "Waiting"}
                </div>
              </div>
              {frame ? (
                <SignalBars rssiDbm={frame.link.rssiDbm} />
              ) : (
                <div className="text-xs text-slate-200/60">No telemetry yet.</div>
              )}
              <div className="text-[11px] font-semibold text-slate-200/60">
                Latency: {frame ? `${frame.link.latencyMs}ms` : "—"}
              </div>
            </div>
          </div>

          {warnings.length > 0 ? (
            <div className="grid gap-2">
              {warnings.slice(0, 3).map((w) => (
                <div
                  key={w.text}
                  className={cn(
                    "rounded-[22px] border px-4 py-3 text-sm font-semibold",
                    w.tone === "danger"
                      ? "border-rose-300/25 bg-rose-500/10 text-rose-100"
                      : "border-amber-300/25 bg-amber-500/10 text-amber-100",
                  )}
                >
                  {w.text}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex-1 space-y-4 pb-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Orientation</h2>
              <p className="mt-1 text-xs text-slate-200/70">
                Keep the horizon level while learning.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => {
                setTipsStep(0);
                setTipsOpen(true);
              }}
            >
              Tips
            </button>
          </div>
          <div className="mt-4 rounded-[28px] bg-white/5 p-4">
            <AttitudeIndicator
              rollDeg={frame?.attitude.rollDeg ?? 0}
              pitchDeg={frame?.attitude.pitchDeg ?? 0}
            />
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <div className="text-slate-200/70">Yaw</div>
                <div className="mt-0.5 font-semibold tabular-nums">
                  {frame ? `${frame.attitude.yawDeg.toFixed(1)}°` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <div className="text-slate-200/70">Altitude</div>
                <div className="mt-0.5 font-semibold tabular-nums">
                  {frame ? `${frame.altitudeM.toFixed(2)}m` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <div className="text-slate-200/70">Temp</div>
                <div className="mt-0.5 font-semibold tabular-nums">
                  {frame ? `${frame.env.temperatureC.toFixed(1)}°C` : "—"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Training</h2>
              <p className="mt-1 text-xs text-slate-200/70">
                Training mode limits speed for safer practice.
              </p>
            </div>
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-semibold",
                training ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-white",
              )}
              onClick={() => setTraining((v) => !v)}
            >
              {training ? "Training ON" : "Training OFF"}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[28px] bg-white/5 p-4">
              <div className="text-xs font-semibold text-slate-200/70">Altitude goal</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold tabular-nums">
                  {frame ? `${frame.altitudeM.toFixed(2)}m` : "—"}
                </div>
                <Sparkline values={altitudeHistory} className="opacity-90" />
              </div>
              <div className="mt-2 text-xs text-slate-200/70">Try to hover near 1.5m.</div>
            </div>
            <div className="rounded-[28px] bg-white/5 p-4">
              <div className="text-xs font-semibold text-slate-200/70">Battery trend</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold tabular-nums">
                  {frame ? `${Math.round(frame.battery.percent)}%` : "—"}
                </div>
                <Sparkline values={batteryHistory} className="opacity-90" />
              </div>
              <div className="mt-2 text-xs text-slate-200/70">Land early when learning.</div>
            </div>
          </div>
        </Card>

        <SkillProgress data={skillData} />

        <FlightLog frames={frames} events={events} />
      </div>

      <div className="sticky bottom-24 mt-auto rounded-[32px] border border-white/10 bg-slate-950/85 p-4 shadow-[0_-22px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">
            {uiMode === "beginner" ? "Beginner Controls" : "Advanced Sticks"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "rounded-2xl px-3 py-2 text-xs font-semibold",
                controls.armed ? "bg-white/10 text-white" : "bg-white text-slate-950",
                !connected ? "opacity-60" : "",
              )}
              disabled={!connected}
              onClick={() => {
                sendControls({ armed: true, throttle: Math.max(controls.throttle, 20) });
                logEvent("Arm");
              }}
            >
              Arm
            </button>
            <button
              type="button"
              className={cn(
                "rounded-2xl px-3 py-2 text-xs font-semibold",
                controls.armed ? "bg-white text-slate-950" : "bg-white/10 text-white",
                !connected ? "opacity-60" : "",
              )}
              disabled={!connected}
              onClick={() => {
                sendControls({ armed: false, throttle: 0, yaw: 0, pitch: 0, roll: 0 });
                logEvent("Disarm");
              }}
            >
              Disarm
            </button>
          </div>
        </div>

        {uiMode === "beginner" ? (
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className={cn(
                  "rounded-[26px] px-4 py-4 text-base font-semibold",
                  connected && safety.ready ? "bg-white text-slate-950" : "bg-white/10 text-white opacity-60",
                )}
                disabled={!connected || !safety.ready}
                onClick={onTakeoff}
              >
                Takeoff
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-[26px] px-4 py-4 text-base font-semibold",
                  connected ? "bg-white/10 text-white" : "bg-white/10 text-white opacity-60",
                )}
                disabled={!connected}
                onClick={onHover}
              >
                Hover
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-[26px] px-4 py-4 text-base font-semibold",
                  connected ? "bg-white/10 text-white" : "bg-white/10 text-white opacity-60",
                )}
                disabled={!connected}
                onClick={onLand}
              >
                Land
              </button>
            </div>

            <button
              type="button"
              className={cn(
                "rounded-[26px] border border-rose-300/30 bg-rose-500/15 px-4 py-4 text-base font-semibold text-rose-100",
                connected ? "" : "opacity-60",
              )}
              disabled={!connected}
              onClick={onEmergency}
            >
              Emergency Stop
            </button>

            <div className="grid gap-2 rounded-[28px] bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200/70">Flight mode</div>
                <div className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold">
                  {controls.mode}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={cn(
                      "rounded-2xl px-3 py-3 text-xs font-semibold",
                      controls.mode === m.key ? "bg-white text-slate-950" : "bg-white/10 text-white",
                      !connected ? "opacity-60" : "",
                    )}
                    disabled={!connected}
                    onClick={() => {
                      sendControls({ mode: m.key });
                      logEvent(`Mode: ${m.label}`);
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-200/70">
                {MODES.find((m) => m.key === controls.mode)?.hint ?? ""}
              </div>
              <button
                type="button"
                className={cn(
                  "mt-1 rounded-2xl bg-white/10 px-3 py-3 text-xs font-semibold text-white",
                  connected ? "" : "opacity-60",
                )}
                disabled={!connected}
                onClick={() => setChecklistOpen(true)}
              >
                Open pre-flight checklist
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <VirtualJoystick
                label="Left stick (Throttle / Yaw)"
                disabled={!connected || !safety.ready}
                onChange={(v) => {
                  leftRef.current = v;
                }}
              />
              <VirtualJoystick
                label="Right stick (Pitch / Roll)"
                disabled={!connected || !safety.ready}
                onChange={(v) => {
                  rightRef.current = v;
                }}
              />
            </div>

            <div className="grid gap-2 rounded-[28px] bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-200/70">Emergency</div>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-100",
                    connected ? "" : "opacity-60",
                  )}
                  disabled={!connected}
                  onClick={onEmergency}
                >
                  STOP
                </button>
              </div>

              <div className="mt-2 grid gap-2">
                <div className="text-[11px] font-semibold text-slate-200/60">
                  Training: {training ? "limits pitch/roll/yaw + caps throttle" : "full range"}
                </div>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl bg-white/10 px-3 py-3 text-xs font-semibold text-white",
                    connected ? "" : "opacity-60",
                  )}
                  disabled={!connected}
                  onClick={() => setChecklistOpen(true)}
                >
                  Calibration checklist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <GuidedTipsOverlay
        open={tipsOpen}
        step={tipsStep}
        onStepChange={setTipsStep}
        onClose={() => {
          setTipsOpen(false);
          window.localStorage.setItem("bwh_dash_tips_dismissed", "1");
        }}
      />

      <CalibrationSheet
        open={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        onConfirm={() => {
          setChecklistOpen(false);
          setChecklistDone(true);
          window.localStorage.setItem("bwh_dash_checklist_done", "1");
        }}
      />

      <SafetyLimitsSheet
        open={safetySheetOpen}
        maxAltitudeM={maxAltitudeM}
        speedLimitPct={speedLimitPct}
        onMaxAltitudeChange={setMaxAltitudeM}
        onSpeedLimitChange={setSpeedLimitPct}
        onClose={() => setSafetySheetOpen(false)}
      />
    </main>
  );
}
