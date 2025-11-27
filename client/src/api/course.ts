// src/api/course.ts
import client from "../service/client";
import type { Course, CourseDetail, RawCourseDetail, RawCourseModule } from "../types/course";
import type { LessonSummary } from "../types/lesson";
import type { Exam } from "../types/exam";

const getAll = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/course");
  return res.data;
};

const getByCreator = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/manage/course");
  return res.data;
};

const mapRawToCourseDetail = (raw: RawCourseDetail & { CourseModule?: RawCourseModule[] }): CourseDetail => {
  // use LessonSummary and Exam types from their respective modules
  // Safe helpers to build grouped lessons/exams
  const buildLessons = (): CourseDetail["Lessons"] => {
    if (Array.isArray(raw.CourseModule) && raw.CourseModule.length) {
      return raw.CourseModule.map((m) =>
        m.ModuleItems
          .map((mi) => mi.CourseLesson)
          .filter((l): l is LessonSummary => l != null && (l as LessonSummary).Id != null)
      ) as CourseDetail["Lessons"];
    }

    if (Array.isArray(raw.Lessons)) {
      if (Array.isArray(raw.Lessons[0])) {
        return (raw.Lessons as unknown as CourseDetail["Lessons"]).map((g) =>
          (g as unknown[]).filter((it): it is LessonSummary => it != null && (it as LessonSummary).Id != null)
        ) as CourseDetail["Lessons"];
      }
      return [
        (raw.Lessons as unknown[]).filter((it): it is LessonSummary => it != null && (it as LessonSummary).Id != null),
      ] as CourseDetail["Lessons"];
    }

    return [];
  };

  const buildExams = (): CourseDetail["Exams"] => {
    if (Array.isArray(raw.CourseModule) && raw.CourseModule.length) {
      return raw.CourseModule.map((m) =>
        m.ModuleItems
          .map((mi) => mi.Exam)
          .filter((e): e is Exam => e != null && (e as Exam).Id != null)
      ) as CourseDetail["Exams"];
    }

    if (Array.isArray(raw.Exams)) {
      if (Array.isArray(raw.Exams[0])) {
        return (raw.Exams as unknown as CourseDetail["Exams"]).map((g) =>
          (g as unknown[]).filter((it): it is Exam => it != null && (it as Exam).Id != null)
        ) as CourseDetail["Exams"];
      }
      return [
        (raw.Exams as unknown[]).filter((it): it is Exam => it != null && (it as Exam).Id != null),
      ] as CourseDetail["Exams"];
    }

    return [];
  };

  return {
    Id: raw.Id,
    Name: raw.Name,
    Description: raw.Description,
    Lessons: buildLessons(),
    Exams: buildExams(),
  } as CourseDetail;
};

const getById = async (id: number): Promise<CourseDetail> => {
  const res = await client.get<RawCourseDetail & { CourseModule?: RawCourseModule[] }>(`/course/${id}`);
  const raw = res.data;
  return mapRawToCourseDetail(raw);
};

const create = async (data: Pick<Course, "Name" | "Description">): Promise<Course> => {
  const res = await client.post<Course>("/manage/course", data);
  return res.data;
};

const update = async (id: number, data: Partial<Pick<Course, "Name" | "Description">>): Promise<Course> => {
  const res = await client.put<Course>(`/manage/course/${id}`, data);
  return res.data;
};

const remove = async (id: number): Promise<{ Id: number } | null> => {
  const res = await client.delete(`/manage/course/${id}`);
  return res.data;
};

const verify = async (id: number): Promise<void> => {
  await client.put(`/moderator/course/${id}/verify`);
};

const course = { getAll, getById, getByCreator, create, update, remove, verify };
export default course;
