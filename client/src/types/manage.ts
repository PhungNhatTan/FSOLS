import type { Course } from "./course";
import type { ExamData, ExamQuestion } from "./exam";
import type { QuestionType } from "./questionBank";

export interface Module {
  Id: number;
  OrderNo: number;
}

export interface CourseData {
  Id: number;
  Name: string;
  Description: string;
  CourseModule: Module[];
}

export interface CreateModuleResponse {
  Id: number;
  CourseId: number;
  OrderNo: number;
}

export interface CreateExamResponse {
  id: number;
  title: string;
  questions: Record<string, unknown>[];
}

export interface ExamQuestionPayload {
  mode: "useQB" | "createQB";
  data: Record<string, unknown>;
  examId: number;
}

/** Resource file đính kèm lesson */
export interface ResourceFile {
  Id: number;
  Name: string;
  Url: string;
}

/** Lesson quản trị (chi tiết + tài nguyên) – BE có thể trả về đúng shape này */
export interface ManageLesson {
  Id: number;
  Title: string;
  Description?: string;
  Resources: ResourceFile[];
}

/** Module quản trị gồm danh sách lesson + exam (nếu có) */
export interface ManageModule {
  Id: number;
  Title: string;
  OrderNo: number;
  Lessons: ManageLesson[];
  /** Exam có thể trả theo ExamData hiện có (Questions…) */
  Exam?: ExamData;
}

/** Cấu trúc tổng thể 1 khoá để page quản trị render */
export interface CourseStructureRaw {
  course: Course;
  modules: ManageModule[];
}

/** Item tìm kiếm trong QuestionBank */
export interface QuestionBankSearchItem {
  Id: string;                // QuestionBank.Id (string)
  QuestionText: string;
  Type?: QuestionType;
}

/* -----------------------
   Các type normalize cho UI
   (camelCase để dùng trực tiếp trên page)
------------------------ */
export type UiResource = { id: number; name: string; url: string };

export type UiLesson = {
  id: number;
  title: string;
  description?: string;
  resources: UiResource[];
};

export type UiExam = {
  id: number;
  title: string;
  duration?: number;
  questions: ExamQuestion[];
};

export type UiModule = {
  id: number;
  title: string;
  order: number;
  lessons: UiLesson[];
  exam?: UiExam;
};

export type UiCourseStructure = {
  course: Course;
  modules: UiModule[];
};

export type UiQuestionSearchItem = {
  id: string;
  text: string;
  type?: QuestionType;
};

export type Resource = { id: number; name: string; size?: number; url?: string };

export type UiLessonLocal = {
  id: number;
  title: string;
  description?: string;
  resources: Resource[];
};

export type ExamQuestionLocal = {
  questionId: number;
  points: number;
  question?: Question;
};

export type ExamLocal = {
  id: number;
  title: string;
  questions: ExamQuestionLocal[];
};

export type Question = {
  id: number;
  type: "mcq" | "text";
  text: string;
  options?: string[];
  correctIndex?: number | null;
};

export type UiModuleLocal = {
  id: number;
  title: string;
  order: number;
  lessons: UiLessonLocal[];
  exam?: ExamLocal;
};
