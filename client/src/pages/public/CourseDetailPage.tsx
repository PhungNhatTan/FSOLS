"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import courseApi from "../../api/course"
import type { CourseDetail, CourseModule } from "../../types/course"

import CourseSidebar from "../../components/public/courseSidebar/CourseSidebar"
import EnrollButton from "../../components/public/course/EnrollButton"

type SimpleLesson = { id: string | number; title: string; to: string }
type SimpleExam = { id: number; title: string; to: string }

type DerivedModule = {
  key: string
  orderNo: number
  lessons: SimpleLesson[]
  quiz: SimpleExam | null
  exams: SimpleExam[]
}

// ---------- safe helpers (NO any) ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null

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

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return

    ;(async () => {
      try {
        const courseData = await courseApi.getById(Number(id))
        setCourse(courseData)
        setError("")
      } catch (err) {
        setError("Failed to load course.")
        console.error(err)
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

    let modules: DerivedModule[] = []

    // 1) Prefer CourseModule
    if (Array.isArray(course.CourseModule) && course.CourseModule.length > 0) {
      const cms = [...course.CourseModule].sort((a, b) => a.OrderNo - b.OrderNo)

      modules = cms.map((m: CourseModule) => {
        const orderedItems = [...(m.ModuleItems ?? [])].sort((a, b) => a.OrderNo - b.OrderNo)

        const lessonItems = orderedItems.filter((it) => !!it.CourseLesson)
        const lessons: SimpleLesson[] = lessonItems.map((it, idx) => {
          const lessonObj: unknown = it.CourseLesson ?? null
          const lessonId = pickId(lessonObj)
          return {
            id: lessonId ?? `m${m.OrderNo}-l${idx + 1}`,
            title: pickTitle(lessonObj, `Lesson ${idx + 1}`),
            to: lessonId != null ? `/lesson/${lessonId}` : "#",
          }
        })

        const examItems = orderedItems.filter((it) => !!it.Exam)
        const exams: SimpleExam[] = examItems
          .map((it, idx) => {
            const examObj: unknown = it.Exam ?? null
            const rawId = pickId(examObj)
            const examId = toNumberId(rawId)
            if (examId == null) return null
            return {
              id: examId,
              title: pickTitle(examObj, `Exam ${idx + 1}`),
              to: `/course/${course.Id}/takingExam/${examId}`,
            }
          })
          .filter((x): x is SimpleExam => x !== null)

        const quiz = exams.length > 0 ? { ...exams[0], title: exams[0].title || "Module Quiz" } : null

        return {
          key: `module-${m.Id ?? m.OrderNo}`,
          orderNo: m.OrderNo,
          lessons,
          quiz,
          exams,
        }
      })
    } else {
      // 2) Fallback: build from Lessons[][] & Exams[][]
      const lessonGroups = Array.isArray(course.Lessons) ? course.Lessons : []
      const examGroups = Array.isArray(course.Exams) ? course.Exams : []
      const n = Math.max(lessonGroups.length, examGroups.length)

      modules = Array.from({ length: n }, (_, i) => {
        const rawLessons = Array.isArray(lessonGroups[i]) ? lessonGroups[i] : []
        const lessons: SimpleLesson[] = rawLessons.map((l, idx) => {
          const lessonObj: unknown = l
          const lessonId = pickId(lessonObj)
          return {
            id: lessonId ?? `m${i + 1}-l${idx + 1}`,
            title: pickTitle(lessonObj, `Lesson ${idx + 1}`),
            to: lessonId != null ? `/lesson/${lessonId}` : "#",
          }
        })

        const rawExams = Array.isArray(examGroups[i]) ? examGroups[i] : []
        const exams: SimpleExam[] = rawExams
          .map((e, idx) => {
            const examObj: unknown = e
            const rawId = pickId(examObj)
            const examId = toNumberId(rawId)
            if (examId == null) return null
            return {
              id: examId,
              title: pickTitle(examObj, `Exam ${idx + 1}`),
              to: `/course/${course.Id}/takingExam/${examId}`,
            }
          })
          .filter((x): x is SimpleExam => x !== null)

        const quiz = exams.length > 0 ? { ...exams[0], title: exams[0].title || "Module Quiz" } : null

        return {
          key: `module-fallback-${i + 1}`,
          orderNo: i + 1,
          lessons,
          quiz,
          exams,
        }
      })
    }

    // Final Exam = last exam in the whole timeline
    const allExams: { moduleOrder: number; idx: number; exam: SimpleExam }[] = []
    modules.forEach((m) => m.exams.forEach((e, idx) => allExams.push({ moduleOrder: m.orderNo, idx, exam: e })))
    allExams.sort((a, b) => (a.moduleOrder - b.moduleOrder) || (a.idx - b.idx))
    const finalExam = allExams.length ? allExams[allExams.length - 1].exam : null

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const totalQuizzes = modules.reduce((sum, m) => sum + (m.quiz ? 1 : 0), 0)

    return {
      modules,
      finalExam: finalExam ? { ...finalExam, title: finalExam.title || "Final Exam" } : null,
      totals: { lessons: totalLessons, quizzes: totalQuizzes, modules: modules.length },
    }
  }, [course])

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
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

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
                <h2 className="text-xl font-semibold">Review course timeline</h2>
                <div className="text-sm text-gray-500">
                  {derived.totals.modules} modules • {derived.totals.lessons} lessons • {derived.totals.quizzes} quizzes
                </div>
              </div>

              {derived.modules.length === 0 ? (
                <p className="text-gray-600">No timeline data available.</p>
              ) : (
                <div className="space-y-3">
                  {derived.modules.map((m, idx) => {
                    const finalId = derived.finalExam?.id
                    const quizIsFinal = m.quiz?.id != null && finalId != null && m.quiz.id === finalId

                    return (
                      <details key={m.key} className="border border-gray-200 rounded-lg p-4" open={idx === 0}>
                        <summary className="cursor-pointer select-none font-semibold">
                          Module {m.orderNo}
                          <span className="ml-2 text-sm text-gray-500">
                            ({m.lessons.length} lessons • {m.quiz ? 1 : 0} quiz)
                          </span>
                        </summary>

                        <div className="mt-3 text-sm text-gray-700 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">Lessons:</span>
                            <span>{m.lessons.length}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{quizIsFinal ? "Final Exam (Certificate):" : "Quiz:"}</span>
                            {m.quiz ? (
                              <Link to={m.quiz.to} className="text-blue-600 hover:underline">
                                {m.quiz.title || "Module Quiz"}
                              </Link>
                            ) : (
                              <span className="text-gray-500">No quiz available</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          {m.lessons.length > 0 ? (
                            <ul className="space-y-2">
                              {m.lessons.map((l, i) => (
                                <li key={String(l.id)} className="flex items-start gap-2">
                                  <span className="mt-0.5 text-gray-500">{i + 1}.</span>
                                  <Link to={l.to} className="text-gray-800 hover:underline">
                                    📹 {l.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600">No lessons in this module.</p>
                          )}
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
                    </Link>
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
