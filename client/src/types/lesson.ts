export interface LessonResource {
  Id: string | number;
  Name: string;
  Url: string;
  OrderNo?: number | null;
}

export interface LessonSummary {
  Id: string | number;
  Title: string;
}

/**
 * LessonResource is the single source of truth for lesson file links.
 * Legacy CourseLesson fields (LessonType/VideoUrl/DocUrl/ContentUrl) must not be used.
 */
export interface LessonDetail extends LessonSummary {
  LessonResources?: LessonResource[] | null;
  Resource?: LessonResource | null;

  // Optional rich-text content if your backend supports it.
  Content?: string;
}

export interface Lesson {
  Id: string | number;
  Title: string;
  Resource?: LessonResource | null;

  // Optional rich-text content if your backend supports it.
  Content?: string;
}
