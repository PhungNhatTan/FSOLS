import client from "../service/client";
import type {
  CourseData,
  ManageLesson,
  ManageModule,
  QuestionBankSearchItem,
  ResourceFile,
  UiExam,
  UiLesson,
  UiModule,
  UiQuestionSearchItem,
  UiResource,
  CourseStructureRaw,
} from "../types/manage";
import type { ExamAnswer, ExamData, ExamQuestion } from "../types/exam";
import type { DraftJson, RawCourseModule } from "../types/course";


let tempIdCounter = -1;
function generateTempId() {
  return tempIdCounter--;
}

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
    order: 0,
    resources: (l.Resources ?? []).map(toUiResource),
  };
}

function toUiExam(e: ExamData): UiExam {
  return {
    id: e.Id,
    title: e.Title,
    duration: e.Duration,
    order: e.ModuleItem?.OrderNo ?? e.OrderNo ?? 0,
    questions: e.Questions as ExamQuestion[],
  };
}

type ManageExamQuestion = {
  ExamQuestionId?: string;
  Id?: string;
  QuestionBankId?: string;
  QuestionText: string;
  Type: ExamQuestion["Type"];
  Answers?: ExamAnswer[];
};

type ManageExamQuestionResponse = {
  ExamId?: number;
  Id?: number;
  Title: string;
  Duration: number;
  Questions?: ManageExamQuestion[];
};

function normalizeExamResponse(data: ManageExamQuestionResponse): ExamData {
  const examId = data.ExamId ?? data.Id;
  if (examId === undefined) throw new Error("Exam id missing");

  return {
    Id: examId,
    Title: data.Title,
    Duration: data.Duration,
    Questions: (data.Questions ?? []).map((q: ManageExamQuestion) => {
      const examQuestionId = q.ExamQuestionId ?? q.Id;
      if (examQuestionId === undefined) throw new Error("Exam question id missing");

      const questionBankId = q.QuestionBankId ?? q.Id;
      if (questionBankId === undefined) throw new Error("Question bank id missing");

      return {
        ExamQuestionId: examQuestionId,
        QuestionBankId: questionBankId,
        QuestionText: q.QuestionText,
        Type: q.Type,
        Answers: q.Answers ?? [],
      };
    }),
  };
}

function toUiModule(m: ManageModule): UiModule {
  return {
    id: m.Id,
    title: m.Title || `Module ${m.OrderNo}`,
    order: m.OrderNo,
    lessons: (m.Lessons ?? []).map(toUiLesson),
    exams: m.Exam ? [toUiExam(m.Exam)] : [],
  };
}

/* -------------------------
   Draft Resource Types (re-export from types/manage)
-------------------------- */
import type { DraftResource } from "../types/manage";
// import { LessonSummary } from "../types";
// import { mapStructureToManage } from "../service/CourseManagementService";

/* -------------------------
   Public API cho CourseManagementPage
-------------------------- */

interface RawLesson {
  Id?: number;
  id?: number;
  Title?: string;
  title?: string;
  lessonResources?: { Id: number; Name: string; Url: string }[];
}

interface RawExam {
  Id?: number;
  id?: number;
  Title?: string;
  title?: string;
  DurationCustom?: number;
  DurationPreset?: string;
}

function normalizeModule(raw: RawCourseModule): ManageModule {
  const lessons: ManageLesson[] = [];
  const exams: ExamData[] = [];

  (raw.ModuleItems ?? []).forEach((mi) => {
    // Handle CourseLesson (can be object or array)
    const rawLesson = mi.CourseLesson as unknown;
    if (Array.isArray(rawLesson)) {
      (rawLesson as RawLesson[]).forEach((l) => {
        lessons.push({
          Id: l.Id ?? l.id ?? generateTempId(),
          Title: l.Title ?? l.title ?? "Untitled Lesson",
          Resources: (l.lessonResources ?? []).map((r) => ({
            Id: r.Id,
            Name: r.Name,
            Url: r.Url,
          })),
        });
      });
    } else if (rawLesson) {
      const l = rawLesson as RawLesson;
      lessons.push({
        Id: l.Id ?? l.id ?? generateTempId(),
        Title: l.Title ?? l.title ?? "Untitled Lesson",
        Resources: [],
      });
    }

    // Handle Exam (can be object or array)
    const rawExam = mi.Exam as unknown;
    if (Array.isArray(rawExam)) {
      (rawExam as RawExam[]).forEach((e) => {
        exams.push({
          Id: e.Id ?? e.id ?? generateTempId(),
          Title: e.Title ?? e.title ?? "Untitled Exam",
          Duration: e.DurationCustom ?? 0,
          DurationPreset: e.DurationPreset,
          DurationCustom: e.DurationCustom,
          Questions: [],
          OrderNo: 0,
        });
      });
    } else if (rawExam) {
      const e = rawExam as RawExam;
      exams.push({
        Id: e.Id ?? e.id ?? generateTempId(),
        Title: e.Title ?? e.title ?? "Untitled Exam",
        Duration: 0,
        Questions: [],
        OrderNo: 0,
      });
    }
  });

  const looseRaw = raw as RawCourseModule & { id?: number; orderNo?: number };
  return {
    Id: raw.Id ?? looseRaw.id ?? generateTempId(),
    Title: `Module ${raw.OrderNo ?? looseRaw.orderNo ?? 0}`,
    OrderNo: raw.OrderNo ?? looseRaw.orderNo ?? 0,
    Lessons: lessons,
    Exam: exams.length ? exams[0] : undefined,
  };
}

export const courseManagementApi = {
  async getStructure(courseId: number): Promise<CourseStructureRaw> {
    const res = await client.get<CourseData>(`/course/${courseId}`);
    const modules: ManageModule[] = (res.data.CourseModule ?? []).map(normalizeModule);

    return {
      course: res.data,
      modules,
    };
  },
  /* ---------- Module ---------- */
  async createModule(courseId: number, title: string): Promise<UiModule> {
    const res = await client.post<ManageModule>(`/manage/module`, {
      CourseId: courseId,
      Title: title,
      OrderNo: 10,
    });
    return toUiModule(res.data);
  },

  async renameModule(moduleId: number, title: string): Promise<UiModule> {
    const res = await client.post<ManageModule>(`/manage/module`, {
      Id: moduleId,
      Title: title,
    });
    return toUiModule(res.data);
  },

  async removeModule(moduleId: number): Promise<void> {
    await client.delete(`/manage/module/${moduleId}`);
  },

  async reorderModule(moduleId: number, orderNo: number): Promise<UiModule> {
    const res = await client.post<ManageModule>(`/manage/module`, {
      Id: moduleId,
      OrderNo: orderNo,
    });
    return toUiModule(res.data);
  },

  /* ---------- Lesson ---------- */
  async createLesson(
    moduleId: number,
    payload: { title: string; description?: string }
  ): Promise<UiLesson> {
    const res = await client.post<ManageLesson>(`/manage/lesson`, {
      CourseModuleId: moduleId,
      Title: payload.title,
      Content: payload.description,
    });
    return toUiLesson(res.data);
  },

  async updateLesson(
    lessonId: number,
    payload: { title?: string; description?: string }
  ): Promise<UiLesson> {
    const res = await client.post<ManageLesson>(`/manage/lesson`, {
      Id: lessonId,
      Title: payload.title,
      Content: payload.description,
    });
    return toUiLesson(res.data);
  },

  async removeLesson(lessonId: number): Promise<void> {
    await client.delete(`/manage/lesson/${lessonId}`);
  },

  /* ---------- Resources (Production) ---------- */
  /** Upload 1 file to production storage, returns resource metadata */
  async uploadResource(file: File): Promise<UiResource> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post<ResourceFile>("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return toUiResource(res.data);
  },

  async attachResources(lessonId: number, resources: UiResource[]): Promise<UiLesson> {
    const resourceIds = resources.map((r) => r.id);
    const res = await client.post<ManageLesson>(`/manage/lesson`, {
      Id: lessonId,
      Resources: resourceIds,
    });
    return toUiLesson(res.data);
  },

  /* ---------- Draft Resources ---------- */
  /** Upload file to draft storage for a specific course */
  async uploadDraftResource(courseId: number, file: File): Promise<DraftResource> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await client.post<{
      id: string;
      name: string;
      url: string;
      size: number;
      type: string;
      uploadedAt: string;
    }>(`/manage/course/${courseId}/draft/resource`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },

  /** List all draft resources for a course */
  async listDraftResources(courseId: number): Promise<DraftResource[]> {
    const res = await client.get<DraftResource[]>(`/manage/course/${courseId}/draft/resources`);
    return res.data;
  },

  /** Delete a draft resource */
  async deleteDraftResource(courseId: number, resourceId: string): Promise<void> {
    await client.delete(`/manage/course/${courseId}/draft/resource/${resourceId}`);
  },

  /* ---------- Exam ---------- */
  async createExam(moduleId: number, title: string, durationPreset?: string, durationCustom?: number): Promise<UiExam> {
    const res = await client.post<ExamData>(`/manage/exam`, {
      CourseModuleId: moduleId,
      Title: title,
      Description: "",
      OrderNo: 10,
      DurationPreset: durationPreset,
      DurationCustom: durationCustom,
    });
    return toUiExam(res.data);
  },

  async addExistingQuestion(
    examId: number,
    questionBankId: string
  ): Promise<UiExam> {
    const res = await client.post<ManageExamQuestionResponse>(`/manage/examQuestion`, {
      examId,
      mode: "useQB",
      data: {
        questionId: questionBankId,
      },
    });
    const exam = normalizeExamResponse(res.data);
    return toUiExam(exam);
  },

  /** Create new question and attach to exam */
  async createQuestionAndAttach(
    examId: number,
    courseId: number,
    payload: {
      type: "MCQ" | "Fill" | "Essay" | "TF";
      text: string;
      options?: string[];
      correctIndex?: number;
    }
  ): Promise<{ exam: UiExam }> {
    console.log("[API] createQuestionAndAttach called with:", { examId, courseId, payload });
    try {
      const res = await client.post<ManageExamQuestionResponse>(`/manage/examQuestion`, {
        examId,
        courseId,
        mode: "createQB",
        data: {
          questionText: payload.text,
          type: payload.type,
          answers: payload.options?.map((opt, idx) => ({
            text: opt,
            isCorrect: idx === payload.correctIndex,
          })),
        },
      });
      console.log("[API] Response received:", res.data);
      const exam = normalizeExamResponse(res.data);
      console.log("[API] Normalized exam:", exam);
      return { exam: toUiExam(exam) };
    } catch (error) {
      console.error("[API] Error in createQuestionAndAttach:", error);
      throw error;
    }
  },

  /** Search QuestionBank */
  async searchQuestions(q: string): Promise<{ items: UiQuestionSearchItem[] }> {
    const res = await client.get<{ items: QuestionBankSearchItem[] }>(
      "/questionBank",
      { params: { search: q } }
    );
    const items: UiQuestionSearchItem[] = (res.data.items ?? []).map((it) => ({
      id: it.Id,
      text: it.QuestionText,
      type: it.Type,
    }));
    return { items };
  },

  /** Get questions linked to a course */
  async getQuestionsByCourse(courseId: number): Promise<{ items: UiQuestionSearchItem[] }> {
    const res = await client.get<QuestionBankSearchItem[]>(
      `/questionBank/course/${courseId}`
    );
    const questions = Array.isArray(res.data) ? res.data : [];
    const items: UiQuestionSearchItem[] = questions.map((q) => ({
      id: q.Id,
      text: q.QuestionText,
      type: q.Type,
    }));
    return { items };
  },

  /** Delete exam */
  async deleteExam(examId: number): Promise<void> {
    await client.delete(`/manage/exam/${examId}`);
  },

  /** Remove question from exam */
  async removeExamQuestion(examQuestionId: string): Promise<void> {
    await client.delete(`/manage/examQuestion/${examQuestionId}`);
  },

  /** Save draft to database */
  getDraft: async (courseId: number) => {
    const response = await client.get(`/manage/course/${courseId}/draft`);
    console.log("Draft data received:", response.data);
    return response.data;
  },

  getVerificationDraft: async (courseId: number) => {
    const response = await client.get(`/manage/course/${courseId}/verification-draft`);
    console.log("Verification draft data received:", response.data);
    return response.data;
  },

  saveDraft: async (courseId: number, draft: DraftJson) => {
    const response = await client.put(`/manage/course/${courseId}/draft`, { draft });
    return response.data;
  },

  /** Publish entire course structure to database */
  async publishCourse(courseId: number, modules: unknown): Promise<void> {
    await client.post(`/manage/course/${courseId}/publish`, { modules });
  },

  /** Send course for verification */
  async requestVerification(courseId: number): Promise<{ Id: string; ApprovalStatus: string; RequestType: string; CreatedAt: string }> {
    const res = await client.post<{ Id: string; ApprovalStatus: string; RequestType: string; CreatedAt: string }>(`/manage/course/${courseId}/verification-request`, {});
    return res.data;
  },

  /** Get verification status for a course */
  async getVerificationStatus(courseId: number): Promise<{ Id: string; ApprovalStatus: string; RequestType: string; CreatedAt: string; ReviewedAt?: string } | null> {
    const res = await client.get<{ Id: string; ApprovalStatus: string; RequestType: string; CreatedAt: string; ReviewedAt?: string } | null>(`/manage/course/${courseId}/verification-status`);
    return res.data;
  },
};

export type {
  UiCourseStructure as CourseStructure,
  UiModule as CourseModule,
  UiLesson as Lesson,
  UiExam as Exam,
  UiResource as Resource,
  UiQuestionSearchItem as Question,
  DraftResource,
} from "../types/manage";