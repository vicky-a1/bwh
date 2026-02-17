export type DroneMode = "STABILIZE" | "ALT_HOLD" | "GUIDED";

export type DroneControls = {
  armed: boolean;
  mode: DroneMode;
  throttle: number;
  yaw: number;
  pitch: number;
  roll: number;
};

export type DroneTelemetryFrame = {
  ts: number;
  droneId: string;
  firmwareVersion?: string;
  link: {
    rssiDbm: number;
    latencyMs: number;
  };
  battery: {
    percent: number;
    voltage: number;
    currentA: number;
  };
  env: {
    temperatureC: number;
  };
  attitude: {
    rollDeg: number;
    pitchDeg: number;
    yawDeg: number;
  };
  altitudeM: number;
  status: {
    armed: boolean;
    mode: DroneMode;
  };
};
