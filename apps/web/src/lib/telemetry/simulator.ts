import type { DroneControls, DroneMode, DroneTelemetryFrame } from "./types";

type Listener = (frame: DroneTelemetryFrame) => void;

type SimState = {
  droneId: string;
  firmwareVersion: string;
  batteryPercent: number;
  voltage: number;
  currentA: number;
  temperatureC: number;
  altitudeM: number;
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
  rssiDbm: number;
  latencyMs: number;
  controls: DroneControls;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round(n: number, digits = 1) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function voltageFromPercent(pct: number) {
  const t = clamp(pct / 100, 0, 1);
  return 3.3 + 0.9 * (t ** 0.6);
}

function modeLabel(mode: DroneMode) {
  return mode;
}

export class TelemetrySimulator {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private state: SimState;

  constructor(droneId: string) {
    this.state = {
      droneId,
      firmwareVersion: "0.1.0",
      batteryPercent: 92,
      voltage: voltageFromPercent(92),
      currentA: 0.3,
      temperatureC: 31,
      altitudeM: 0,
      rollDeg: 0,
      pitchDeg: 0,
      yawDeg: 0,
      rssiDbm: -48,
      latencyMs: 60,
      controls: {
        armed: false,
        mode: "STABILIZE",
        throttle: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
      },
    };
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1000);
    this.tick();
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  getControls() {
    return this.state.controls;
  }

  setControls(next: Partial<DroneControls>) {
    const c = this.state.controls;
    this.state.controls = {
      armed: next.armed ?? c.armed,
      mode: next.mode ?? c.mode,
      throttle: clamp(next.throttle ?? c.throttle, 0, 100),
      yaw: clamp(next.yaw ?? c.yaw, -100, 100),
      pitch: clamp(next.pitch ?? c.pitch, -100, 100),
      roll: clamp(next.roll ?? c.roll, -100, 100),
    };
    this.tick();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private tick() {
    const s = this.state;
    const c = s.controls;

    const armed = c.armed;
    const load = armed ? 0.8 + (c.throttle / 100) * 3.2 : 0.2 + rand(0, 0.15);
    s.currentA = round(lerp(s.currentA, load, 0.35), 2);

    const drain = armed ? 0.15 + (c.throttle / 100) * 0.25 : 0.03;
    s.batteryPercent = clamp(s.batteryPercent - drain, 0, 100);
    s.voltage = round(voltageFromPercent(s.batteryPercent) - rand(0, 0.03), 2);

    s.temperatureC = round(
      lerp(s.temperatureC, 29 + s.currentA * 2.2 + rand(-0.5, 0.5), 0.25),
      1,
    );

    const targetAlt = armed ? (c.throttle / 100) * 6 : 0;
    const altNoise = rand(-0.05, 0.05);
    s.altitudeM = round(lerp(s.altitudeM, targetAlt, armed ? 0.28 : 0.4) + altNoise, 2);
    if (!armed && s.altitudeM < 0.06) s.altitudeM = 0;

    const rollTarget = (c.roll / 100) * 20 + rand(-2, 2);
    const pitchTarget = (c.pitch / 100) * 18 + rand(-2, 2);
    s.rollDeg = round(lerp(s.rollDeg, rollTarget, 0.35), 1);
    s.pitchDeg = round(lerp(s.pitchDeg, pitchTarget, 0.35), 1);

    const yawRate = (c.yaw / 100) * 30 + rand(-1.5, 1.5);
    s.yawDeg = (s.yawDeg + yawRate + 360) % 360;
    s.yawDeg = round(s.yawDeg, 1);

    s.rssiDbm = Math.round(lerp(s.rssiDbm, -45 + rand(-6, 6), 0.25));
    s.latencyMs = Math.round(clamp(lerp(s.latencyMs, 55 + rand(-25, 60), 0.2), 20, 250));

    const frame: DroneTelemetryFrame = {
      ts: Date.now(),
      droneId: s.droneId,
      firmwareVersion: s.firmwareVersion,
      link: {
        rssiDbm: s.rssiDbm,
        latencyMs: s.latencyMs,
      },
      battery: {
        percent: round(s.batteryPercent, 1),
        voltage: s.voltage,
        currentA: s.currentA,
      },
      env: {
        temperatureC: s.temperatureC,
      },
      attitude: {
        rollDeg: s.rollDeg,
        pitchDeg: s.pitchDeg,
        yawDeg: s.yawDeg,
      },
      altitudeM: s.altitudeM,
      status: {
        armed,
        mode: modeLabel(c.mode),
      },
    };

    for (const l of this.listeners) l(frame);
  }
}

let singleton: TelemetrySimulator | null = null;

export function getTelemetrySimulator() {
  if (!singleton) singleton = new TelemetrySimulator("BWH-ESP32-01");
  return singleton;
}
