// client/src/pages/public/CourseDetailPage.tsx
// ✅ FE-only: show time for MODULE and TOTAL COURSE only (no per-lesson time, no lesson detail fetch)
// ✅ No explicit `any`

"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import courseApi from "../../api/course"
import type { CourseDetail, CourseModule } from "../../types/course"
import CourseSidebar from "../../components/public/courseSidebar/CourseSidebar"
import EnrollButton from "../../components/public/course/EnrollButton"

/* ----------------------------- Helpers: time rule ---------------------------- */

const formatMinutes = (minutes: number): string => {
  const m = Math.max(0, Math.floor(minutes))
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm}m`
  if (mm === 0) return `${h}h`
  return `${h}h ${mm}m`
}

const estimateLessonMinutesByType = (lessonType?: string): number => {
  const t = (lessonType ?? "").toLowerCase()
  if (t.includes("video")) return 10
  if (t.includes("doc") || t.includes("pdf") || t.includes("document")) return 8
  return 7
}

const estimateExamMinutes = (title: string, durationMinutes: number | null): number => {
  if (typeof durationMinutes === "number" && durationMinutes > 0) return durationMinutes
  const lower = title.toLowerCase()
  if (lower.includes("final")) return 30
  return 10
}

/* ----------------------------- Safe parsing utils ---------------------------- */

type SimpleLesson = { id: string | number; title: string; to: string; lessonType?: string }
type SimpleExam = { id: number; title: string; to: string; durationMinutes: number | null }
type DerivedModule = {
  key: string
  orderNo: number
  lessons: SimpleLesson[]
  quiz: SimpleExam | null
  exams: SimpleExam[]
}

type CourseDetailExt = CourseDetail & {
  CourseModule?: CourseModule[]
  Lessons?: unknown
  Exams?: unknown
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

const pickLessonType = (lessonObj: unknown): string | undefined => {
  if (!isRecord(lessonObj)) return undefined
  const v = lessonObj["LessonType"] ?? lessonObj["lessonType"]
  return typeof v === "string" ? v : undefined
}

const pickDurationMinutes = (examObj: unknown): number | null => {
  if (!isRecord(examObj)) return null
  const candidate = examObj["Duration"] ?? examObj["DurationCustom"] ?? examObj["duration"] ?? examObj["durationCustom"]
  if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate
  if (typeof candidate === "string") {
    const n = Number(candidate)
    if (Number.isFinite(n)) return n
  }
  return null
}

const getOrderNo = (obj: unknown): number => {
  if (!isRecord(obj)) return 0
  const v = obj["OrderNo"] ?? obj["orderNo"]
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

// IMPORTANT: in your schema ModuleItem.CourseLesson is CourseLesson[] and ModuleItem.Exam is Exam[]
const getCourseLessonRaw = (item: unknown): unknown => (isRecord(item) ? item["CourseLesson"] : undefined)
const getExamRaw = (item: unknown): unknown => (isRecord(item) ? item["Exam"] : undefined)

/* -------------------------------- Component -------------------------------- */

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<CourseDetailExt | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const courseData = (await courseApi.getById(Number(id))) as CourseDetailExt
        setCourse(courseData)
        setError("")
      } catch (err) {
        console.error(err)
        setError("Failed to load course.")
      }
    })()
  }, [id])

  const derived = useMemo(() => {
    if (!course) {
      return {
        modules: [] as DerivedModule[],
        finalExam: null as SimpleExam | null,
        totals: { lessons: 0, quizzes: 0, modules: 0 },
      }
    }

    // step 1: build modules with lessons+exams (quiz set later)
    let baseModules: Omit<DerivedModule, "quiz">[] = []

    if (Array.isArray(course.CourseModule) && course.CourseModule.length > 0) {
      const cms = [...course.CourseModule].sort((a, b) => a.OrderNo - b.OrderNo)

      baseModules = cms.map((m) => {
        const moduleItemsRaw = (m as unknown as { ModuleItems?: unknown }).ModuleItems
        const items = asUnknownArray(moduleItemsRaw).sort((a, b) => getOrderNo(a) - getOrderNo(b))

        const lessons: SimpleLesson[] = []
        let lessonIdx = 0

        items.forEach((it) => {
          const raw = getCourseLessonRaw(it)
          if (!hasAny(raw)) return
          const lessonObjs = toArray(raw) // ✅ unwrap CourseLesson[]
          lessonObjs.forEach((lessonObj) => {
            lessonIdx += 1
            const lessonId = pickId(lessonObj)
            lessons.push({
              id: lessonId ?? `m${m.OrderNo}-l${lessonIdx}`,
              title: pickTitle(lessonObj, `Lesson ${lessonIdx}`),
              to: lessonId != null ? `/lesson/${lessonId}` : "#",
              lessonType: pickLessonType(lessonObj),
            })
          })
        })

        const exams: SimpleExam[] = []
        let examIdx = 0

        items.forEach((it) => {
          const raw = getExamRaw(it)
          if (!hasAny(raw)) return
          const examObjs = toArray(raw) // ✅ unwrap Exam[]
          examObjs.forEach((examObj) => {
            examIdx += 1
            const rawId = pickId(examObj)
            const examId = toNumberId(rawId)
            if (examId == null) return
            const duration = pickDurationMinutes(examObj)
            exams.push({
              id: examId,
              title: pickTitle(examObj, `Exam ${examIdx}`),
              to: `/exam/${examId}`,
              durationMinutes: duration != null && duration > 0 ? duration : null,
            })
          })
        })

        const moduleId = (m as unknown as { Id?: string | number }).Id

        return {
          key: `module-${moduleId ?? m.OrderNo}`,
          orderNo: m.OrderNo,
          lessons,
          exams,
        }
      })
    } else {
      // Fallback: Lessons[][] & Exams[][]
      const lessonGroups = asUnknownArray(course.Lessons)
      const examGroups = asUnknownArray(course.Exams)

      baseModules = lessonGroups.map((ls, i) => {
        const lessons: SimpleLesson[] = []
        let lessonIdx = 0
        toArray(ls).forEach((maybeLesson) => {
          // ls có thể là array lesson hoặc object lesson
          const lessonObjs = toArray(maybeLesson)
          lessonObjs.forEach((lessonObj) => {
            lessonIdx += 1
            const lessonId = pickId(lessonObj)
            lessons.push({
              id: lessonId ?? `m${i + 1}-l${lessonIdx}`,
              title: pickTitle(lessonObj, `Lesson ${lessonIdx}`),
              to: lessonId != null ? `/lesson/${lessonId}` : "#",
              lessonType: pickLessonType(lessonObj),
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
              to: `/exam/${examId}`,
              durationMinutes: duration != null && duration > 0 ? duration : null,
            })
          })
        })

        return {
          key: `module-fallback-${i + 1}`,
          orderNo: i + 1,
          lessons,
          exams,
        }
      })
    }

    // step 2: final exam = last exam in timeline order
    const allExams: { moduleOrder: number; idx: number; exam: SimpleExam }[] = []
    baseModules.forEach((m) => m.exams.forEach((e, idx) => allExams.push({ moduleOrder: m.orderNo, idx, exam: e })))
    allExams.sort((a, b) => a.moduleOrder - b.moduleOrder || a.idx - b.idx)
    const finalExam = allExams.length ? allExams[allExams.length - 1].exam : null
    const finalId = finalExam?.id ?? null

    // step 3: set quiz per module (pick exam that is NOT final exam)
    const modules: DerivedModule[] = baseModules.map((m) => {
      const quiz = finalId != null ? (m.exams.find((e) => e.id !== finalId) ?? null) : (m.exams[0] ?? null)
      return { ...m, quiz }
    })

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const totalQuizzes = modules.reduce((sum, m) => sum + (m.quiz ? 1 : 0), 0)

    return {
      modules,
      finalExam: finalExam ? { ...finalExam, title: finalExam.title || "Final Exam" } : null,
      totals: { lessons: totalLessons, quizzes: totalQuizzes, modules: modules.length },
    }
  }, [course])

  // ✅ compute module minutes + course minutes (no async)
  const moduleMinutesMap = useMemo(() => {
    const map: Record<string, number> = {}
    derived.modules.forEach((m) => {
      const lessonMinutes = m.lessons.reduce((sum, l) => sum + estimateLessonMinutesByType(l.lessonType), 0)
      const examMinutes = m.exams.reduce((sum, e) => sum + estimateExamMinutes(e.title, e.durationMinutes), 0)
      map[m.key] = lessonMinutes + examMinutes
    })
    return map
  }, [derived.modules])

  const courseMinutes = useMemo(() => {
    return derived.modules.reduce((sum, m) => sum + (moduleMinutesMap[m.key] ?? 0), 0)
  }, [derived.modules, moduleMinutesMap])

  if (!course && !error) {
    return (
      <div className="flex">
        <CourseSidebar />
        <div className="p-6 max-w-3xl mx-auto flex-1">
          <p>Loading course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <CourseSidebar />
      <div className="p-6 max-w-4xl mx-auto flex-1">
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {course && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-3">{course.Name}</h1>
              <div className="mt-4 max-w-xs">
                <EnrollButton courseId={course.Id} />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{course.Description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-xl font-semibold">Review course timeline</h2>
                  <div className="text-sm text-gray-500">
                    Estimated time: {derived.modules.length > 0 ? `~${formatMinutes(courseMinutes)}` : "—"}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {derived.totals.modules} modules • {derived.totals.lessons} lessons • {derived.totals.quizzes} quizzes
                </div>
              </div>

              {derived.modules.length === 0 ? (
                <p className="text-gray-600">No timeline data available.</p>
              ) : (
                <div className="space-y-3">
                  {derived.modules.map((m) => {
                    const moduleMinutes = moduleMinutesMap[m.key] ?? 0
                    const finalId = derived.finalExam?.id
                    const quizIsFinal = m.quiz?.id != null && finalId != null && m.quiz.id === finalId

                    return (
                      <details key={m.key} className="border border-gray-200 rounded-lg p-4">
                        <summary className="cursor-pointer select-none font-semibold">
                          Module {m.orderNo}
                          <span className="ml-2 text-sm text-gray-500">
                            ({m.lessons.length} lessons • {m.quiz ? 1 : 0} quiz • ~{formatMinutes(moduleMinutes)})
                          </span>
                        </summary>

                        <div className="mt-4">
                          {m.lessons.length > 0 ? (
                            <ul className="space-y-2">
                              {m.lessons.map((l, i) => (
                                <li key={String(l.id)} className="flex items-start gap-2 min-w-0">
                                  <span className="mt-0.5 text-gray-500">{i + 1}.</span>
                                  <Link to={l.to} className="text-gray-800 hover:underline truncate">
                                    📹 {l.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600">No lessons in this module.</p>
                          )}

                          <div className="mt-3 text-sm text-gray-700 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{quizIsFinal ? "Final Exam (Certificate):" : "Quiz:"}</span>
                              {m.quiz ? (
                                <>
                                  <Link to={m.quiz.to} className="text-blue-600 hover:underline">
                                    {m.quiz.title || "Module Quiz"}
                                  </Link>
                                  <span className="text-gray-500">
                                    (~{formatMinutes(estimateExamMinutes(m.quiz.title, m.quiz.durationMinutes))})
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500">No quiz available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </details>
                    )
                  })}
                </div>
              )}

              <div className="mt-5 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="font-semibold mb-1">Final Exam (for Certificate)</div>
                {derived.finalExam ? (
                  <div className="text-sm text-gray-700">
                    Finish all lessons and module quizzes, then take the final exam to receive your certificate:{" "}
                    <Link to={derived.finalExam.to} className="text-blue-600 hover:underline">
                      {derived.finalExam.title || "Final Exam"}
                    </Link>{" "}
                    <span className="text-gray-500">
                      (~{formatMinutes(estimateExamMinutes(derived.finalExam.title, derived.finalExam.durationMinutes))}
                      )
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No final exam found for this course.</div>
                )}
              </div>
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
