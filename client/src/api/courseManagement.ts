import client from "../service/client";
import type {
  CourseData,
  ModuleItem,
  ManageLesson,
  ManageModule,
  QuestionBankSearchItem,
  ResourceFile,
  UiCourseStructure,
  UiExam,
  UiLesson,
  UiModule,
  UiQuestionSearchItem,
  UiResource,
} from "../types/manage";
import type { ExamAnswer, ExamData, ExamQuestion } from "../types/exam";
import type { Course } from "../types/course";

type TakingExamResponse = {
  ExamId: number;
  Title: string;
  Duration: number;
  Questions: ExamQuestion[];
};

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
   Public API cho CourseManagementPage
-------------------------- */
export const courseManagementApi = {

  async getStructure(courseId: number): Promise<UiCourseStructure> {
    const res = await client.get<CourseData>(`/course/${courseId}`);
    const course: Course = {
      Id: res.data.Id,
      Name: res.data.Name,
      Description: res.data.Description,
    };

    const modules = (res.data.CourseModule ?? []).map((m) => toUiModule({
      Id: m.Id,
      Title: "Untitled Module",
      OrderNo: m.OrderNo || 0,
      Lessons: [],
    }));

    // Fetch full exam data with questions for each exam
    for (const module of modules) {
      const rawModule = (res.data.CourseModule ?? []).find((m) => m.Id === module.id);
      const examIds: number[] =
        rawModule?.ModuleItems?.flatMap((mi: ModuleItem) => mi.Exam?.map((e) => e.Id) ?? []) ?? [];
      const exams: UiExam[] = [];
      for (const examId of examIds) {
        try {
          const examData = await client.get<TakingExamResponse>(`/exam/takingExam/${examId}`);
          const exam = toUiExam({
            Id: examData.data.ExamId,
            Title: examData.data.Title,
            Duration: examData.data.Duration,
            Questions: examData.data.Questions,
          } as ExamData);
          exams.push(exam);
        } catch (err) {
          console.error(`Failed to load exam ${examId}:`, err);
        }
      }
      module.exams = exams;
    }

    return {
      course,
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

  /* ---------- Resources ---------- */
  /** Upload 1 file, trả về metadata của resource mới */
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

  /** Tạo mới 1 câu hỏi (MCQ/Text…) rồi attach vào exam */
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
  async saveDraft(courseId: number, modules: unknown): Promise<void> {
    await client.post(`/manage/course/${courseId}/draft`, { modules });
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
} from "../types/manage";
