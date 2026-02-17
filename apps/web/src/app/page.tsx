import Link from "next/link";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-3xl border border-slate-200/10 bg-gradient-to-br from-slate-900/70 to-slate-950/40 p-6">
        <p className="text-xs font-semibold text-slate-200/80">Build With Hardware</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Learn drones from zero. Fly with confidence.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-200/90">
          BWH guides you step-by-step: lessons, safe practice, device setup, and a
          student community.
        </p>
      </header>

      <Card>
        <h2 className="text-base font-semibold">Start here</h2>
        <p className="mt-1 text-sm text-slate-200/80">
          First time? Take the 10-minute setup path.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/learn"
            className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
          >
            Learn
          </Link>
          <Link
            href="/devices"
            className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Add Drone
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard" className="rounded-3xl bg-slate-900/40 p-5">
          <p className="text-xs font-semibold text-slate-200/80">Drone</p>
          <p className="mt-1 text-sm font-semibold">Control Dashboard</p>
          <p className="mt-2 text-xs text-slate-200/80">Safe, guided flight tools.</p>
        </Link>
        <Link href="/community" className="rounded-3xl bg-slate-900/40 p-5">
          <p className="text-xs font-semibold text-slate-200/80">Community</p>
          <p className="mt-1 text-sm font-semibold">Ask & Share</p>
          <p className="mt-2 text-xs text-slate-200/80">Projects and collaboration.</p>
        </Link>
      </div>
    </main>
  );
}
