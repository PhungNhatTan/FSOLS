export interface LessonResource {
  Id: number;
  Name: string;
  Url: string;
  OrderNo?: number | null;
}

export interface LessonSummary {
  Id: number;
  Title: string;
}

export interface LessonDetail extends LessonSummary {
  // Primary fields used by the app
  LessonResources?: LessonResource[] | null;
  Resource?: LessonResource | null;
  Content?: string;

  /**
   * LEGACY (DO NOT USE): These fields exist in CourseLesson table for older data.
   * All file links must be driven by LessonResource.
   */
  LessonType?: string;
  ContentUrl?: string | null;
  VideoUrl?: string;
  DocUrl?: string;
}

export interface Lesson {
  Id: string | number;
  Title: string;
  Resource?: LessonResource | null;

  // Legacy (DO NOT USE)
  LessonType?: string;
  ContentUrl?: string | null;
  VideoUrl?: string;
  DocUrl?: string;
  Content?: string;
}

export interface CreateLessonData {
  Title: string;
  LessonType: "Video" | "Document";
  CourseModuleId?: number;
  OrderNo?: number;
  file: File;
}

