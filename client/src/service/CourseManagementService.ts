import type {
    UiLessonLocal,
    UiModuleLocal,
    ExamLocal,
    Resource,
    ExamQuestionLocal,
    CourseStructureRaw,
    ManageModule,
    ManageLesson,
} from "../types/manage";
import type { LessonSummary } from "../types/lesson";
import type { Exam, ExamQuestion, ExamData, QuestionType } from "../types/exam";
import type { UiModuleLocal as Module, UiLessonLocal as Lesson } from "../types/manage";
import type { Course, DraftJson, DraftModule, DraftModuleItem, } from "../types/course";

function mapLessonToDraft(lesson: Lesson) {
    return {
        id: String(lesson.id),
        title: lesson.title,
        description: lesson.description || "",
        lessonType: "Video" as const, // or determine from lesson data
        videoUrl: null,
        docUrl: null,
        createdById: null,
        deleted: false,
        resources: (lesson.resources || []).map(r => ({
            id: r.id,
            name: r.name,
            url: r.url || "",
            size: r.size,
            type: undefined, // mime type if available
            deleted: false,
        })),
    };
}

function mapDraftLessonToLocal(
    draftLesson: DraftJson["modules"][0]["items"][0]["lesson"]
): Lesson {
    if (!draftLesson) {
        throw new Error("Draft lesson is undefined");
    }

    const id = Number(draftLesson.id);

    if (!Number.isFinite(id)) {
        throw new Error(`Invalid draft lesson id: ${draftLesson.id}`);
    }

    return {
        id,
        title: draftLesson.title,
        description: draftLesson.description,
        order: 0, // set by parent
        resources: draftLesson.resources
            .filter(r => !r.deleted)
            .map(r => ({
                id: r.id,
                name: r.name,
                url: r.url,
                size: r.size,
            })),
    };
}


export function mapLocalToDraft(
    course: Course,
    modules: Module[],
    skills: { id: number; skillName: string }[],
    createdById: string | null
): DraftJson {
    return {
        version: "1.0",
        lastModified: new Date().toISOString(),
        course: {
            id: course.Id,
            name: course.Name,
            description: course.Description,
            categoryId: null,
            createdById,
            publishedAt: null,
            skills: skills.map(s => ({
                id: s.id,
                skillName: s.skillName,
                deleted: false,
            })),
        },
        modules: modules.map((module) => ({
            id: module.id,
            title: module.title,
            orderNo: module.order,
            deleted: false,
            items: [
                ...module.lessons.map((lesson, lessonIndex) => ({
                    id: `item-lesson-${module.id}-${lesson.id}`,
                    orderNo: lessonIndex * 10,
                    deleted: false,
                    type: "lesson" as const,
                    lesson: mapLessonToDraft(lesson),
                })),
                ...(module.exams || []).map((exam, examIndex) => ({
                    id: `item-exam-${module.id}-${exam.id}`,
                    orderNo: (module.lessons.length + examIndex) * 10,
                    deleted: false,
                    type: "exam" as const,
                    exam: {
                        id: exam.id,
                        title: exam.title,
                        description: "",
                        durationPreset: (exam.durationPreset as "P_15" | "P_30" | "P_60" | "P_90" | "P_120" | null) || null,
                        durationCustom: exam.durationCustom || null,
                        createdById: null,
                        deleted: false,
                        questions: (exam.questions || []).map(q => ({
                            id: q.examQuestionId,
                            questionBankId: q.questionId,
                            deleted: false,
                            questionBank: {
                                id: q.questionId,
                                questionText: q.question?.text || "",
                                type: (q.question?.type?.toUpperCase() || "MCQ") as "MCQ" | "Fill" | "Essay" | "TF",
                                answer: null,
                                lessonId: null,
                                courseId: null,
                                deleted: false,
                                answers: (q.question?.options || []).map((opt, idx) => ({
                                    id: `answer-${q.questionId}-${idx}`,
                                    answerText: opt,
                                    isCorrect: idx === q.question?.correctIndex,
                                    deleted: false,
                                })),
                            },
                        })),
                    },
                })),
            ],
        })),
    };
}

export function mapDraftToLocal(draft: DraftJson): {
    modules: Module[];
    skills: { id: number; skillName: string }[];
} {
    const modules: Module[] = draft.modules
        .filter(m => !m.deleted)
        .map(draftModule => {
            const lessons: Lesson[] = [];
            const exams: ExamLocal[] = [];

            for (const item of draftModule.items) {
                if (item.deleted) continue;

                if (item.type === "lesson" && item.lesson) {
                    const lesson = mapDraftLessonToLocal(item.lesson);
                    lesson.order = item.orderNo;
                    lessons.push(lesson);
                } else if (item.type === "exam" && item.exam) {
                    exams.push({
                        id: item.exam.id,
                        title: item.exam.title,
                        order: item.orderNo,
                        durationPreset: item.exam.durationPreset ?? undefined,
                        durationCustom: item.exam.durationCustom ?? undefined,
                        questions: item.exam.questions
                            .filter(q => !q.deleted)
                            .map(q => ({
                                examQuestionId: q.id,
                                questionId: q.questionBankId,
                                points: 1,
                                question: {
                                    id: q.questionBank.id,
                                    type: q.questionBank.type.toLowerCase() as "mcq" | "text",
                                    text: q.questionBank.questionText,
                                    options: q.questionBank.answers.map(a => a.answerText),
                                    correctIndex: q.questionBank.answers.findIndex(a => a.isCorrect),
                                },
                            })),
                    });
                }
            }

            return {
                id: draftModule.id,
                title: draftModule.title,
                order: draftModule.orderNo,
                lessons,
                exams,
            };
        });

    const skills = draft.course.skills
        .filter(s => !s.deleted)
        .map(s => ({
            id: s.id,
            skillName: s.skillName,
        }));

    return { modules, skills };
}

export function validateDraft(draft: DraftJson): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Course validation
    if (!draft.course.name?.trim()) {
        errors.push("Course name is required");
    }
    if (!draft.course.description?.trim()) {
        warnings.push("Course description is empty");
    }

    // Module validation
    const activeModules = draft.modules.filter(m => !m.deleted);
    if (activeModules.length === 0) {
        errors.push("Course must have at least one module");
    }

    activeModules.forEach((module, idx) => {
        if (!module.title?.trim()) {
            errors.push(`Module ${idx + 1} has no title`);
        }

        const activeItems = module.items.filter(i => !i.deleted);
        if (activeItems.length === 0) {
            warnings.push(`Module "${module.title}" has no lessons or exams`);
        }

        // Validate lessons and their resources
        activeItems.forEach((item, itemIdx) => {
            if (item.type === "lesson" && item.lesson) {
                if (!item.lesson.title?.trim()) {
                    errors.push(`Lesson ${itemIdx + 1} in module "${module.title}" has no title`);
                }

                const activeResources = item.lesson.resources.filter(r => !r.deleted);
                if (activeResources.length === 0) {
                    warnings.push(`Lesson "${item.lesson.title}" has no resources`);
                }

                // Check for draft URLs that need to be migrated
                activeResources.forEach(resource => {
                    if (resource.url?.includes('/draft/')) {
                        // This is expected - resources will be moved on approval
                    }
                });
            } else if (item.type === "exam" && item.exam) {
                if (!item.exam.title?.trim()) {
                    errors.push(`Exam ${itemIdx + 1} in module "${module.title}" has no title`);
                }

                const activeQuestions = item.exam.questions.filter(q => !q.deleted);
                if (activeQuestions.length === 0) {
                    warnings.push(`Exam "${item.exam.title}" has no questions`);
                }
            }
        });
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

export function getDraftStats(draft: DraftJson) {
    let totalModules = 0;
    let totalLessons = 0;
    let totalExams = 0;
    let totalQuestions = 0;
    let totalResources = 0;

    draft.modules.forEach(module => {
        if (module.deleted) return;
        totalModules++;

        module.items.forEach(item => {
            if (item.deleted) return;

            if (item.type === "lesson" && item.lesson) {
                totalLessons++;
                const activeResources = item.lesson.resources.filter(r => !r.deleted);
                totalResources += activeResources.length;
            } else if (item.type === "exam" && item.exam) {
                totalExams++;
                const activeQuestions = item.exam.questions.filter(q => !q.deleted);
                totalQuestions += activeQuestions.length;
            }
        });
    });

    return {
        totalModules,
        totalLessons,
        totalExams,
        totalQuestions,
        totalResources,
    };
}

let tempIdCounter = 1;

export const generateTempId = (prefix: string = "temp"): string => {
    return `${prefix}_${Date.now()}_${tempIdCounter++}`;
};

let nextTempId = -1;

export function generateNegativeId() {
    return nextTempId--;
}

export const isTempId = (id: string | number): boolean => {
    if (typeof id === "string") {
        return id.startsWith("temp_");
    }
    return id < 0;
};

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

const ALLOWED_PRESETS = [
    "P_15",
    "P_30",
    "P_60",
    "P_90",
    "P_120",
] as const;

type DurationPreset = typeof ALLOWED_PRESETS[number];

function toDurationPreset(
    value: string | null | undefined
): DurationPreset | null {
    if (!value) return null;
    return ALLOWED_PRESETS.includes(value as DurationPreset)
        ? (value as DurationPreset)
        : null;
}

export function mapStructureToDraft(
    structure: CourseStructureRaw
): DraftJson {

    const modules: DraftModule[] = structure.modules.map(
        (m): DraftModule => {

            // 👇 STEP 1: lesson items (EXPLICITLY TYPED)
            const lessonItems: DraftModuleItem[] = m.Lessons.map(
                (lesson, idx): DraftModuleItem => ({
                    id: `lesson-${m.Id}-${lesson.Id}`,
                    orderNo: idx * 10,
                    deleted: false,
                    type: "lesson",
                    lesson: {
                        id: String(lesson.Id),
                        title: lesson.Title,
                        description: lesson.Description,
                        lessonType: "Video", // ✅ no cast needed
                        videoUrl: null,
                        docUrl: null,
                        createdById: null,
                        deleted: false,
                        resources: lesson.Resources.map(r => ({
                            id: r.Id,
                            name: r.Name,
                            url: r.Url,
                            deleted: false,
                        })),
                    },
                })
            );

            // 👇 STEP 2: exam items (EXPLICITLY TYPED)
            const examItems: DraftModuleItem[] = m.Exam
                ? [
                    {
                        id: `exam-${m.Id}-${m.Exam.Id}`,
                        orderNo: lessonItems.length * 10,
                        deleted: false,
                        type: "exam",
                        exam: {
                            id: m.Exam.Id,
                            title: m.Exam.Title,
                            description: "",
                            durationPreset: toDurationPreset(m.Exam.DurationPreset),
                            durationCustom: m.Exam.DurationCustom ?? null,
                            createdById: null,
                            deleted: false,
                            questions: [],
                        },
                    },
                ]
                : [];

            // 👇 STEP 3: module itself (EXPLICITLY TYPED)
            return {
                id: m.Id,
                title: m.Title,
                orderNo: m.OrderNo,
                deleted: false,
                items: [...lessonItems, ...examItems],
            };
        }
    );

    // 👇 STEP 4: final DraftJson (typed at function boundary)
    return {
        version: "1.0",
        lastModified: new Date().toISOString(),
        course: {
            id: structure.course.Id,
            name: structure.course.Name,
            description: structure.course.Description,
            categoryId: null,
            createdById: null,
            publishedAt: null,
            skills: [],
        },
        modules,
    };
}

export function mapStructureToManage(rawModules: Module[]): ManageModule[] {
    return rawModules.map(m => {
        const lessons: ManageLesson[] = [];
        let exam: ExamData | undefined;

        for (const l of m.lessons) {
            lessons.push({
                Id: Number(l.id),
                Title: l.title,
                Description: l.description || "",
                Resources: (l.resources || []).map(r => ({
                    Id: r.id,
                    Name: r.name,
                    Url: r.url || "",
                    Size: r.size ?? 0,
                })),
            });
        }

        if (m.exams && m.exams.length > 0) {
            const firstExam = m.exams[0];
            exam = {
                Id: firstExam.id,
                Title: firstExam.title,
                Duration: firstExam.durationCustom ?? 0,
                Questions: (firstExam.questions || []).map(q => ({
                    ExamQuestionId: q.examQuestionId,
                    QuestionBankId: String(q.questionId),
                    QuestionText: q.question?.text || "",
                    Type: (() => {
                        const t = (q.question?.type || "MCQ").toUpperCase();
                        return ["MCQ", "FILL", "ESSAY", "TF"].includes(t) ? (t as QuestionType) : "MCQ";
                    })(),

                    Answers: (q.question?.options || []).map((opt, idx) => ({
                        Id: String(idx + 1), // ✅ string
                        AnswerText: opt,
                        IsCorrect: idx === (q.question?.correctIndex ?? -1),
                    })),
                })),
            };
        }

        return {
            Id: m.id,
            Title: `Module ${m.order}`,
            OrderNo: m.order,
            Lessons: lessons,
            Exam: exam,
        };
    });
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface DraftStats {
    totalModules: number;
    totalLessons: number;
    totalExams: number;
    totalQuestions: number;
    totalResources: number;
    completionPercentage: number;
}

