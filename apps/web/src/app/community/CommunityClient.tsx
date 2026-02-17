"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api/react";
import type { CommunityPost } from "@/lib/api/types";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function CommunityClient() {
  const api = useApi();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = title.trim().length >= 4 && body.trim().length >= 10;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.listCommunityPosts();
      setPosts(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load posts.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      const created = await api.createCommunityPost({ title, body });
      setPosts((prev) => [created, ...prev]);
      setTitle("");
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create post.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Community</h1>
        <p className="mt-2 text-sm leading-6 text-slate-200/90">
          Ask questions, share projects, and learn together. Be kind and specific.
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
            <h2 className="text-base font-semibold">Start a post</h2>
            <p className="mt-1 text-sm text-slate-200/80">
              A good post says what you tried and what happened.
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
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-200/80">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-white/30"
              placeholder="Example: How do I keep hover stable?"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-200/80">Details</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-white/30"
              placeholder="What were you doing? What did you see? What did you try?"
            />
          </label>
          <button
            type="button"
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold",
              canPost && !posting
                ? "bg-white text-slate-950"
                : "bg-white/10 text-white opacity-60",
            )}
            disabled={!canPost || posting}
            onClick={createPost}
          >
            Post
          </button>
          <div className="text-xs text-slate-200/70">
            Tip: If you share a project, include a photo and one thing you learned.
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <div className="text-sm text-slate-200/80">Loading posts…</div>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <div className="text-sm text-slate-200/80">No posts yet.</div>
          </Card>
        ) : (
          posts.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{p.title}</p>
                <div className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {timeAgo(p.createdAt)}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200/85">{p.body}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-200/70">
                <span>By {p.authorName}</span>
                <span>Replies: {p.replies}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
