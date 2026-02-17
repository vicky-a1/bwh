"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api/react";
import type { Device, FirmwareRelease } from "@/lib/api/types";

function formatTime(ts: number | null) {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleString();
}

export function DevicesClient() {
  const api = useApi();
  const [devices, setDevices] = useState<Device[]>([]);
  const [firmware, setFirmware] = useState<FirmwareRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const canAdd = name.trim().length >= 2 && code.trim().length >= 6;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, f] = await Promise.all([api.listDevices(), api.getLatestFirmware()]);
      setDevices(d);
      setFirmware(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasDevices = devices.length > 0;

  const latest = useMemo(() => {
    if (!firmware) return null;
    return {
      version: firmware.version,
      notes: firmware.notes,
      createdAt: new Date(firmware.createdAt).toLocaleDateString(),
    };
  }, [firmware]);

  const addDevice = async () => {
    if (!canAdd) return;
    setError(null);
    try {
      const added = await api.addDevice({ name, deviceCode: code });
      setDevices((prev) => [added, ...prev]);
      setShowAdd(false);
      setName("");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add device.");
    }
  };

  const removeDevice = async (id: string) => {
    setError(null);
    try {
      await api.removeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove device.");
    }
  };

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold tracking-tight">My Drones</h1>
        <p className="mt-2 text-sm leading-6 text-slate-200/90">
          Add your drone once. Later, this page will show real connection status,
          firmware updates, and diagnostics.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Add a drone</h2>
            <p className="mt-1 text-sm text-slate-200/80">
              Use the device code printed on the kit label.
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "rounded-2xl px-3 py-2 text-xs font-semibold",
              showAdd ? "bg-white text-slate-950" : "bg-white/10 text-white",
            )}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Close" : "Enter Code"}
          </button>
        </div>

        {showAdd ? (
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-200/80">
                Drone name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-white/30"
                placeholder="My first drone"
                inputMode="text"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-200/80">
                Device code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-white/30"
                placeholder="BWH-123456"
                inputMode="text"
                autoCapitalize="characters"
              />
            </label>
            <button
              type="button"
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                canAdd ? "bg-white text-slate-950" : "bg-white/10 text-white opacity-60",
              )}
              disabled={!canAdd}
              onClick={addDevice}
            >
              Add Drone
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200/80">
            Tip: You can practice now with the simulator in the Fly tab.
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Your devices</h2>
            <p className="mt-1 text-sm text-slate-200/80">
              {hasDevices ? "Tap a device to manage it." : "No drones added yet."}
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white",
              loading ? "opacity-60" : "",
            )}
            disabled={loading}
            onClick={refresh}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200/70">
              Loading…
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200/70">
              Add a drone to see it here.
            </div>
          ) : (
            devices.map((d) => (
              <div
                key={d.id}
                className="rounded-3xl border border-white/10 bg-slate-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{d.name}</div>
                    <div className="mt-1 text-xs text-slate-200/70">
                      Code: {d.deviceCode}
                    </div>
                    <div className="mt-1 text-xs text-slate-200/70">
                      Last seen: {formatTime(d.lastSeenAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => removeDevice(d.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    <div className="text-slate-200/70">Firmware</div>
                    <div className="mt-0.5 font-semibold">{d.firmwareVersion}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    <div className="text-slate-200/70">Status</div>
                    <div className="mt-0.5 font-semibold">Sim Ready</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">Firmware</h2>
        <p className="mt-1 text-sm text-slate-200/80">
          Recommended updates keep flight safer and telemetry more stable.
        </p>
        <div className="mt-4 rounded-3xl bg-white/5 p-4">
          {latest ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Latest: {latest.version}</div>
                <div className="text-xs text-slate-200/70">{latest.createdAt}</div>
              </div>
              <div className="text-sm text-slate-200/85">{latest.notes}</div>
              <div className="text-xs text-slate-200/70">
                Updates will be one tap once hardware connection is enabled.
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-200/70">No firmware info yet.</div>
          )}
        </div>
      </Card>
    </main>
  );
}
