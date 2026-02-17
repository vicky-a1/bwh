import type { ApiClient } from "./client";
import type {
  CommunityPost,
  Course,
  CreatePostInput,
  Device,
  FirmwareRelease,
  Lesson,
  LessonProgress,
} from "./types";

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("bwh_access_token");
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const token = opts.token ?? getToken();
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : null),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export function createHttpApiClient(): ApiClient {
  return {
    async listCourses() {
      return apiFetch<Course[]>("/courses");
    },

    async getCourseBySlug(slug) {
      return apiFetch<Course>(`/courses/${encodeURIComponent(slug)}`).catch(() => null);
    },

    async listLessonsByCourseSlug(slug) {
      return apiFetch<Lesson[]>(`/courses/${encodeURIComponent(slug)}/lessons`);
    },

    async getLessonProgress() {
      const token = getToken();
      if (!token) return {};
      return apiFetch<Record<string, LessonProgress>>("/progress", { token }).catch(() => ({}));
    },

    async updateLessonProgress(lessonId, percent) {
      const token = getToken();
      if (!token) throw new Error("Please sign in first.");
      return apiFetch<LessonProgress>(`/courses/lessons/${encodeURIComponent(lessonId)}/progress`, {
        method: "PUT",
        token,
        body: { percent },
      });
    },

    async listDevices() {
      const token = getToken();
      if (!token) return [];
      return apiFetch<Device[]>("/devices", { token });
    },

    async addDevice(input) {
      const token = getToken();
      if (!token) throw new Error("Please sign in first.");
      return apiFetch<Device>("/devices", { method: "POST", token, body: input });
    },

    async removeDevice(id) {
      const token = getToken();
      if (!token) throw new Error("Please sign in first.");
      return apiFetch<{ removed: true }>(`/devices/${encodeURIComponent(id)}`, { method: "DELETE", token });
    },

    async getLatestFirmware() {
      return apiFetch<FirmwareRelease | null>("/devices/firmware/latest").catch(() => null);
    },

    async listCommunityPosts() {
      return apiFetch<CommunityPost[]>("/community/posts").catch(() => []);
    },

    async createCommunityPost(input: CreatePostInput) {
      return apiFetch<CommunityPost>("/community/posts", { method: "POST", body: input });
    },
  };
}

