"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api/react";
import type { Lesson, LessonProgress } from "@/lib/api/types";

function statusLabel(pct: number, locked: boolean) {
  if (locked) return "Locked";
  if (pct >= 100) return "Done";
  if (pct > 0) return "In progress";
  return "Ready";
}

export function BasicsClient() {
  const api = useApi();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, p] = await Promise.all([
        api.listLessonsByCourseSlug("drone-basics"),
        api.getLessonProgress(),
      ]);
      setLessons(l);
      setProgress(p);
      setSelectedId((current) => current ?? (l[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load lessons.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lessonById = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) map.set(l.id, l);
    return map;
  }, [lessons]);

  const selected = selectedId ? lessonById.get(selectedId) ?? null : null;

  const unlock = useMemo(() => {
    const ids = lessons.map((l) => l.id);
    const ok = new Set<string>();
    for (let i = 0; i < ids.length; i++) {
      if (i === 0) {
        ok.add(ids[i]);
        continue;
      }
      const prevId = ids[i - 1];
      const prevPct = progress[prevId]?.percent ?? 0;
      if (prevPct >= 100) ok.add(ids[i]);
    }
    return ok;
  }, [lessons, progress]);

  const selectedPct = selected ? progress[selected.id]?.percent ?? 0 : 0;
  const selectedLocked = selected ? !unlock.has(selected.id) : true;

  const setPct = async (pct: number) => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const next = await api.updateLessonProgress(selected.id, pct);
      setProgress((prev) => ({ ...prev, [selected.id]: next }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save progress.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Drone Basics</h1>
            <p className="mt-2 text-sm leading-6 text-slate-200/90">
              Complete lessons in order. Each one unlocks the next.
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
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <div className="text-sm text-slate-200/80">Loading lessons…</div>
          </Card>
        ) : (
          lessons.map((l) => {
            const pct = progress[l.id]?.percent ?? 0;
            const locked = !unlock.has(l.id);
            const active = l.id === selectedId;
            return (
              <button
                key={l.id}
                type="button"
                className={cn("text-left", locked ? "opacity-60" : "")}
                onClick={() => setSelectedId(l.id)}
                disabled={locked}
              >
                <Card
                  className={cn(
                    "flex items-center justify-between",
                    active ? "border-white/30" : "",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{l.title}</p>
                    <p className="mt-1 text-xs text-slate-200/75">
                      {statusLabel(pct, locked)} · {pct}%
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-xs font-semibold",
                      locked
                        ? "bg-white/10 text-white"
                        : pct >= 100
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-white text-slate-950",
                    )}
                  >
                    {locked ? "Locked" : pct >= 100 ? "Done" : "Open"}
                  </div>
                </Card>
              </button>
            );
          })
        )}
      </div>

      <Card>
        <h2 className="text-base font-semibold">Lesson</h2>
        {!selected ? (
          <p className="mt-2 text-sm text-slate-200/80">Select a lesson above.</p>
        ) : selectedLocked ? (
          <p className="mt-2 text-sm text-slate-200/80">
            Complete the previous lesson to unlock this one.
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="text-sm font-semibold">{selected.title}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200/85">
                {selected.content}
              </div>
            </div>

            <div className="grid gap-2 rounded-3xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200/70">Progress</span>
                <span className="font-semibold">{selectedPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedPct}
                disabled={saving}
                onChange={(e) => void setPct(Number(e.target.value))}
                className={cn("h-10 w-full accent-white", saving ? "opacity-60" : "")}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-semibold",
                    saving ? "bg-white/10 text-white opacity-60" : "bg-white text-slate-950",
                  )}
                  disabled={saving}
                  onClick={() => void setPct(100)}
                >
                  Mark Done
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white",
                    saving ? "opacity-60" : "",
                  )}
                  disabled={saving}
                  onClick={() => void setPct(0)}
                >
                  Reset
                </button>
              </div>
              <div className="text-xs text-slate-200/70">
                Tip: After “Controls explained”, go to Fly and practice the sliders.
              </div>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
