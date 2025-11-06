import client from "../service/client";
import type { Course, CourseDetail } from "../types";

export const getAll = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/course");
  return res.data;
};

export const getById = async (id: number): Promise<CourseDetail> => {
  const res = await client.get<CourseDetail>(`/course/${id}`);
  return res.data;
};

export const course = { getAll, getById };
export default course;
