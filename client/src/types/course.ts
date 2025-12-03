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
  Name: string;
  Description: string;
  DeletedAt?: string | null;
}

export interface CourseDetail extends Course {
  Lessons: LessonSummary[][]; // nested arrays grouped by module
  Exams: Exam[][]; // nested arrays grouped by module
}


export interface CourseStudyContext {
  courseId: string | undefined;
}

export interface RawModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?: LessonSummary | null;
  Exam?: Exam | null;
}

export interface RawCourseModule {
  Id: number;
  OrderNo: number;
  ModuleItems: RawModuleItem[];
}

export interface RawCourseDetail {
  Id: number;
  Name: string;
  Description: string;
  Lessons?: LessonSummary[]; // flattened by backend
  Exams?: Exam[];             // flattened by backend
}
