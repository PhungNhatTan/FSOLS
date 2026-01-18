import client from "../service/client";
import type { LessonDetail } from "../types/lesson";

const getById = async (id: string | number): Promise<LessonDetail> => {
  const res = await client.get<LessonDetail>(`/lesson/${id}`);
  return res.data;
};

// NOTE: Lesson creation via legacy CourseLesson fields is deprecated.
// All file links must be managed through LessonResource via the course draft workflow.

const lesson = { getById };

export default lesson;
