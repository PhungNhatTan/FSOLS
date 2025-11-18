import client from "./client";

export interface Course {
  Id: number;
  Title?: string;
  Name?: string;
  Description: string;
  Instructor?: string;
  LessonCount?: number;
}

export interface CourseDetail {
  Id: number;
  Name: string;
  Description: string;
  CourseModule?: Array<{
    Id: number;
    OrderNo: number;
    ModuleItems: Array<{
      Id: string;
      OrderNo: number;
      CourseLesson?: { Id: string; Title: string; LessonType: string };
      Exam?: { Id: number; Title: string };
    }>;
  }>;
  Exam?: Array<{ Id: number; Title: string }>;
  Lessons?: Array<{ Id: number; Title: string }>;
}

export interface UpdateCourseData {
  name?: string;
  description?: string;
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

  update: async (id: number, data: UpdateCourseData): Promise<CourseDetail> => {
    const res = await client.put<CourseDetail>(`/course/${id}`, data);
    return res.data;
  },
};

export default courseApi;
