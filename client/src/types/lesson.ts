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
  LessonType: string;
  ContentUrl?: string | null;
  LessonResources?: LessonResource[] | null;
  Resource?: LessonResource | null;
  // Deprecated fields - kept for backward compatibility during migration
  Content?: string;
  VideoUrl?: string;
  DocUrl?: string;
}

export interface Lesson {
  Id: string | number;
  Title: string;
  LessonType: string;
  ContentUrl?: string | null;
  Resource?: LessonResource | null;
  // Deprecated fields
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

