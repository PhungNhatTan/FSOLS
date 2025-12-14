// ============================================================================
// Course Management Service Layer
// Handles business logic, data transformations, and validation
// Place this in: src/services/courseManagementService.ts
// ============================================================================

import type {
    UiLessonLocal,
    UiModuleLocal,
    ExamLocal,
    Resource,
    ExamQuestionLocal,
} from "../types/manage";

import type { Course, DraftJson } from "../types/course";
import type { LessonSummary } from "../types/lesson";
import type { Exam, ExamQuestion, ExamData } from "../types/exam";

// ============================================================================
// ID Generation Helpers
// ============================================================================

let tempIdCounter = 1;

export const generateTempId = (prefix: string = "temp"): string => {
    return `${prefix}_${Date.now()}_${tempIdCounter++}`;
};

export const generateNegativeId = (): number => {
    return -Date.now() - tempIdCounter++;
};

export const isTempId = (id: string | number): boolean => {
    if (typeof id === "string") {
        return id.startsWith("temp_");
    }
    return id < 0;
};

// ============================================================================
// DTO to UI Local Mappings
// Transform API responses into UI-friendly format
// ============================================================================

export const mapResourceDtoToLocal = (resource: { Id?: number; id?: number; Name?: string; name?: string; Url?: string; url?: string; Size?: number; size?: number }): Resource => ({
    id: resource.Id || resource.id || 0,
    name: resource.Name || resource.name || "",
    url: resource.Url || resource.url,
    size: resource.Size || resource.size,
});

export const mapLessonDtoToLocal = (lesson: LessonSummary | { Id?: string | number; id?: string | number; Title?: string; title?: string; Description?: string; description?: string; OrderNo?: number; order?: number; Resources?: unknown[]; resources?: unknown[] }): UiLessonLocal => {
    const extendedLesson = lesson as { Id?: string | number; Title?: string; Description?: string; OrderNo?: number; Resources?: unknown[] };
    return {
        id: typeof extendedLesson.Id === 'string' ? parseInt(extendedLesson.Id, 10) : (extendedLesson.Id as number || 0),
        title: extendedLesson.Title || "",
        description: extendedLesson.Description,
        order: extendedLesson.OrderNo ?? 0,
        resources: (extendedLesson.Resources || []).map((r: unknown) => mapResourceDtoToLocal(r as { Id?: number; Name?: string; Url?: string })),
    };
};

export const mapExamQuestionDtoToLocal = (question: ExamQuestion | { QuestionBankId?: string | number; questionBankId?: string | number; ExamQuestionId?: string; examQuestionId?: string; Type?: string; type?: string; QuestionText?: string; questionText?: string; Answers?: { AnswerText: string }[]; answers?: { answerText: string }[] }): ExamQuestionLocal => {
    const qbId = Number((question as ExamQuestion).QuestionBankId || (question as { questionBankId?: string | number }).questionBankId);
    const mappedId = Number.isNaN(qbId) ? generateNegativeId() : qbId;

    return {
        examQuestionId: (question as ExamQuestion).ExamQuestionId || (question as { examQuestionId?: string }).examQuestionId || generateTempId("examQ"),
        questionId: mappedId,
        points: 1,
        question: {
            id: mappedId,
            type: ((question as ExamQuestion).Type?.toLowerCase() === "mcq" || (question as { type?: string }).type?.toLowerCase() === "mcq") ? "mcq" : "text",
            text: (question as ExamQuestion).QuestionText || (question as { questionText?: string }).questionText || "",
            options: (question as ExamQuestion).Answers?.map((a) => a.AnswerText) || (question as { answers?: { answerText: string }[] }).answers?.map((a) => a.answerText),
            correctIndex: null,
        },
    };
};

export const mapExamDtoToLocal = (exam: Exam | ExamData | (Exam & Partial<ExamData>)): ExamLocal => {
    const extendedExam = exam as Partial<ExamData> & Exam;
    return {
        id: exam.Id,
        title: exam.Title,
        order: extendedExam.OrderNo ?? 0,
        durationPreset: extendedExam.DurationPreset,
        durationCustom: extendedExam.DurationCustom,
        questions: (extendedExam.Questions || []).map((q: ExamQuestion) => mapExamQuestionDtoToLocal(q)),
    };
};

export const mapModuleDtoToLocal = (module: { Id?: number; id?: number; Title?: string; title?: string; OrderNo?: number; order?: number; ModuleItems?: { OrderNo: number; CourseLesson?: LessonSummary | LessonSummary[]; Exam?: (Exam | ExamData) | (Exam | ExamData)[] }[]; Lessons?: (LessonSummary | { OrderNo?: number; Resources?: unknown[] })[]; Exams?: (Exam | ExamData | (Exam & Partial<ExamData>))[] }): UiModuleLocal => {
    const lessons: UiLessonLocal[] = [];
    const exams: ExamLocal[] = [];

    // Handle both nested ModuleItems structure and flat structure
    if (module.ModuleItems) {
        module.ModuleItems.forEach((item) => {
            if (item.CourseLesson) {
                const lessonArray = Array.isArray(item.CourseLesson) ? item.CourseLesson : [item.CourseLesson];
                lessonArray.forEach((lesson) => {
                    lessons.push({
                        ...mapLessonDtoToLocal(lesson as LessonSummary & { OrderNo?: number; Resources?: unknown[] }),
                        order: item.OrderNo,
                    });
                });
            }
            if (item.Exam) {
                const examArray = Array.isArray(item.Exam) ? item.Exam : [item.Exam];
                examArray.forEach((exam) => {
                    exams.push({
                        ...mapExamDtoToLocal(exam as Exam & Partial<ExamData>),
                        order: item.OrderNo,
                    });
                });
            }
        });
    } else {
        // Flat structure
        if (module.Lessons) {
            lessons.push(...(module.Lessons as (LessonSummary & { OrderNo?: number; Resources?: unknown[] })[]).map(mapLessonDtoToLocal));
        }
        if (module.Exams) {
            exams.push(...(module.Exams as (Exam & Partial<ExamData>)[]).map(mapExamDtoToLocal));
        }
    }

    return {
        id: module.Id || module.id || 0,
        title: module.Title || module.title || `Module ${module.OrderNo || module.order}`,
        order: module.OrderNo ?? module.order ?? 0,
        lessons,
        exams,
    };
};

// ============================================================================
// UI Local to Draft JSON Mappings
// Transform UI state into draft format for persistence
// ============================================================================

export const mapLocalToDraft = (
    course: Course,
    modules: UiModuleLocal[],
    skills: { id: number; skillName: string }[] = [],
    createdById: string | null = null
): DraftJson => {
    return {
        version: "1.0",
        lastModified: new Date().toISOString(),
        course: {
            id: course.Id,
            name: course.Name,
            description: course.Description,
            categoryId: null, // Add if you have category in Course type
            createdById: createdById,
            publishedAt: null, // Add if you track this
            skills: skills.map((s) => ({
                id: s.id,
                skillName: s.skillName,
                deleted: false,
            })),
        },
        modules: modules.map((module) => {
            const items: DraftJson["modules"][number]["items"] = [];
            let orderCounter = 10;

            // Convert lessons to items
            module.lessons.forEach((lesson) => {
                items.push({
                    id: isTempId(lesson.id) ? `temp_lesson_${lesson.id}` : `lesson_${lesson.id}`,
                    orderNo: lesson.order || orderCounter,
                    deleted: false,
                    type: "lesson",
                    lesson: {
                        id: lesson.id.toString(),
                        title: lesson.title,
                        lessonType: "Video", // Default, update if you track this
                        videoUrl: null, // Add if you have this data
                        docUrl: null, // Add if you have this data
                        createdById: createdById,
                        deleted: false,
                        resources: lesson.resources.map((r) => ({
                            id: r.id,
                            name: r.name,
                            url: r.url || "",
                            deleted: false,
                        })),
                    },
                });
                orderCounter += 10;
            });

            // Convert exams to items
            module.exams.forEach((exam) => {
                items.push({
                    id: isTempId(exam.id) ? `temp_exam_${exam.id}` : `exam_${exam.id}`,
                    orderNo: exam.order || orderCounter,
                    deleted: false,
                    type: "exam",
                    exam: {
                        id: exam.id,
                        title: exam.title,
                        description: "", // Add if you have this
                        durationPreset: (exam.durationPreset as "P_15" | "P_30" | "P_60" | "P_90" | "P_120") || null,
                        durationCustom: exam.durationCustom || null,
                        createdById: createdById,
                        deleted: false,
                        questions: exam.questions.map((q) => {
                            const answers = (q.question?.options || []).map((opt, idx) => ({
                                id: `temp_ans_${q.questionId}_${idx}`,
                                answerText: opt,
                                isCorrect: idx === q.question?.correctIndex,
                                deleted: false,
                            }));

                            return {
                                id: q.examQuestionId,
                                questionBankId: q.questionId,
                                deleted: false,
                                questionBank: {
                                    id: q.questionId,
                                    questionText: q.question?.text || "",
                                    type: q.question?.type === "mcq" ? "MCQ" : "Fill",
                                    answer: null,
                                    lessonId: null,
                                    courseId: course.Id,
                                    deleted: false,
                                    answers: answers,
                                },
                            };
                        }),
                    },
                });
                orderCounter += 10;
            });

            return {
                id: module.id,
                title: module.title,
                orderNo: module.order,
                deleted: false,
                items: items,
            };
        }),
    };
};

// ============================================================================
// Draft JSON to UI Local Mappings
// Load draft back into UI state
// ============================================================================

export const mapDraftToLocal = (draft: DraftJson): {
    course: Course;
    modules: UiModuleLocal[];
    skills: { id: number; skillName: string }[];
} => {
    if (!draft.course) {
        return {
            course: {
                Id: 0,
                Name: "Untitled Course",
                Description: "",
                DeletedAt: null,
            },
            modules: [],
            skills: [],
        };
    }

    const course: Course = {
        Id: draft.course.id,
        Name: draft.course.name,
        Description: draft.course.description,
        DeletedAt: null,
    };

    const skills = draft.course.skills
        .filter((s) => !s.deleted)
        .map((s) => ({
            id: s.id,
            skillName: s.skillName,
        }));

    const modules: UiModuleLocal[] = draft.modules
        .filter((m) => !m.deleted)
        .map((module) => {
            const lessons: UiLessonLocal[] = [];
            const exams: ExamLocal[] = [];

            module.items
                .filter((item) => !item.deleted)
                .forEach((item) => {
                    if (item.type === "lesson" && item.lesson && !item.lesson.deleted) {
                        lessons.push({
                            id: item.lesson.id.startsWith("temp_")
                                ? generateNegativeId()
                                : Number(item.lesson.id.replace(/\D/g, "")),
                            title: item.lesson.title,
                            order: item.orderNo,
                            resources: item.lesson.resources
                                .filter((r) => !r.deleted)
                                .map((r) => ({
                                    id: r.id,
                                    name: r.name,
                                    url: r.url,
                                })),
                        });
                    } else if (item.type === "exam" && item.exam && !item.exam.deleted) {
                        exams.push({
                            id: item.exam.id,
                            title: item.exam.title,
                            order: item.orderNo,
                            durationPreset: item.exam.durationPreset || undefined,
                            durationCustom: item.exam.durationCustom || undefined,
                            questions: item.exam.questions
                                .filter((q) => !q.deleted)
                                .map((q) => ({
                                    examQuestionId: q.id,
                                    questionId: q.questionBankId,
                                    points: 1,
                                    question: {
                                        id: q.questionBankId,
                                        type: q.questionBank.type === "MCQ" ? "mcq" : "text",
                                        text: q.questionBank.questionText,
                                        options: q.questionBank.answers
                                            .filter((a) => !a.deleted)
                                            .map((a) => a.answerText),
                                        correctIndex: q.questionBank.answers.findIndex((a) => !a.deleted && a.isCorrect),
                                    },
                                })),
                        });
                    }
                });

            return {
                id: module.id,
                title: module.title,
                order: module.orderNo,
                lessons: lessons,
                exams: exams,
            };
        });

    return { course, modules, skills };
};

// ============================================================================
// Draft Mutation Helpers (Soft Deletes)
// Immutable operations that return new draft objects
// ============================================================================

export const markModuleDeleted = (draft: DraftJson, moduleId: number): DraftJson => {
    return {
        ...draft,
        lastModified: new Date().toISOString(),
        modules: draft.modules.map((m) =>
            m.id === moduleId ? { ...m, deleted: true } : m
        ),
    };
};

export const markLessonDeleted = (
    draft: DraftJson,
    moduleId: number,
    lessonId: string
): DraftJson => {
    return {
        ...draft,
        lastModified: new Date().toISOString(),
        modules: draft.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
                ...m,
                items: m.items.map((item) => {
                    if (item.type === "lesson" && item.lesson?.id === lessonId) {
                        return {
                            ...item,
                            deleted: true,
                            lesson: item.lesson ? { ...item.lesson, deleted: true } : undefined,
                        };
                    }
                    return item;
                }),
            };
        }),
    };
};

export const markExamDeleted = (
    draft: DraftJson,
    moduleId: number,
    examId: number
): DraftJson => {
    return {
        ...draft,
        lastModified: new Date().toISOString(),
        modules: draft.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
                ...m,
                items: m.items.map((item) => {
                    if (item.type === "exam" && item.exam?.id === examId) {
                        return {
                            ...item,
                            deleted: true,
                            exam: item.exam ? { ...item.exam, deleted: true } : undefined,
                        };
                    }
                    return item;
                }),
            };
        }),
    };
};

export const markQuestionDeleted = (
    draft: DraftJson,
    moduleId: number,
    examId: number,
    questionId: string
): DraftJson => {
    return {
        ...draft,
        lastModified: new Date().toISOString(),
        modules: draft.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
                ...m,
                items: m.items.map((item) => {
                    if (item.type === "exam" && item.exam?.id === examId) {
                        return {
                            ...item,
                            exam: item.exam ? {
                                ...item.exam,
                                questions: item.exam.questions.map((q) =>
                                    q.id === questionId ? { ...q, deleted: true } : q
                                ),
                            } : undefined,
                        };
                    }
                    return item;
                }),
            };
        }),
    };
};

export const markResourceDeleted = (
    draft: DraftJson,
    moduleId: number,
    lessonId: string,
    resourceId: number
): DraftJson => {
    return {
        ...draft,
        lastModified: new Date().toISOString(),
        modules: draft.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
                ...m,
                items: m.items.map((item) => {
                    if (item.type === "lesson" && item.lesson?.id === lessonId) {
                        return {
                            ...item,
                            lesson: item.lesson ? {
                                ...item.lesson,
                                resources: item.lesson.resources.map((r) =>
                                    r.id === resourceId ? { ...r, deleted: true } : r
                                ),
                            } : undefined,
                        };
                    }
                    return item;
                }),
            };
        }),
    };
};

// ============================================================================
// Validation
// Business rules for draft completeness
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export const validateDraft = (draft: DraftJson): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Course validation
    if (!draft.course.name.trim()) {
        errors.push("Course name is required");
    }

    if (!draft.course.description.trim()) {
        errors.push("Course description is required");
    }

    // Module validation
    const activeModules = draft.modules.filter((m) => !m.deleted);
    if (activeModules.length === 0) {
        errors.push("At least one module is required");
    }

    activeModules.forEach((module, idx) => {
        if (!module.title.trim()) {
            errors.push(`Module at position ${idx + 1} is missing a title`);
        }

        const activeItems = module.items.filter((i) => !i.deleted);
        if (activeItems.length === 0) {
            errors.push(`Module "${module.title}" (position ${idx + 1}) has no content`);
        }

        // Item validation
        activeItems.forEach((item) => {
            if (item.type === "lesson" && item.lesson && !item.lesson.deleted) {
                if (!item.lesson.title.trim()) {
                    errors.push(`Lesson in module "${module.title}" is missing a title`);
                }
                if (item.lesson.resources.filter((r) => !r.deleted).length === 0) {
                    warnings.push(`Lesson "${item.lesson.title}" has no resources`);
                }
            } else if (item.type === "exam" && item.exam && !item.exam.deleted) {
                if (!item.exam.title.trim()) {
                    errors.push(`Exam in module "${module.title}" is missing a title`);
                }
                const activeQuestions = item.exam.questions.filter((q) => !q.deleted);
                if (activeQuestions.length === 0) {
                    errors.push(`Exam "${item.exam.title}" has no questions`);
                }

                // Question validation
                activeQuestions.forEach((q, qIdx) => {
                    if (!q.questionBank.questionText.trim()) {
                        errors.push(`Question ${qIdx + 1} in exam "${item.exam!.title}" has no text`);
                    }
                    if (q.questionBank.type === "MCQ") {
                        const activeAnswers = q.questionBank.answers.filter((a) => !a.deleted);
                        if (activeAnswers.length < 2) {
                            errors.push(`Question ${qIdx + 1} in exam "${item.exam!.title}" needs at least 2 answer options`);
                        }
                        if (!activeAnswers.some((a) => a.isCorrect)) {
                            errors.push(`Question ${qIdx + 1} in exam "${item.exam!.title}" has no correct answer marked`);
                        }
                    }
                });
            }
        });
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

// ============================================================================
// Draft Statistics
// Useful for displaying course overview
// ============================================================================

export interface DraftStats {
    totalModules: number;
    totalLessons: number;
    totalExams: number;
    totalQuestions: number;
    totalResources: number;
    completionPercentage: number;
}

export const getDraftStats = (draft: DraftJson): DraftStats => {
    let totalLessons = 0;
    let totalExams = 0;
    let totalQuestions = 0;
    let totalResources = 0;

    const activeModules = draft.modules.filter((m) => !m.deleted);

    activeModules.forEach((module) => {
        module.items.filter((i) => !i.deleted).forEach((item) => {
            if (item.type === "lesson" && item.lesson && !item.lesson.deleted) {
                totalLessons++;
                totalResources += item.lesson.resources.filter((r) => !r.deleted).length;
            } else if (item.type === "exam" && item.exam && !item.exam.deleted) {
                totalExams++;
                totalQuestions += item.exam.questions.filter((q) => !q.deleted).length;
            }
        });
    });

    // Simple completion calculation: has name, description, at least 1 module with content
    const hasBasicInfo = draft.course.name.trim() && draft.course.description.trim();
    const hasContent = totalLessons > 0 || totalExams > 0;
    const completionPercentage = (hasBasicInfo ? 50 : 0) + (hasContent ? 50 : 0);

    return {
        totalModules: activeModules.length,
        totalLessons,
        totalExams,
        totalQuestions,
        totalResources,
        completionPercentage,
    };
};