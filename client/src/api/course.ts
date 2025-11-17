import client from "../service/client";
import type { Course, CourseDetail, RawCourseDetail, RawCourseModule } from "../types/course";

export const getAll = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/course");
  return res.data;
};


export const getById = async (id: number): Promise<CourseDetail> => {

  const res = await client.get<RawCourseDetail & { CourseModule?: RawCourseModule[] }>(`/course/${id}`);
  const raw = res.data;


  let lessons: CourseDetail["Lessons"] = [];
  if (Array.isArray(raw.CourseModule) && raw.CourseModule.length) {
    lessons = raw.CourseModule.map(m =>
      m.ModuleItems.map(mi => mi.CourseLesson).filter(Boolean) as Exclude<CourseDetail["Lessons"][number], undefined>
    );
  } else if (Array.isArray(raw.Lessons)) {
    lessons = Array.isArray(raw.Lessons[0])
      ? (raw.Lessons as unknown as CourseDetail["Lessons"])
      : [raw.Lessons as unknown as CourseDetail["Lessons"][0]];
  }

  let exams: CourseDetail["Exams"] = [];
  if (Array.isArray(raw.CourseModule) && raw.CourseModule.length) {
    exams = raw.CourseModule.map(m =>
      m.ModuleItems.map(mi => mi.Exam).filter(Boolean) as Exclude<CourseDetail["Exams"][number], undefined>
    );
  } else if (Array.isArray(raw.Exams)) {
    exams = Array.isArray(raw.Exams[0])
      ? (raw.Exams as unknown as CourseDetail["Exams"])
      : [raw.Exams as unknown as CourseDetail["Exams"][0]];
  }

  return {
    Id: raw.Id,
    Name: raw.Name,
    Description: raw.Description,
    Lessons: lessons,
    Exams: exams,
  };
};

export const create = async (data: { name: string; description: string }): Promise<Course> => {
  const res = await client.post<Course>("/manage/course", data);
  return res.data;
};

export const update = async (id: number, data: { name: string; description: string }): Promise<Course> => {
  const res = await client.put<Course>(`/manage/course/${id}`, data);
  return res.data;
};

export const remove = async (id: number): Promise<{ Id: number } | null> => {
  const res = await client.delete(`/manage/course/${id}`);
  return res.data;
};


export const course = { getAll, getById };
export default course;
