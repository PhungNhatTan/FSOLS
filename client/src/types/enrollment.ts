export interface Enrollment {
  Id: number
  AccountId: string
  CourseId: number
  Status: "Enrolled" | "InProgress" | "Completed"
  EnrolledAt: string
  CompletedAt: string | null
}

export interface EnrollmentWithCourse extends Enrollment {
  Course: {
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
