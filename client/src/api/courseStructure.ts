import client from "../service/client";
import type { CourseData, CreateModuleResponse, CreateExamResponse, ExamQuestionPayload } from "../types/manage";

const courseStructureApi = {
  async getCourse(courseId: number): Promise<CourseData> {
    const res = await client.get<CourseData>(`/course/${courseId}`);
    return res.data;
  },

  async createModule(courseId: number, title: string): Promise<CreateModuleResponse> {
    const res = await client.post<CreateModuleResponse>(`/manage/module`, {
      CourseId: courseId,
      Title: title,
      OrderNo: 10,
    });
    return res.data;
  },

  async createExam(courseModuleId: number, title: string): Promise<CreateExamResponse> {
    const res = await client.post<CreateExamResponse>(`/manage/exam`, {
      Title: title,
      CourseModuleId: courseModuleId,
      OrderNo: 10,
    });
    return res.data;
  },

  async addExamQuestion(payload: ExamQuestionPayload): Promise<Record<string, unknown>> {
    const res = await client.post<Record<string, unknown>>(`/manage/examQuestion`, payload);
    return res.data;
  },

  async deleteModule(moduleId: number): Promise<void> {
    await client.delete(`/manage/module/${moduleId}`);
  },

  async deleteExam(examId: number): Promise<void> {
    await client.delete(`/manage/exam/${examId}`);
  },

  async deleteExamQuestion(questionId: number): Promise<void> {
    await client.delete(`/manage/examQuestion/${questionId}`);
  },
};

export default courseStructureApi;
