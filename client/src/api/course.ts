// src/api/course.ts
import client from "../service/client";
import type { Course, CourseDetail, RawCourseDetail, RawCourseModule, CourseModule, VerificationRequest } from "../types/course";
import type { LessonSummary } from "../types/lesson";
import type { Exam } from "../types/exam";
import type { EnrollmentResponse } from "../types/enrollment";

const getAll = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/course");
  return res.data;
};

const getEnrolled = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/course/enrolled");
  return res.data;
}

const getFeatured = async () => {
  const res = await client.get("/course/featured");
  return res.data;
};

const getByCreator = async (): Promise<Course[]> => {
  const res = await client.get<Course[]>("/manage/course");
  return res.data;
};

const mapRawToCourseDetail = (raw: RawCourseDetail & { CourseModule?: RawCourseModule[] }): CourseDetail => {
  // Safe helpers to build grouped lessons/exams
  const buildLessons = (): CourseDetail["Lessons"] => {
    if (Array.isArray(raw.CourseModule) && raw.CourseModule.length) {
      return raw.CourseModule.map((m) =>
        (m.ModuleItems ?? [])
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
        (m.ModuleItems ?? [])
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
    CourseModule: Array.isArray(raw.CourseModule)
      ? (raw.CourseModule.map((m) => ({
        Id: m.Id,
        OrderNo: m.OrderNo,
        ModuleItems: (m.ModuleItems ?? []).map((mi) => ({
          Id: mi.Id,
          OrderNo: mi.OrderNo,
          CourseLesson: mi.CourseLesson ?? null,
          Exam: mi.Exam ?? null,
        })),
      })) as CourseModule[])
      : undefined,
  } as CourseDetail;
};

const getById = async (id: number): Promise<CourseDetail> => {
  const res = await client.get<RawCourseDetail & { CourseModule?: RawCourseModule[] }>(`/course/${id}`);
  const raw = res.data;
  return mapRawToCourseDetail(raw);
};

const getDraftById = async (id: number): Promise<CourseDetail> => {
  const res = await client.get<RawCourseDetail & { CourseModule?: RawCourseModule[] }>(`/manage/course/${id}/draft`);
  const raw = res.data;
  return mapRawToCourseDetail(raw);
};

const getRawById = async (id: number): Promise<RawCourseDetail & { CourseModule?: RawCourseModule[] }> => {
  const res = await client.get<RawCourseDetail & { CourseModule?: RawCourseModule[] }>(`/course/${id}`);
  return res.data;
};

const create = async (data: Pick<Course, "Name" | "Description">): Promise<Course> => {
  const res = await client.post<Course>("/manage/course", {
    name: data.Name,
    description: data.Description,
  });
  return res.data;
};

const update = async (id: number, data: Partial<Pick<Course, "Name" | "Description">>): Promise<Course> => {
  const res = await client.put<Course>(`/manage/course/${id}`, {
    Name: data.Name,
    Description: data.Description,
  });
  return res.data;
};

const remove = async (id: number): Promise<{ Id: number } | null> => {
  const res = await client.delete(`/manage/course/${id}`);
  return res.data;
};

const verify = async (id: number): Promise<void> => {
  await client.put(`/moderator/course/${id}/verify`);
};

const reject = async (id: number, reason: string): Promise<void> => {
  await client.put(`/moderator/course/${id}/reject`, { reason });
};

const getVerificationRequests = async (): Promise<VerificationRequest[]> => {
  const res = await client.get<VerificationRequest[]>("/moderator/course");
  return res.data;
};

const getEnrollmentStatus = async (courseId: number): Promise<EnrollmentResponse | null> => {
  try {
    const res = await client.get<EnrollmentResponse>(`/enrollment/status/${courseId}`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch enrollment status", err);
    return null;
  }
};

const getCourseWithCertificate = async (courseId: number, accountId: string): Promise<CourseDetail> => {
  try {
    const res = await client.get<CourseDetail>(`/course/${courseId}/${accountId}`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch course with certificate", err);
    throw err;
  }
};

const course = { getAll, getEnrolled, getFeatured, getById, getDraftById, getRawById, getByCreator, create, update, remove, verify, reject, getVerificationRequests, getEnrollmentStatus, getCourseWithCertificate };
export default course;
