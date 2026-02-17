export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  orderIndex: number;
};

export type LessonProgress = {
  lessonId: string;
  percent: number;
  updatedAt: number;
};

export type Device = {
  id: string;
  name: string;
  deviceCode: string;
  firmwareVersion: string;
  lastSeenAt: number | null;
};

export type FirmwareRelease = {
  version: string;
  notes: string;
  downloadUrl: string;
  sha256: string;
  createdAt: number;
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: number;
  replies: number;
};

export type CreatePostInput = {
  title: string;
  body: string;
};

