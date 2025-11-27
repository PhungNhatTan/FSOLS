import client from "../service/client";
import type {
  CourseStructureRaw,
  ManageModule,
  ManageLesson,
  ResourceFile,
  QuestionBankSearchItem,
  UiCourseStructure,
  UiModule,
  UiLesson,
  UiResource,
  UiExam,
  UiQuestionSearchItem,
} from "../types/manage";
import type { ExamData, ExamQuestion } from "../types/exam";

/* -------------------------
   Helpers: normalize Raw → UI
-------------------------- */
function toUiResource(r: ResourceFile): UiResource {
  return { id: r.Id, name: r.Name, url: r.Url };
}

function toUiLesson(l: ManageLesson): UiLesson {
  return {
    id: l.Id,
    title: l.Title,
    description: l.Description,
    resources: (l.Resources ?? []).map(toUiResource),
  };
}

function toUiExam(e: ExamData): UiExam {
  return {
    id: e.Id,
    title: e.Title,
    duration: e.Duration,
    questions: e.Questions as ExamQuestion[],
  };
}

function toUiModule(m: ManageModule): UiModule {
  return {
    id: m.Id,
    title: m.Title,
    order: m.OrderNo,
    lessons: (m.Lessons ?? []).map(toUiLesson),
    exam: m.Exam ? toUiExam(m.Exam) : undefined,
  };
}

/* -------------------------
   Public API cho CourseManagementPage
-------------------------- */
export const courseManagementApi = {
  /** Lấy toàn bộ cấu trúc course (course + modules + lessons + exam) */
  async getStructure(courseId: number): Promise<UiCourseStructure> {
    const res = await client.get<CourseStructureRaw>(`/manage/course/${courseId}/structure`);
    return {
      course: res.data.course,
      modules: (res.data.modules ?? []).map(toUiModule),
    };
  },

  /* ---------- Module ---------- */
  async createModule(courseId: number, title: string): Promise<UiModule> {
    const res = await client.post<ManageModule>(`/manage/course/${courseId}/modules`, { title });
    return toUiModule(res.data);
  },

  async renameModule(moduleId: number, title: string): Promise<UiModule> {
    const res = await client.put<ManageModule>(`/manage/modules/${moduleId}`, { title });
    return toUiModule(res.data);
  },

  async removeModule(moduleId: number): Promise<void> {
    await client.delete(`/manage/modules/${moduleId}`);
  },

  async reorderModule(moduleId: number, orderNo: number): Promise<UiModule> {
    const res = await client.patch<ManageModule>(`/manage/modules/${moduleId}/reorder`, { orderNo });
    return toUiModule(res.data);
  },

  /* ---------- Lesson ---------- */
  async createLesson(
    moduleId: number,
    payload: { title: string; description?: string }
  ): Promise<UiLesson> {
    const res = await client.post<ManageLesson>(`/manage/modules/${moduleId}/lessons`, payload);
    return toUiLesson(res.data);
  },

  async updateLesson(
    lessonId: number,
    payload: { title?: string; description?: string }
  ): Promise<UiLesson> {
    const res = await client.put<ManageLesson>(`/manage/lessons/${lessonId}`, payload);
    return toUiLesson(res.data);
  },

  async removeLesson(lessonId: number): Promise<void> {
    await client.delete(`/manage/lessons/${lessonId}`);
  },

  /* ---------- Resources ---------- */
  /** Upload 1 file, trả về metadata của resource mới */
  async uploadResource(file: File): Promise<UiResource> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post<ResourceFile>("/manage/resources/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return toUiResource(res.data);
  },

  /** Gắn danh sách resourceId vào lesson → trả về lesson đã cập nhật */
  async attachResources(lessonId: number, resources: UiResource[]): Promise<UiLesson> {
    const resourceIds = resources.map((r) => r.id);
    const res = await client.post<ManageLesson>(`/manage/lessons/${lessonId}/resources`, {
      resourceIds,
    });
    return toUiLesson(res.data);
  },

  /* ---------- Exam ---------- */
  async createExam(moduleId: number, title: string): Promise<UiExam> {
    const res = await client.post<ExamData>(`/manage/modules/${moduleId}/exam`, { title });
    return toUiExam(res.data);
  },

  /** Thêm câu hỏi đã có từ QuestionBank vào exam */
  async addExistingQuestion(
    examId: number,
    questionBankId: string,
    points: number
  ): Promise<UiExam> {
    const res = await client.post<ExamData>(`/manage/exams/${examId}/questions/existing`, {
      questionBankId, points,
    });
    return toUiExam(res.data);
  },

  /** Tạo mới 1 câu hỏi (MCQ/Text…) rồi attach vào exam */
  async createQuestionAndAttach(
    examId: number,
    payload: {
      type: "MCQ" | "Fill" | "Essay" | "TF";
      text: string;
      options?: string[];        // cho MCQ
      correctIndex?: number;     // cho MCQ
    }
  ): Promise<{ exam: UiExam }> {
    const res = await client.post<{ exam: ExamData }>(`/manage/exams/${examId}/questions`, payload);
    return { exam: toUiExam(res.data.exam) };
  },

  /** Search QuestionBank */
  async searchQuestions(q: string): Promise<{ items: UiQuestionSearchItem[] }> {
    const res = await client.get<{ items: QuestionBankSearchItem[] }>(
      "/manage/questionBank/search",
      { params: { q } }
    );
    const items: UiQuestionSearchItem[] = (res.data.items ?? []).map((it) => ({
      id: it.Id,
      text: it.QuestionText,
      type: it.Type,
    }));
    return { items };
  },
};

export type {
  UiCourseStructure as CourseStructure,
  UiModule as CourseModule,
  UiLesson as Lesson,
  UiExam as Exam,
  UiResource as Resource,
  UiQuestionSearchItem as Question,
} from "../types/manage";
