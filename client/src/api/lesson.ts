import client from "../service/client";
import type { LessonDetail } from "../types";

async function getById(id: number): Promise<LessonDetail> {
  const res = await client.get<LessonDetail>(`/lesson/${id}`);
  return res.data;
}

export default {
  getById,
};
