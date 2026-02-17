# BWH (Build With Hardware)

Beginner-friendly educational drone kit ecosystem: learn, fly, build, and share.

This repo contains:
- A mobile-first web dashboard (Next.js) for simulated flight training and real ESP32-drone telemetry
- A backend API (NestJS) with auth, devices, firmware info, and a telemetry gateway

## Repo Structure

- `apps/web`: Next.js web app (PWA enabled)
- `apps/api`: NestJS API (REST + Socket.IO telemetry gateway)

## Setup

Prereqs:
- Node.js + npm
- (Optional) Docker Desktop if you want Postgres + MQTT locally

Install dependencies (workspace root):

```bash
npm install
```

Environment variables:
- API: copy [apps/api/.env.example](apps/api/.env.example) to `apps/api/.env` and edit as needed
- Web: copy [apps/web/.env.example](apps/web/.env.example) to `apps/web/.env.local` and edit as needed

## Run (Dev)

Run both apps:

```bash
npm run dev
```

In your terminal you’ll see the exact URLs. By default the ports are:
- Web: `http://<your-host>:3001`
- API: `http://<your-host>:3000`

Or run individually:

```bash
npm run dev:web
npm run dev:api
```

## Build / Lint / Typecheck

From the workspace root:

```bash
npm run build
npm run lint
npm run typecheck
```

## Frontend Dashboard Usage

- Open the dashboard at: `<your web URL>/dashboard` (example: `http://<your-host>:3001/dashboard`)
- Choose connection mode:
  - Simulator: runs a built-in telemetry simulator
  - Real drone: connects to a WebSocket URL you provide in the UI (or `NEXT_PUBLIC_DRONE_WS_URL`)
- Use Safety Limits to cap throttle/stick inputs and set a max altitude limit
- Use the pre-flight checklist before real flights
- Practice stats and skill progress persist in localStorage (per browser)

## Hardware Integration Notes

There are two common integration options:

1) Direct Drone → Web Dashboard (raw WebSocket)
- The dashboard can connect directly to a WebSocket URL (Real drone mode).
- Send JSON telemetry messages; the dashboard normalizes both “flat” and “nested” shapes.

2) Drone → API Telemetry Gateway (Socket.IO) → Web
- The API exposes a Socket.IO namespace `/telemetry`.
- Clients authenticate using a JWT token (handshake auth token or `Authorization: Bearer ...` header).
- Events:
  - `telemetry:publish` (drone publishes)
  - `telemetry:subscribe` (dashboard subscribes per droneId)
  - `telemetry:update` (server broadcasts latest frames)

See the implementation in [telemetry.gateway.ts](apps/api/src/modules/telemetry/telemetry.gateway.ts).

## ESP32 Telemetry Protocol (JSON)

The web dashboard’s native telemetry frame shape is defined in [types.ts](apps/web/src/lib/telemetry/types.ts).

### Minimal fields (accepted by the dashboard)

- `droneId` (string)
- `ts` (number, ms since epoch; optional, defaults to `Date.now()`)
- `altitudeM` (number; optional)
- `batteryPct` or `batteryPercent` (number 0–100; optional)
- `rollDeg`, `pitchDeg`, `yawDeg` (numbers; optional)

Optional extras (recommended):
- `firmwareVersion` (string)
- `link.rssiDbm` (number; optional)
- `link.latencyMs` (number; optional)
- `temperatureC` or `env.temperatureC` (number; optional)
- `status.armed` (boolean; optional)
- `status.mode` (one of `STABILIZE | ALT_HOLD | GUIDED`; optional)

Example telemetry message:

```json
{
  "ts": 1739779200000,
  "droneId": "esp32-drone-001",
  "firmwareVersion": "0.3.0",
  "altitudeM": 1.2,
  "batteryPct": 86,
  "rollDeg": -2.4,
  "pitchDeg": 1.1,
  "yawDeg": 143.0,
  "link": { "rssiDbm": -63, "latencyMs": 42 },
  "env": { "temperatureC": 31 },
  "status": { "armed": true, "mode": "STABILIZE" }
}
```

### Control messages (Dashboard → Drone, raw WebSocket mode)

When connected via WebSocket in the dashboard, control updates are sent as JSON:

```json
{
  "type": "control",
  "ts": 1739779200000,
  "droneId": "esp32-drone-001",
  "controls": { "throttle": 40, "yaw": 0, "pitch": 10, "roll": 0 }
}
```

The `controls` object is a partial update; you can apply it to your current control state on the drone.

## Optional: Local Infrastructure (Docker)

To run Postgres + MQTT + API + Web using Docker:

```bash
docker compose up --build
```

This uses the defaults in [docker-compose.yml](docker-compose.yml).
