import type { ApiClient } from "./client";
import type {
  CommunityPost,
  Course,
  Device,
  FirmwareRelease,
  Lesson,
  LessonProgress,
} from "./types";

type MockState = {
  courses: Course[];
  lessons: Lesson[];
  devices: Device[];
  firmware: FirmwareRelease[];
  posts: CommunityPost[];
  progress: Record<string, LessonProgress>;
};

const STORAGE_KEY = "bwh_mock_state_v1";

function safeUuid() {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return (c as Crypto).randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function now() {
  return Date.now();
}

function defaultState(): MockState {
  const courseId = safeUuid();
  const courses: Course[] = [
    {
      id: courseId,
      slug: "drone-basics",
      title: "Drone Basics",
      description: "Safety, parts, controls, and first flight.",
      level: "beginner",
    },
    {
      id: safeUuid(),
      slug: "sensors-and-telemetry",
      title: "Sensors & Telemetry",
      description: "IMU, battery, altitude, and reading the numbers.",
      level: "beginner",
    },
  ];

  const lessons: Lesson[] = [
    {
      id: safeUuid(),
      courseId,
      title: "1. Safety first",
      content:
        "Goal: learn the safe way to power on and test your drone.\n\n1) Clear space.\n2) Check props are tight.\n3) Keep fingers away from motors.\n4) If you feel unsure, stop and ask.",
      orderIndex: 1,
    },
    {
      id: safeUuid(),
      courseId,
      title: "2. Meet your drone",
      content:
        "Goal: identify the parts.\n\n- Frame\n- Motors\n- Propellers\n- Battery\n- ESP32 controller\n\nFind each part on your kit before continuing.",
      orderIndex: 2,
    },
    {
      id: safeUuid(),
      courseId,
      title: "3. Controls explained",
      content:
        "Goal: understand what each control does.\n\nThrottle = up/down.\nYaw = turn.\nPitch = forward/back.\nRoll = left/right.\n\nPractice with the simulator first.",
      orderIndex: 3,
    },
    {
      id: safeUuid(),
      courseId,
      title: "4. First hover",
      content:
        "Goal: take off, hover at 1–2 meters, then land.\n\n1) Arm.\n2) Slow throttle up.\n3) Keep horizon level.\n4) Land early if battery is low.",
      orderIndex: 4,
    },
  ];

  const firmware: FirmwareRelease[] = [
    {
      version: "0.1.0",
      notes: "Baseline telemetry + safety checks.",
      downloadUrl: "https://example.com/firmware/bwh-0.1.0.bin",
      sha256: "",
      createdAt: now() - 1000 * 60 * 60 * 24 * 10,
    },
    {
      version: "0.2.0",
      notes: "Improved battery smoothing and connection stability.",
      downloadUrl: "https://example.com/firmware/bwh-0.2.0.bin",
      sha256: "",
      createdAt: now() - 1000 * 60 * 60 * 24 * 3,
    },
  ];

  const posts: CommunityPost[] = [
    {
      id: safeUuid(),
      title: "First flight tips?",
      body: "I’m nervous about takeoff. What’s a beginner-safe checklist?",
      authorName: "Student Pilot",
      createdAt: now() - 1000 * 60 * 60 * 5,
      replies: 3,
    },
    {
      id: safeUuid(),
      title: "Show your build",
      body: "Share a photo of your kit build and what you learned.",
      authorName: "BWH Mentor",
      createdAt: now() - 1000 * 60 * 60 * 24,
      replies: 12,
    },
  ];

  return {
    courses,
    lessons,
    devices: [],
    firmware,
    posts,
    progress: {},
  };
}

function loadState(): MockState {
  if (typeof window === "undefined") return defaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed?.courses?.length) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state: MockState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function createMockApiClient(): ApiClient {
  let state = loadState();

  const persist = () => {
    saveState(state);
  };

  return {
    async listCourses() {
      await delay(150);
      return [...state.courses];
    },

    async getCourseBySlug(slug: string) {
      await delay(120);
      return state.courses.find((c) => c.slug === slug) ?? null;
    },

    async listLessonsByCourseSlug(slug: string) {
      await delay(180);
      const course = state.courses.find((c) => c.slug === slug);
      if (!course) return [];
      return state.lessons
        .filter((l) => l.courseId === course.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    },

    async getLessonProgress() {
      await delay(90);
      return { ...state.progress };
    },

    async updateLessonProgress(lessonId: string, percent: number) {
      await delay(120);
      const p = Math.max(0, Math.min(100, Math.round(percent)));
      const next: LessonProgress = { lessonId, percent: p, updatedAt: now() };
      state = { ...state, progress: { ...state.progress, [lessonId]: next } };
      persist();
      return next;
    },

    async listDevices() {
      await delay(140);
      return [...state.devices].sort((a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0));
    },

    async addDevice(input: { name: string; deviceCode: string }) {
      await delay(220);
      const name = input.name.trim();
      const deviceCode = input.deviceCode.trim();
      if (!name || deviceCode.length < 6) {
        throw new Error("Please enter a device name and a valid code.");
      }
      if (state.devices.some((d) => d.deviceCode.toLowerCase() === deviceCode.toLowerCase())) {
        throw new Error("That device code is already added.");
      }
      const device: Device = {
        id: safeUuid(),
        name,
        deviceCode,
        firmwareVersion: "0.2.0",
        lastSeenAt: now(),
      };
      state = { ...state, devices: [device, ...state.devices] };
      persist();
      return device;
    },

    async removeDevice(id: string) {
      await delay(160);
      state = { ...state, devices: state.devices.filter((d) => d.id !== id) };
      persist();
      return { removed: true };
    },

    async getLatestFirmware() {
      await delay(120);
      const sorted = [...state.firmware].sort((a, b) => b.createdAt - a.createdAt);
      return sorted[0] ?? null;
    },

    async listCommunityPosts() {
      await delay(160);
      return [...state.posts].sort((a, b) => b.createdAt - a.createdAt);
    },

    async createCommunityPost(input) {
      await delay(240);
      const title = input.title.trim();
      const body = input.body.trim();
      if (title.length < 4 || body.length < 10) {
        throw new Error("Please add a short title and a helpful description.");
      }
      const post: CommunityPost = {
        id: safeUuid(),
        title,
        body,
        authorName: "You",
        createdAt: now(),
        replies: 0,
      };
      state = { ...state, posts: [post, ...state.posts] };
      persist();
      return post;
    },
  };
}

