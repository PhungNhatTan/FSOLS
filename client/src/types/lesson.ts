export interface LessonSummary {
  Id: number;
  Title: string;
}

export interface LessonDetail extends LessonSummary {
  LessonType: string;
  Content: string;
}

export interface Lesson {
  Id: string | number;
  Title: string;
  LessonType: string;
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
