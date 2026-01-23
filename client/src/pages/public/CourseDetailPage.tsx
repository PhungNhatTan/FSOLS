import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import courseApi from "../../api/course"
import enrollmentApi, { type EnrollmentStatusResponse } from "../../api/enrollment"
import certificateApi from "../../api/certificate"

import EnrollButton from "../../components/public/course/EnrollButton"
import { useAuth } from "../../hooks/useAuth"

import type { CourseDetail, CourseModule, UserCertificateDetail } from "../../types/course"
import type { Enrollment } from "../../types/enrollment"

import { iconForMediaKind, inferLessonKindFromResources, type MediaKind, type ResourceLike } from "../../utils/mediaKind"

/* ----------------------------- Helpers: time utils ---------------------------- */

const formatMinutes = (minutes: number): string => {
  const m = Math.max(0, Math.floor(minutes))
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm}m`
  if (mm === 0) return `${h}h`
  return `${h}h ${mm}m`
}

const formatDurationHMS = (totalSeconds: number): string => {
  const s = Math.max(0, Math.trunc(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`
}

const secondsUntil = (date: Date): number => {
  const ms = date.getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / 1000)
}

const estimateLessonMinutesByType = (lessonType?: string): number => {
  const t = (lessonType ?? "").toLowerCase()
  if (t.includes("video")) return 10
  if (t.includes("doc") || t.includes("pdf") || t.includes("document")) return 5
  return 5
}

const estimateExamMinutes = (durationMinutes: number | null): number => {
  if (typeof durationMinutes === "number" && durationMinutes > 0) return durationMinutes
  return 10
}

/* ----------------------------- Safe parsing utils ---------------------------- */

type SimpleLesson = { id: string | number; title: string; kind: MediaKind }

type SimpleExam = {
  id: number
  title: string
  durationMinutes: number | null
}

type DerivedModule = {
  key: string
  orderNo: number
  title: string
  lessons: SimpleLesson[]
  exams: SimpleExam[]
}

type CourseDetailExt = CourseDetail & {
  CourseModule?: (CourseModule & { Title?: string | null })[]
  Lessons?: unknown
  Exams?: unknown
  Certificate?: { CertificateId: number }
  isCompleted?: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const asUnknownArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const toArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v != null ? [v] : [])
const hasAny = (v: unknown): boolean => (Array.isArray(v) ? v.length > 0 : v != null)

const pickTitle = (obj: unknown, fallback: string): string => {
  if (!isRecord(obj)) return fallback
  const candidate = obj["Title"] ?? obj["title"] ?? obj["Name"] ?? obj["name"]
  if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim()
  return fallback
}

const pickId = (obj: unknown): string | number | null => {
  if (!isRecord(obj)) return null
  const candidate = obj["Id"] ?? obj["id"]
  if (typeof candidate === "string" || typeof candidate === "number") return candidate
  return null
}

const toNumberId = (id: string | number | null): number | null => {
  if (typeof id === "number" && Number.isFinite(id)) return id
  if (typeof id === "string") {
    const n = Number(id)
    if (Number.isFinite(n)) return n
  }
  return null
}

const pickLessonResources = (lessonObj: unknown): ResourceLike[] => {
  if (!isRecord(lessonObj)) return []
  const raw =
    lessonObj["lessonResources"] ??
    lessonObj["LessonResources"] ??
    lessonObj["resources"] ??
    lessonObj["Resources"]

  const arr = asUnknownArray(raw)
  return arr
    .map((r) => {
      if (!isRecord(r)) return null
      const name = r["Name"] ?? r["name"]
      const url = r["Url"] ?? r["url"]
      return {
        Name: typeof name === "string" ? name : null,
        Url: typeof url === "string" ? url : null,
      }
    })
    .filter(Boolean) as ResourceLike[]
}

const pickDurationMinutes = (examObj: unknown): number | null => {
  if (!isRecord(examObj)) return null

  // 1) Custom duration takes precedence (stored in minutes)
  const custom =
    examObj["DurationCustom"] ??
    examObj["durationCustom"] ??
    examObj["Duration"] ??
    examObj["duration"]

  if (typeof custom === "number" && Number.isFinite(custom) && custom > 0) return custom
  if (typeof custom === "string") {
    const n = Number(custom)
    if (Number.isFinite(n) && n > 0) return n
  }

  // 2) Preset duration (enum DurationPreset: P_15, P_30, P_60, ...)
  const preset = examObj["DurationPreset"] ?? examObj["durationPreset"]
  if (typeof preset === "string") {
    const match = preset.match(/(\d+)/) // "P_60" -> 60
    if (match) {
      const n = Number(match[1])
      if (Number.isFinite(n) && n > 0) return n
    }
  }

  return null
}

const getOrderNo = (obj: unknown): number => {
  if (!isRecord(obj)) return 0
  const v = obj["OrderNo"] ?? obj["orderNo"]
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

const getCourseLessonRaw = (item: unknown): unknown => (isRecord(item) ? item["CourseLesson"] : undefined)
const getExamRaw = (item: unknown): unknown => (isRecord(item) ? item["Exam"] : undefined)

/* -------------------------------- Component -------------------------------- */

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [course, setCourse] = useState<CourseDetailExt | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState<string>("")
  const [userC, setUserCertificate] = useState<UserCertificateDetail | null>(null)

  // Enrollment status (time limit / countdown)
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatusResponse | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Surface notice passed from CourseStudyPage (e.g., time expired).
  useEffect(() => {
    const st = (location.state as { notice?: string } | null) ?? null
    if (st?.notice) {
      setNotice(st.notice)
      // Clear the state to avoid showing the same notice on back/forward navigations.
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.key, location.pathname, location.state, navigate])

  // Load course + enrollment (legacy) + certificate
  useEffect(() => {
    if (!id || !user?.accountId) return

    ;(async () => {
      try {
        const courseData = await courseApi.getCourseWithCertificate(Number(id), user.accountId)
        setCourse(courseData)

        const enrollmentResponse = await courseApi.getEnrollmentStatus(Number(id))
        const enrollmentData = enrollmentResponse?.enrollment || null
        setEnrollment(enrollmentData)

        const certificateId = courseData?.Certificate?.CertificateId

        if (certificateId) {
          try {
            const userCertificate = await certificateApi.getUserCertificate(user.accountId, certificateId.toString())
            setUserCertificate(userCertificate)
          } catch (err: unknown) {
            if (isRecord(err) && isRecord((err as any).response) && (err as any).response.status === 404) {
              // Expected: certificate not issued yet
              setUserCertificate(null)
            } else {
              throw err
            }
          }
        } else {
          setUserCertificate(null)
        }

        setError("")
      } catch (err) {
        console.error("Error fetching course or enrollment data:", err)
        setError("Failed to load course.")
      }
    })()
  }, [id, user?.accountId])

  // Load time limit / time left using enrollment status endpoint
  useEffect(() => {
    if (!id || !user) {
      setEnrollmentStatus(null)
      setExpiresAt(null)
      setTimeLeft(null)
      return
    }

    ;(async () => {
      try {
        const st = await enrollmentApi.getStatus(Number(id))
        setEnrollmentStatus(st)

        const exp = st.expiresAt ? new Date(st.expiresAt) : null
        setExpiresAt(exp)
        setTimeLeft(exp && st.isEnrolled ? secondsUntil(exp) : null)
      } catch (err) {
        console.error("Failed to load enrollment status:", err)
        setEnrollmentStatus(null)
        setExpiresAt(null)
        setTimeLeft(null)
      }
    })()
  }, [id, user])

  // Local countdown for time left (matches EnrollButton UX)
  useEffect(() => {
    if (!user) return

    const t = setInterval(() => {
      if (expiresAt && enrollmentStatus?.isEnrolled) {
        const left = secondsUntil(expiresAt)
        setTimeLeft(left)
      }
    }, 1000)

    return () => clearInterval(t)
  }, [user, expiresAt, enrollmentStatus?.isEnrolled])

  const derived = useMemo(() => {
    if (!course) {
      return {
        modules: [] as DerivedModule[],
        totals: { lessons: 0, exams: 0, modules: 0 },
      }
    }

    let modules: DerivedModule[] = []

    // Preferred: CourseModule -> ModuleItems -> CourseLesson/Exam
    if (Array.isArray(course.CourseModule) && course.CourseModule.length > 0) {
      const cms = [...course.CourseModule].sort((a, b) => a.OrderNo - b.OrderNo)

      modules = cms.map((m) => {
        const moduleItemsRaw = (m as unknown as { ModuleItems?: unknown }).ModuleItems
        const items = asUnknownArray(moduleItemsRaw).sort((a, b) => getOrderNo(a) - getOrderNo(b))

        const lessons: SimpleLesson[] = []
        let lessonIdx = 0

        items.forEach((it) => {
          const raw = getCourseLessonRaw(it)
          if (!hasAny(raw)) return
          const lessonObjs = toArray(raw)
          lessonObjs.forEach((lessonObj) => {
            lessonIdx += 1
            const lessonId = pickId(lessonObj)
            lessons.push({
              id: lessonId ?? `m${m.OrderNo}-l${lessonIdx}`,
              title: pickTitle(lessonObj, `Lesson ${lessonIdx}`),
              kind: inferLessonKindFromResources(pickLessonResources(lessonObj)),
            })
          })
        })

        const exams: SimpleExam[] = []
        let examIdx = 0

        items.forEach((it) => {
          const raw = getExamRaw(it)
          if (!hasAny(raw)) return
          const examObjs = toArray(raw)
          examObjs.forEach((examObj) => {
            examIdx += 1
            const rawId = pickId(examObj)
            const examId = toNumberId(rawId)
            if (examId == null) return
            const duration = pickDurationMinutes(examObj)
            exams.push({
              id: examId,
              title: pickTitle(examObj, `Exam ${examIdx}`),
              durationMinutes: duration != null && duration > 0 ? duration : null,
            })
          })
        })

        const moduleId = (m as unknown as { Id?: string | number }).Id
        const moduleTitle = (m as unknown as { Title?: string | null }).Title

        return {
          key: `module-${moduleId ?? m.OrderNo}`,
          orderNo: m.OrderNo,
          title: typeof moduleTitle === "string" ? moduleTitle : "",
          lessons,
          exams,
        }
      })
    } else {
      // Fallback: older API shape
      const lessonGroups = asUnknownArray(course.Lessons)
      const examGroups = asUnknownArray(course.Exams)

      modules = lessonGroups.map((ls, i) => {
        const lessons: SimpleLesson[] = []
        let lessonIdx = 0

        toArray(ls).forEach((maybeLesson) => {
          const lessonObjs = toArray(maybeLesson)
          lessonObjs.forEach((lessonObj) => {
            lessonIdx += 1
            const lessonId = pickId(lessonObj)
            lessons.push({
              id: lessonId ?? `m${i + 1}-l${lessonIdx}`,
              title: pickTitle(lessonObj, `Lesson ${lessonIdx}`),
              kind: inferLessonKindFromResources(pickLessonResources(lessonObj)),
            })
          })
        })

        const exams: SimpleExam[] = []
        let examIdx = 0
        const examsInModule = asUnknownArray(examGroups[i])

        examsInModule.forEach((e) => {
          const examObjs = toArray(e)
          examObjs.forEach((examObj) => {
            examIdx += 1
            const rawId = pickId(examObj)
            const examId = toNumberId(rawId)
            if (examId == null) return
            const duration = pickDurationMinutes(examObj)
            exams.push({
              id: examId,
              title: pickTitle(examObj, `Exam ${examIdx}`),
              durationMinutes: duration != null && duration > 0 ? duration : null,
            })
          })
        })

        return {
          key: `module-fallback-${i + 1}`,
          orderNo: i + 1,
          title: "",
          lessons,
          exams,
        }
      })
    }

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const totalExams = modules.reduce((sum, m) => sum + m.exams.length, 0)

    return {
      modules,
      totals: { lessons: totalLessons, exams: totalExams, modules: modules.length },
    }
  }, [course])

  const moduleMinutesMap = useMemo(() => {
    const map: Record<string, number> = {}
    derived.modules.forEach((m) => {
      const lessonMinutes = m.lessons.reduce((sum, l) => sum + estimateLessonMinutesByType(l.kind), 0)
      const examMinutes = m.exams.reduce((sum, e) => sum + estimateExamMinutes(e.durationMinutes), 0)
      map[m.key] = lessonMinutes + examMinutes
    })
    return map
  }, [derived.modules])

  const courseMinutes = useMemo(() => {
    return derived.modules.reduce((sum, m) => sum + (moduleMinutesMap[m.key] ?? 0), 0)
  }, [derived.modules, moduleMinutesMap])

  const handleStartCourse = async () => {
    if (!course?.Id) return

    // Require authentication.
    if (!user) {
      navigate("/login", { state: { from: `/course/${course.Id}` } })
      return
    }

    try {
      const st = await enrollmentApi.getStatus(course.Id)

      if (st.isEnrolled) {
        navigate(`/course-study/${course.Id}`)
        return
      }

      // Cooldown active (cannot re-enroll yet)
      const cooldown = st.cooldownSecondsRemaining ?? null
      if (cooldown && cooldown > 0) {
        setNotice(`You can't study this course after the time limit. You can enroll again in ${formatDurationHMS(cooldown)}.`)
        return
      }

      // Not enrolled at all
      setNotice("You must enroll in this course before studying.")
    } catch (err) {
      console.error("Failed to check enrollment status:", err)
      setNotice("Unable to start course right now. Please try again.")
    }
  }

  // Check if course is completed and has a certificate
  const showCertificate =
    enrollment?.Status === "Completed" && Boolean(course?.Certificate?.CertificateId) && Boolean(userC)

  if (!course && !error) {
    return (
      <div className="flex">
        <div className="p-6 max-w-3xl mx-auto flex-1">
          <p>Loading course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <div className="p-6 max-w-4xl mx-auto flex-1">
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {notice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded flex items-start justify-between gap-3">
            <span className="text-sm">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="text-amber-800/70 hover:text-amber-900 text-lg leading-none"
              aria-label="Dismiss notice"
            >
              ×
            </button>
          </div>
        )}

        {course && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-3">{course.Name}</h1>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3 flex-wrap">
                <EnrollButton courseId={course.Id} />

                <button
                  onClick={handleStartCourse}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  <span>▶</span>
                  Start Course
                </button>

                {/* View Certificate button */}
                {user && showCertificate && course?.Certificate?.CertificateId && (
                  <Link
                    to={`/certificate/${user.accountId}/${course.Certificate.CertificateId}`}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
                  >
                    🏆 View Certificate
                  </Link>
                )}
              </div>

              {/* Completion status */}
              {enrollment?.Status === "Completed" && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-green-800 font-medium">Congratulations! You've completed this course.</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{course.Description}</p>
            </div>

            {/* -------------------------- Review course timeline -------------------------- */}
            <div className="mb-6">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-xl font-semibold">Review course timeline</h2>

                  <div className="text-sm text-gray-500">
                    Estimated time: {derived.modules.length > 0 ? `~${formatMinutes(courseMinutes)}` : "—"}
                  </div>

                  {enrollmentStatus?.studyWindowMinutes ? (
                    <div className="text-sm text-gray-500">
                      Time limit: {formatMinutes(enrollmentStatus.studyWindowMinutes)}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm text-gray-500">
                  {derived.totals.modules} modules • {derived.totals.lessons} lessons • {derived.totals.exams} exams
                </div>
              </div>

              {derived.modules.length === 0 ? (
                <p className="text-gray-600">No timeline data available.</p>
              ) : (
                <div className="space-y-3">
                  {derived.modules.map((m) => {
                    const moduleMinutes = moduleMinutesMap[m.key] ?? 0
                    const moduleLabel = m.title?.trim() ? `Module ${m.orderNo}: ${m.title.trim()}` : `Module ${m.orderNo}`

                    return (
                      <details key={m.key} className="border border-gray-200 rounded-lg p-4">
                        <summary className="cursor-pointer select-none font-semibold">
                          {moduleLabel}
                          <span className="ml-2 text-sm text-gray-500">
                            ({m.lessons.length} lessons • {m.exams.length} exams • ~{formatMinutes(moduleMinutes)})
                          </span>
                        </summary>

                        <div className="mt-4">
                          {/* Lessons (text-only) */}
                          {m.lessons.length > 0 ? (
                            <ul className="space-y-2">
                              {m.lessons.map((l, i) => (
                                <li key={String(l.id)} className="flex items-start gap-2 min-w-0">
                                  <span className="mt-0.5 text-gray-500">{i + 1}.</span>
                                  <span className="text-gray-800 truncate">
                                    {iconForMediaKind(l.kind)} {l.title}
                                  </span>
                                  <span className="text-gray-500 text-sm">(~{formatMinutes(estimateLessonMinutesByType(l.kind))})</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600">No lessons in this module.</p>
                          )}

                          {/* Exams (text-only) */}
                          <div className="mt-4 text-sm text-gray-700">
                            <div className="font-medium mb-1">Exams:</div>
                            {m.exams.length > 0 ? (
                              <ul className="space-y-1">
                                {m.exams.map((e, idx) => (
                                  <li key={e.id} className="flex flex-wrap items-center gap-2">
                                    <span className="text-gray-600">Exam {idx + 1}:</span>
                                    <span className="text-gray-800">{e.title || `Exam ${idx + 1}`}</span>
                                    <span className="text-gray-500">(~{formatMinutes(estimateExamMinutes(e.durationMinutes))})</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-500">No exam available</span>
                            )}
                          </div>
                        </div>
                      </details>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Link to="/courses" className="text-blue-600 hover:underline font-medium">
                ← Back to courses
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
