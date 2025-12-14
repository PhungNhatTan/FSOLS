import type { LessonSummary } from "./lesson"
import type { Exam } from "./exam"

export interface ModuleItem {
  Id: number
  OrderNo: number
  CourseLesson?: LessonSummary | null
  Exam?: Exam | null
}

export interface CourseModule {
  Id: number
  OrderNo: number
  ModuleItems: ModuleItem[]
}

export interface CourseNavData {
  CourseModule: CourseModule[]
}

export interface Course {
  Id: number
  Name: string
  Description: string
  DeletedAt?: string | null
  IsVerified?: boolean
  IsRejected?: boolean
  RejectionReason?: string | null
  Category?: {
    Id: number
    Name: string
  } | null
  CreatedBy?: {
    Id: string
    Name: string
  } | null
}

export interface CourseDetail extends Course {
  Lessons: LessonSummary[][] // nested arrays grouped by module
  Exams: Exam[][] // nested arrays grouped by module
}

export interface CourseStudyContext {
  courseId: string | undefined
}

export interface RawModuleItem {
  Id: number
  OrderNo: number
  CourseLesson?: LessonSummary | null
  Exam?: Exam | null
}

export interface RawCourseModule {
  Id: number
  OrderNo: number
  ModuleItems: RawModuleItem[]
}

export interface RawCourseDetail {
  Id: number
  Name: string
  Description: string
  Lessons?: LessonSummary[] // flattened by backend
  Exams?: Exam[] // flattened by backend
}

export type DraftJson = {
  version: string;
  lastModified: string;
  course: {
    id: number;
    name: string;
    description: string;
    categoryId: number | null;
    createdById: string | null;
    publishedAt: string | null;
    skills: {
      id: number;
      skillName: string;
      deleted: boolean;
    }[];
  };
  modules: {
    id: number;
    title: string;
    orderNo: number;
    deleted: boolean;
    items: {
      id: string;
      orderNo: number;
      deleted: boolean;
      type: "lesson" | "exam";
      lesson?: {
        id: string;
        title: string;
        lessonType: "Video" | "Document";
        videoUrl: string | null;
        docUrl: string | null;
        createdById: string | null;
        deleted: boolean;
        resources: {
          id: number;
          name: string;
          url: string;
          deleted: boolean;
        }[];
      };
      exam?: {
        id: number;
        title: string;
        description: string;
        durationPreset: "P_15" | "P_30" | "P_60" | "P_90" | "P_120" | null;
        durationCustom: number | null;
        createdById: string | null;
        deleted: boolean;
        questions: {
          id: string;
          questionBankId: number;
          deleted: boolean;
          questionBank: {
            id: number;
            questionText: string;
            type: "MCQ" | "Fill" | "Essay" | "TF";
            answer: string | null;
            lessonId: string | null;
            courseId: number | null;
            deleted: boolean;
            answers: {
              id: string;
              answerText: string;
              isCorrect: boolean;
              deleted: boolean;
            }[];
          };
        }[];
      };
    }[];
  }[];
};
