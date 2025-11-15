// src/api/course.ts
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

export const create = async (
  data: Pick<Course, "Name" | "Description">
): Promise<Course> => {
  const res = await client.post<Course>("/manage/course", data);
  return res.data;
};

export const update = async (
  id: number,
  data: Partial<Pick<Course, "Name" | "Description">>
): Promise<Course> => {
  const res = await client.put<Course>(`/manage/course/${id}`, data);
  return res.data;
};

export const remove = async (id: number): Promise<Course> => {
  const res = await client.delete<Course>(`/manage/course/${id}`);
  return res.data;
};

const course = { getAll, getById, create, update, remove };
export default course;
