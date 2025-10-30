import http from "./http";

export interface Lesson {
  Id: number;
  Title: string;
  Content: string;
  LessonType: string;
}

export async function getLesson(id: number): Promise<Lesson> {
  const res = await http.get<Lesson>(`/lesson/${id}`);
  return res.data;
}
