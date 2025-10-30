export interface Lesson {
  Id: number;
  Title: string;
  LessonType: string;
}

export interface ExamSummary {
  Id: number;
  Title: string;
}

export interface ModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?: Lesson;
  Exam?: ExamSummary;
}

export interface CourseModule {
  Id: number;
  OrderNo: number;
  ModuleItems: ModuleItem[];
}

export interface Course {
  Id: number;
  Name: string;
  Description: string;
  CourseModule: CourseModule[];
  Exam: ExamSummary[];
}

export interface Exam {
  Id: number;
  Title: string;
  Description?: string;
}

export interface ExamResult {
  score: number;
  correct: number;
  total: number;
}

export interface ExamDetailResponse {
  exam: Exam;
  result: ExamResult | null;
}
