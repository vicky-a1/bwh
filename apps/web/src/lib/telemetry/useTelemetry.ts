"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTelemetrySimulator } from "./simulator";
import type { DroneControls, DroneTelemetryFrame } from "./types";

type FlightEvent = {
  ts: number;
  label: string;
};

type ConnectionState =
  | { kind: null; status: "disconnected" }
  | { kind: "sim"; status: "connected" }
  | { kind: "ws"; status: "connecting"; url: string }
  | { kind: "ws"; status: "connected"; url: string }
  | { kind: "ws"; status: "error"; url: string; error: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function voltageFromPercent(percent: number) {
  const t = clamp(percent, 0, 100) / 100;
  return Math.round((3.3 + t * 0.9) * 100) / 100;
}

function normalizeIncomingTelemetry(msg: unknown): DroneTelemetryFrame | null {
  if (!msg || typeof msg !== "object") return null;
  const anyMsg = msg as Record<string, unknown>;
  const droneId = typeof anyMsg.droneId === "string" ? anyMsg.droneId : null;
  if (!droneId) return null;

  const ts = typeof anyMsg.ts === "number" ? anyMsg.ts : Date.now();

  const altitudeM = typeof anyMsg.altitudeM === "number" ? anyMsg.altitudeM : 0;
  const batteryPctRaw =
    typeof anyMsg.batteryPct === "number"
      ? anyMsg.batteryPct
      : typeof anyMsg.batteryPercent === "number"
        ? anyMsg.batteryPercent
        : null;
  const batteryPct = batteryPctRaw == null ? 100 : clamp(batteryPctRaw, 0, 100);

  const yawDeg = typeof anyMsg.yawDeg === "number" ? anyMsg.yawDeg : 0;
  const rollDeg = typeof anyMsg.rollDeg === "number" ? anyMsg.rollDeg : 0;
  const pitchDeg = typeof anyMsg.pitchDeg === "number" ? anyMsg.pitchDeg : 0;

  const link =
    anyMsg.link && typeof anyMsg.link === "object"
      ? (anyMsg.link as Record<string, unknown>)
      : null;

  const rssiDbm =
    typeof anyMsg.rssiDbm === "number"
      ? anyMsg.rssiDbm
      : link && typeof link.rssiDbm === "number"
        ? link.rssiDbm
        : -65;
  const latencyMs =
    typeof anyMsg.latencyMs === "number"
      ? anyMsg.latencyMs
      : link && typeof link.latencyMs === "number"
        ? link.latencyMs
        : 60;

  const firmwareVersion =
    typeof anyMsg.firmwareVersion === "string" ? anyMsg.firmwareVersion : undefined;

  const currentA = typeof anyMsg.currentA === "number" ? anyMsg.currentA : 0.4;
  const voltage = typeof anyMsg.voltage === "number" ? anyMsg.voltage : voltageFromPercent(batteryPct);
  const env =
    anyMsg.env && typeof anyMsg.env === "object"
      ? (anyMsg.env as Record<string, unknown>)
      : null;
  const temperatureC =
    typeof anyMsg.temperatureC === "number"
      ? anyMsg.temperatureC
      : env && typeof env.temperatureC === "number"
        ? env.temperatureC
        : 30;

  const status =
    anyMsg.status && typeof anyMsg.status === "object"
      ? (anyMsg.status as Record<string, unknown>)
      : null;
  const armed =
    typeof anyMsg.armed === "boolean"
      ? anyMsg.armed
      : status && typeof status.armed === "boolean"
        ? status.armed
        : false;
  const statusMode =
    status && (status.mode === "STABILIZE" || status.mode === "ALT_HOLD" || status.mode === "GUIDED")
      ? status.mode
      : null;
  const mode =
    anyMsg.mode === "STABILIZE" || anyMsg.mode === "ALT_HOLD" || anyMsg.mode === "GUIDED"
      ? anyMsg.mode
      : statusMode ?? "STABILIZE";

  return {
    ts,
    droneId,
    firmwareVersion,
    link: { rssiDbm, latencyMs },
    battery: { percent: batteryPct, voltage, currentA },
    env: { temperatureC },
    attitude: { rollDeg, pitchDeg, yawDeg },
    altitudeM,
    status: { armed, mode },
  };
}

export function useTelemetrySimulator() {
  const sim = useMemo(() => getTelemetrySimulator(), []);
  const [running, setRunning] = useState(false);
  const [frame, setFrame] = useState<DroneTelemetryFrame | null>(null);
  const [controls, setControlsState] = useState<DroneControls>(() => sim.getControls());
  const [altitudeHistory, setAltitudeHistory] = useState<number[]>([]);
  const [batteryHistory, setBatteryHistory] = useState<number[]>([]);
  const [frames, setFrames] = useState<DroneTelemetryFrame[]>([]);
  const [events, setEvents] = useState<FlightEvent[]>([]);
  const [connection, setConnection] = useState<ConnectionState>({ kind: null, status: "disconnected" });

  const activeKindRef = useRef<ConnectionState["kind"]>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    activeKindRef.current = connection.kind;
  }, [connection.kind]);

  useEffect(() => {
    const unsub = sim.subscribe((f) => {
      if (activeKindRef.current !== "sim") return;
      setFrame(f);
      setControlsState(sim.getControls());
      setAltitudeHistory((prev) => {
        const next = [...prev, f.altitudeM];
        return next.length > 24 ? next.slice(next.length - 24) : next;
      });
      setBatteryHistory((prev) => {
        const next = [...prev, f.battery.percent];
        return next.length > 24 ? next.slice(next.length - 24) : next;
      });
      setFrames((prev) => {
        const next = [...prev, f];
        return next.length > 120 ? next.slice(next.length - 120) : next;
      });
    });
    return unsub;
  }, [sim]);

  const resetSession = () => {
    setAltitudeHistory([]);
    setBatteryHistory([]);
    setFrames([]);
    setEvents([]);
  };

  const connectSimulator = () => {
    socketRef.current?.close();
    socketRef.current = null;
    sim.start();
    setRunning(true);
    resetSession();
    setConnection({ kind: "sim", status: "connected" });
  };

  const disconnect = () => {
    sim.stop();
    socketRef.current?.close();
    socketRef.current = null;
    setRunning(false);
    resetSession();
    setConnection({ kind: null, status: "disconnected" });
    setFrame(null);
  };

  const connectWebSocket = (url: string) => {
    sim.stop();
    socketRef.current?.close();
    socketRef.current = null;

    resetSession();
    if (!url.trim()) {
      setRunning(false);
      setConnection({ kind: "ws", status: "error", url, error: "Missing WebSocket URL" });
      return;
    }
    setRunning(true);
    setConnection({ kind: "ws", status: "connecting", url });

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.addEventListener("open", () => {
        if (activeKindRef.current !== "ws") return;
        setConnection({ kind: "ws", status: "connected", url });
      });

      ws.addEventListener("close", () => {
        if (activeKindRef.current !== "ws") return;
        setConnection({ kind: "ws", status: "error", url, error: "Disconnected" });
        setRunning(false);
      });

      ws.addEventListener("error", () => {
        if (activeKindRef.current !== "ws") return;
        setConnection({ kind: "ws", status: "error", url, error: "Connection error" });
        setRunning(false);
      });

      ws.addEventListener("message", (ev) => {
        if (activeKindRef.current !== "ws") return;
        try {
          const parsed = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data));
          const normalized = normalizeIncomingTelemetry(parsed);
          if (!normalized) return;
          setFrame(normalized);
          setControlsState((prev) => ({
            armed: normalized.status.armed,
            mode: normalized.status.mode,
            throttle: prev.throttle,
            yaw: prev.yaw,
            pitch: prev.pitch,
            roll: prev.roll,
          }));
          setAltitudeHistory((prev) => {
            const next = [...prev, normalized.altitudeM];
            return next.length > 24 ? next.slice(next.length - 24) : next;
          });
          setBatteryHistory((prev) => {
            const next = [...prev, normalized.battery.percent];
            return next.length > 24 ? next.slice(next.length - 24) : next;
          });
          setFrames((prev) => {
            const next = [...prev, normalized];
            return next.length > 120 ? next.slice(next.length - 120) : next;
          });
        } catch {
          return;
        }
      });
    } catch (e) {
      setConnection({
        kind: "ws",
        status: "error",
        url,
        error: e instanceof Error ? e.message : "Could not open connection",
      });
      setRunning(false);
    }
  };

  const setControls = (next: Partial<DroneControls>) => {
    const kind = activeKindRef.current;
    if (kind === "sim") {
      sim.setControls(next);
      return;
    }

    if (kind === "ws") {
      setControlsState((prev) => ({ ...prev, ...next }));
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = { type: "control", ts: Date.now(), droneId: frame?.droneId ?? "", controls: next };
        ws.send(JSON.stringify(payload));
      }
    }
  };

  const logEvent = (label: string) => {
    const evt: FlightEvent = { ts: Date.now(), label };
    setEvents((prev) => {
      const next = [evt, ...prev];
      return next.length > 30 ? next.slice(0, 30) : next;
    });
  };

  return {
    running,
    frame,
    controls,
    altitudeHistory,
    batteryHistory,
    frames,
    events,
    connection,
    connect: connectSimulator,
    connectSimulator,
    connectWebSocket,
    disconnect,
    setControls,
    logEvent,
  };
}
