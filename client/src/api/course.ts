import client from "./client";

export interface Course {
  Id: number;
  Title: string;
  Description: string;
  Instructor: string;
  LessonCount: number;
}

export interface CourseDetail extends Course {
  Lessons: { Id: number; Title: string }[];
}

const courseApi = {
  getAll: async (): Promise<Course[]> => {
    const res = await client.get<Course[]>("/course");
    return res.data;
  },

  getById: async (id: number): Promise<CourseDetail> => {
    const res = await client.get<CourseDetail>(`/course/${id}`);
    return res.data;
  },
};

export default courseApi;
