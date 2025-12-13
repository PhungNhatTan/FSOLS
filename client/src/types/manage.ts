import type { Course } from "./course";
import type { ExamData, ExamQuestion } from "./exam";
import type { QuestionType } from "./questionBank";

export interface ModuleItem {
  OrderNo: number;
  CourseLesson?: Array<{ Id: string; Title: string }>;
  Exam?: Array<{ Id: number; Title: string }>;
}

export interface Module {
  Id: number;
  OrderNo: number;
  ModuleItems?: ModuleItem[];
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

export interface ResourceFile {
  Id: number;
  Name: string;
  Url: string;
}

export interface ManageLesson {
  Id: number;
  Title: string;
  Description?: string;
  Resources: ResourceFile[];
}

export interface ManageModule {
  Id: number;
  Title: string;
  OrderNo: number;
  Lessons: ManageLesson[];
  Exam?: ExamData;
}

export interface CourseStructureRaw {
  course: Course;
  modules: ManageModule[];
}

export interface QuestionBankSearchItem {
  Id: string;                // QuestionBank.Id (string)
  QuestionText: string;
  Type?: QuestionType;
}

export type UiResource = { id: number; name: string; url: string };

export type UiLesson = {
  id: number;
  title: string;
  description?: string;
  order: number;
  resources: UiResource[];
};

export type UiExam = {
  id: number;
  title: string;
  duration?: number;
  durationPreset?: string;
  durationCustom?: number;
  order: number;
  questions: ExamQuestion[];
};

export type UiModule = {
  id: number;
  title: string;
  order: number;
  lessons: UiLesson[];
  exams?: UiExam[];
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
  order: number;
  resources: Resource[];
};

export type ExamQuestionLocal = {
  examQuestionId: string;
  questionId: number;
  points: number;
  question?: Question;
};

export type ExamLocal = {
  id: number;
  title: string;
  order: number;
  durationPreset?: string;
  durationCustom?: number;
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
  exams: ExamLocal[];
};
