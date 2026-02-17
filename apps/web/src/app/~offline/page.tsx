import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        <div className="rounded-3xl bg-slate-900/60 p-6">
          <h1 className="text-2xl font-semibold tracking-tight">You’re offline</h1>
          <p className="mt-2 text-sm leading-6 text-slate-200/90">
            BWH can still show saved lessons and your last known progress. Reconnect to
            sync and access live drone telemetry.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
