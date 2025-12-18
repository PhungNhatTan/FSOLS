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

export interface VerificationRequest {
  Id: string
  CourseId: number | null
  Course?: Course
  SpecializationId: number | null
  ReviewedById: string | null
  ApprovalStatus: "Pending" | "Approved" | "Rejected"
  Reason: string | null
  RequestType: "New" | "Update" | "Delete"
  ReviewedAt: string | null
  CreatedAt: string
}

export interface Course {
  Id: number
  Name: string
  Description: string
  DeletedAt?: string | null
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
  // Optional: returned by some endpoints. Useful for rendering an ordered timeline (module -> items).
  CourseModule?: CourseModule[]
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

export type RawCourseModule = {
  Id: number;
  OrderNo?: number;
  ModuleItems?: {
    Id: number;
    OrderNo?: number;
    CourseLesson?: LessonSummary | null;
    Exam?: Exam | null;
  }[];
};


export interface RawCourseDetail {
  Id: number
  Name: string
  Description: string
  Lessons?: LessonSummary[] // flattened by backend
  Exams?: Exam[] // flattened by backend
}

// Add this to your existing types/course.ts

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
        description?: string;
        lessonType: "Video" | "Document";
        videoUrl: string | null;
        docUrl: string | null;
        createdById: string | null;
        deleted: boolean;
        // UPDATED: Resources with size and metadata
        resources: {
          id: number;
          name: string;
          url: string;          // During draft: /uploads/draft/course-X/file.mp4
          // After publish: /uploads/production/course-X/file.mp4
          size?: number;        // File size in bytes
          type?: string;        // MIME type
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

export type DraftModuleItem = DraftJson["modules"][number]["items"][number];
export type DraftModule = DraftJson["modules"][number];

