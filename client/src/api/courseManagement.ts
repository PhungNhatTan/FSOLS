// src/api/courseManagement.ts
import client from "../service/client";

/** =======================
 * Types dùng bởi UI
 * ======================= */
export type Resource = {
  id: number;
  name: string;
  url: string;
};

export type Lesson = {
  id: number;
  order: number;
  title: string;
  description?: string;
  resources: Resource[];
};

export type Question = {
  id: number;
  type: "mcq" | "text";
  text: string;
  options?: string[];        // với mcq
  correctIndex?: number | null; // mcq: index đúng, text: null
};

export type ExamQuestionRef = {
  questionId: number;
  points: number;
  question?: Question; // optional expand
};

export type Exam = {
  id: number;
  title: string;
  questions: ExamQuestionRef[];
};

export type CourseModule = {
  id: number;
  order: number;
  title: string;
  lessons: Lesson[];
  exam?: Exam;
};

export type CourseStructure = {
  course: { id: number; title: string };
  modules: CourseModule[];
};

/** =======================
 * API paths – chỉnh nếu BE khác
 * ======================= */
const PATHS = {
  structure: (courseId: number) => `/manage/course/${courseId}/structure`,
  createModule: (courseId: number) => `/manage/course/${courseId}/modules`,
  createLesson: (moduleId: number) => `/manage/module/${moduleId}/lessons`,
  uploadResource: `/manage/resources/upload`,
  attachResources: (lessonId: number) => `/manage/lesson/${lessonId}/resources/attach`,
  createExam: (moduleId: number) => `/manage/module/${moduleId}/exams`,
  searchQuestions: (q: string) => `/question-bank/search?q=${encodeURIComponent(q)}`,
  addExistingQuestion: (examId: number) => `/manage/exam/${examId}/questions`,
  createQuestionAndAttach: (examId: number) => `/manage/exam/${examId}/questions/new`,
};

/** =======================
 * API methods
 * ======================= */

async function getStructure(courseId: number): Promise<CourseStructure> {
  const res = await client.get<CourseStructure>(PATHS.structure(courseId));
  return res.data;
}

async function createModule(courseId: number, title: string): Promise<CourseModule> {
  const res = await client.post<CourseModule>(PATHS.createModule(courseId), { title });
  return res.data;
}

async function createLesson(
  moduleId: number,
  payload: { title: string; description?: string }
): Promise<Lesson> {
  const res = await client.post<Lesson>(PATHS.createLesson(moduleId), payload);
  return res.data;
}

/** Upload từng file (multipart/form-data) → trả về Resource (id/name/url) */
async function uploadResource(file: File): Promise<Resource> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await client.post<Resource>(PATHS.uploadResource, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** Gắn danh sách resource (đã upload) vào 1 lesson → trả về Lesson cập nhật */
async function attachResources(lessonId: number, resources: Resource[]): Promise<Lesson> {
  const resourceIds = resources.map((r) => r.id);
  const res = await client.post<Lesson>(PATHS.attachResources(lessonId), { resourceIds });
  return res.data;
}

async function createExam(moduleId: number, title: string): Promise<Exam> {
  const res = await client.post<Exam>(PATHS.createExam(moduleId), { title });
  return res.data;
}

/** Search question bank (paging tuỳ BE). Ở đây trả { items: Question[] } */
async function searchQuestions(q: string): Promise<{ items: Question[] }> {
  const res = await client.get<{ items: Question[] }>(PATHS.searchQuestions(q));
  return res.data;
}

/** Thêm câu hỏi có sẵn vào Exam → trả về Exam cập nhật */
async function addExistingQuestion(
  examId: number,
  questionId: number,
  points: number
): Promise<Exam> {
  const res = await client.post<Exam>(PATHS.addExistingQuestion(examId), {
    questionId,
    points,
  });
  return res.data;
}

/** Tạo mới câu hỏi rồi auto attach vào Exam → trả về { exam, question } */
async function createQuestionAndAttach(
  examId: number,
  payload: Omit<Question, "id">
): Promise<{ exam: Exam; question: Question }> {
  const res = await client.post<{ exam: Exam; question: Question }>(
    PATHS.createQuestionAndAttach(examId),
    payload
  );
  return res.data;
}

/** Export object đúng tên mà UI import */
export const courseManagementApi = {
  getStructure,
  createModule,
  createLesson,
  uploadResource,
  attachResources,
  createExam,
  searchQuestions,
  addExistingQuestion,
  createQuestionAndAttach,
};

export default courseManagementApi;
