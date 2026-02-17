import type {
  CommunityPost,
  Course,
  CreatePostInput,
  Device,
  FirmwareRelease,
  Lesson,
  LessonProgress,
} from "./types";

export type ApiClient = {
  listCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  listLessonsByCourseSlug(slug: string): Promise<Lesson[]>;
  getLessonProgress(): Promise<Record<string, LessonProgress>>;
  updateLessonProgress(lessonId: string, percent: number): Promise<LessonProgress>;

  listDevices(): Promise<Device[]>;
  addDevice(input: { name: string; deviceCode: string }): Promise<Device>;
  removeDevice(id: string): Promise<{ removed: true }>;
  getLatestFirmware(): Promise<FirmwareRelease | null>;

  listCommunityPosts(): Promise<CommunityPost[]>;
  createCommunityPost(input: CreatePostInput): Promise<CommunityPost>;
};

export type ApiMode = "mock" | "http";

export function getApiMode(): ApiMode {
  const raw = process.env.NEXT_PUBLIC_API_MODE;
  if (raw === "http") return "http";
  if (raw === "mock") return "mock";
  if (process.env.NODE_ENV === "production") return "http";
  return "mock";
}
