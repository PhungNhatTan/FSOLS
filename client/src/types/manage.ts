import type { Course, RawCourseModule } from "./course";
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
  CourseModule: RawCourseModule[];
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

export interface DraftResource {
  id: string;           // Temporary ID like "draft_123456789"
  name: string;
  url: string;          // Draft URL: /uploads/draft/course-X/file.mp4
  size: number;         // File size in bytes
  type: string;         // MIME type
  uploadedAt: string;   // ISO timestamp
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

export type Resource = {
  id: number;
  name: string;
  url?: string;
  size?: number;        // Optional: file size in bytes
};

export type UiLessonLocal = {
  id: number;
  title: string;
  description?: string;
  order: number;
  resources: Resource[];  // Always an array, never undefined
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
  description?: string;
  order: number;
  durationPreset?: string;
  durationCustom?: number;
  examOpened?: boolean;
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

export interface DraftResource {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/**
 * Convert a DraftResource (from API) to Resource (for UI)
 */
export function draftResourceToResource(draftResource: DraftResource): Resource {
  return {
    id: Date.now(), // Generate temporary ID for local state
    name: draftResource.name,
    url: draftResource.url,
    size: draftResource.size,
  };
}

/**
 * Convert ResourceFile (from backend) to Resource (for UI)
 */
export function resourceFileToResource(resourceFile: ResourceFile): Resource {
  return {
    id: resourceFile.Id,
    name: resourceFile.Name,
    url: resourceFile.Url,
    size: undefined, // Backend doesn't provide size
  };
}