import type { LessonSummary } from "./lesson";
import type { Exam } from "./exam";

export interface ModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?: LessonSummary | null;
  Exam?: Exam | null;
}

export interface CourseModule {
  Id: number;
  OrderNo: number;
  ModuleItems: ModuleItem[];
}

export interface CourseNavData {
  CourseModule: CourseModule[];
}

export interface Course {
  Id: number;
  Title: string;
  Description: string;
  Instructor?: string;
  LessonCount?: number;
}

export interface CourseDetail extends Course {
  Lessons: LessonSummary[];
}

export interface CourseStudyContext {
  courseId: string | undefined;
}
