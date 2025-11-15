import type {  } from "./lesson";
import type { Exam } from "./exam";

export interface ModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?:  | null;
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
  Name: string;
  Description: string;
  Instructor?: string;
  LessonCount?: number;
}

export interface CourseDetail extends Course {
  Lessons: [];
}

export interface CourseStudyContext {
  courseId: string | undefined;
}
