import client from "./client";

export interface Lesson {
  Id: number;
  Title: string;
  LessonType: string;
  Content: string;
}

export const lessonApi = {
  getById: async (id: number): Promise<Lesson> => {
    const res = await client.get<Lesson>(`/lesson/${id}`);
    return res.data;
  },
};
