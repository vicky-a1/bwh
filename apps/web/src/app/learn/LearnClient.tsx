"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api/react";
import type { Course, Lesson, LessonProgress } from "@/lib/api/types";

function courseBadge(level: Course["level"]) {
  if (level === "advanced") return "bg-rose-500/15 text-rose-200";
  if (level === "intermediate") return "bg-amber-500/15 text-amber-200";
  return "bg-emerald-500/15 text-emerald-200";
}

function percentForCourse(lessons: Lesson[], progress: Record<string, LessonProgress>) {
  if (lessons.length === 0) return 0;
  const total = lessons.reduce((sum, l) => sum + (progress[l.id]?.percent ?? 0), 0);
  return Math.round(total / lessons.length);
}

export function LearnClient() {
  const api = useApi();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [lessonsBySlug, setLessonsBySlug] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([api.listCourses(), api.getLessonProgress()]);
      setCourses(c);
      setProgress(p);
      const lessonPairs = await Promise.all(
        c.map(async (course) => [course.slug, await api.listLessonsByCourseSlug(course.slug)] as const),
      );
      const map: Record<string, Lesson[]> = {};
      for (const [slug, lessons] of lessonPairs) map[slug] = lessons;
      setLessonsBySlug(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const featured = useMemo(() => courses.find((c) => c.slug === "drone-basics") ?? courses[0], [courses]);
  const featuredLessons = featured ? lessonsBySlug[featured.slug] ?? [] : [];
  const featuredPct = featured ? percentForCourse(featuredLessons, progress) : 0;

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Learning</h1>
        <p className="mt-2 text-sm leading-6 text-slate-200/90">
          Short lessons, simple words, and hands-on steps. Start with safety, then practice in the simulator.
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
            <h2 className="text-base font-semibold">Start here</h2>
            <p className="mt-1 text-sm text-slate-200/80">
              A guided path built for students with zero drone experience.
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

        <div className="mt-4 rounded-3xl bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{featured?.title ?? "—"}</div>
              <div className="mt-1 text-xs text-slate-200/70">
                {featured?.description ?? "Loading…"}
              </div>
            </div>
            {featured ? (
              <div className={cn("rounded-2xl px-3 py-1 text-xs font-semibold", courseBadge(featured.level))}>
                {featured.level}
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200/70">Progress</span>
              <span className="font-semibold">{featuredPct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-white" style={{ width: `${featuredPct}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href={featured?.slug === "drone-basics" ? "/learn/basics" : "/learn"}
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
            >
              Continue
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Practice Fly
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <div className="text-sm text-slate-200/80">Loading courses…</div>
          </Card>
        ) : (
          courses.map((c) => {
            const lessons = lessonsBySlug[c.slug] ?? [];
            const pct = percentForCourse(lessons, progress);
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{c.title}</div>
                    <div className="mt-1 text-sm text-slate-200/80">{c.description}</div>
                  </div>
                  <div className={cn("rounded-2xl px-3 py-1 text-xs font-semibold", courseBadge(c.level))}>
                    {c.level}
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200/70">Progress</span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-white/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
