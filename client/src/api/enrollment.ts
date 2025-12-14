import client from "../service/client"

export interface Enrollment {
  Id: number
  AccountId: string
  CourseId: number
  Status: "Enrolled" | "InProgress" | "Completed"
  EnrolledAt: string
  CompletedAt: string | null
  Course?: {
    Id: number
    Name: string
    Description?: string
    CreatedBy?: {
      Name: string
    }
    Category?: {
      Name: string
    }
  }
}

export interface EnrollmentStatusResponse {
  isEnrolled: boolean
  enrollment: Enrollment | null
}

/**
 * Enroll in a course
 */
const enroll = async (courseId: number): Promise<{ message: string; enrollment: Enrollment }> => {
  const res = await client.post(`/enrollment/${courseId}`)
  return res.data
}

/**
 * Unenroll from a course
 */
const unenroll = async (courseId: number): Promise<{ message: string }> => {
  const res = await client.delete(`/enrollment/${courseId}`)
  return res.data
}

/**
 * Get enrollment status for a specific course
 */
const getStatus = async (courseId: number): Promise<EnrollmentStatusResponse> => {
  const res = await client.get(`/enrollment/status/${courseId}`)
  return res.data
}

/**
 * Get all enrolled courses for the current user
 */
const getEnrolled = async (): Promise<Enrollment[]> => {
  const res = await client.get("/enrollment")
  return res.data
}

const enrollmentApi = {
  enroll,
  unenroll,
  getStatus,
  getEnrolled,
}

export default enrollmentApi
