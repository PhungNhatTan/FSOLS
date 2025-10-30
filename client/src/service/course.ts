import http from "../service/http";

export interface CourseLesson {
  Id: number;
  Title: string;
  LessonType: string;
}

export interface Exam {
  Id: number;
  Title: string;
}

export interface ModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?: CourseLesson;
  Exam?: Exam;
}

export interface CourseModule {
  Id: number;
  OrderNo: number;
  ModuleItems: ModuleItem[];
}

export interface Course {
  Id: number;
  Name: string;
  Description: string;
  CourseModule: CourseModule[];
  Exam?: Exam;
}

export async function getAllCourses(): Promise<Course[]> {
  const res = await http.get<Course[]>("/course");
  return res.data;
}

export async function getCourse(id: number): Promise<Course> {
  const res = await http.get<Course>(`/course/${id}`);
  return res.data;
}
