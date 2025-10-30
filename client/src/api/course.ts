import axiosClient from "./client";
import type { Course } from "../types/type";

const course = {
  getAll: async (): Promise<Course[]> => {
    const res = await axiosClient.get<Course[]>("/course");
    return res.data;
  },

  getById: async (id: number): Promise<Course> => {
    const res = await axiosClient.get<Course>(`/course/${id}`);
    return res.data;
  },

  create: async (data: Partial<Course>): Promise<Course> => {
    const res = await axiosClient.post<Course>("/course", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Course>): Promise<Course> => {
    const res = await axiosClient.put<Course>(`/course/${id}`, data);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/course/${id}`);
  },
};

export default course;
