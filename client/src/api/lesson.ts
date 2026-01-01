import client from "../service/client";
import type { LessonDetail, Lesson, CreateLessonData } from "../types/lesson";

const getById = async (id: string | number): Promise<LessonDetail> => {
  const res = await client.get<LessonDetail>(`/lesson/${id}`);
  return res.data;
};

const create = async (data: CreateLessonData): Promise<Lesson> => {
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
};

const lesson = { getById, create };

export default lesson;