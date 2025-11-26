import client from "./client";

export interface Lesson {
  Id: string;
  Title: string;
  LessonType: string;
  VideoUrl?: string;
  DocUrl?: string;
  Content?: string;
}

export interface CreateLessonData {
  Title: string;
  LessonType: "Video" | "Document";
  CourseModuleId?: number;
  OrderNo?: number;
  file: File;
}

export const lessonApi = {
  getById: async (id: string): Promise<Lesson> => {
    const res = await client.get<Lesson>(`/lesson/${id}`);
    return res.data;
  },

  create: async (data: CreateLessonData): Promise<Lesson> => {
    const formData = new FormData();
    formData.append("Title", data.Title);
    formData.append("LessonType", data.LessonType);
    if (data.CourseModuleId) {
      formData.append("CourseModuleId", data.CourseModuleId.toString());
    }
    if (data.OrderNo) {
      formData.append("OrderNo", data.OrderNo.toString());
    }
    formData.append("file", data.file);

    const res = await client.post<Lesson>("/lesson", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
