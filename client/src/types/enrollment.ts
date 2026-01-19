export interface Enrollment {
  Id: number
  AccountId: string
  CourseId: number
  Status: "Enrolled" | "InProgress" | "Completed"
  EnrolledAt: string
  CompletedAt: string | null
  DeletedAt?: string | null
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

export interface EnrollmentResponse {
  isEnrolled: boolean
  enrollment: Enrollment | null

  // Optional: time-limit / cooldown metadata (server provides these)
  expiresAt?: string | null
  secondsRemaining?: number | null
  canEnrollAt?: string | null
  cooldownSecondsRemaining?: number | null
  studyWindowMinutes?: number
  reenrollCooldownMinutes?: number
}
