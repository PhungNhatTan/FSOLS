import prisma from "../../prismaClient.js";

/* ============================================================================
* Utilities
* ========================================================================== */

const isTempId = (id) =>
  id == null ||
  (typeof id === "number" && id < 0) ||
  (typeof id === "string" && id.startsWith("temp_"));

const softDelete = (tx, model, where) =>
  tx[model].updateMany({
    where,
    data: { DeletedAt: new Date() },
  });

const getTxOptions = () => {
  const maxWaitRaw = Number(process.env.PRISMA_TX_MAXWAIT_MS ?? 20000);
  const timeoutRaw = Number(process.env.PRISMA_TX_TIMEOUT_MS ?? 180000);

  const maxWait = Number.isFinite(maxWaitRaw) && maxWaitRaw > 0 ? maxWaitRaw : 20000;
  const timeout = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 180000;

  return { maxWait, timeout };
};

const isValidDbId = (id, expectedType) => {
  if (expectedType === "string") return typeof id === "string";
  if (expectedType === "number") return typeof id === "number";
  return false;
};

const safeUpsert = async (
  tx,
  model,
  where,
  createData,
  updateData,
  idType = "number"
) => {
  const id = where?.Id;

  if (!isValidDbId(id, idType)) {
    return tx[model].create({ data: createData });
  }

  const exists = await tx[model].findUnique({ where });
  if (!exists) {
    return tx[model].create({ data: createData });
  }

  return tx[model].update({
    where,
    data: updateData,
  });
};

const QUESTION_TYPE_MAP = {
  MCQ: "MCQ",
  MULTIPLE_CHOICE: "MCQ",

  FILL: "Fill",
  FILL_BLANK: "Fill",

  ESSAY: "Essay",
  TEXT: "Essay",

  TF: "TF",
  TRUE_FALSE: "TF",
};

function mapQuestionType(rawType) {
  if (!rawType) {
    throw new Error("Question type is missing in draft");
  }

  const normalized = String(rawType).toUpperCase();
  const mapped = QUESTION_TYPE_MAP[normalized];

  if (!mapped) {
    throw new Error(`Unsupported question type: ${rawType}`);
  }

  return mapped; // <-- STRING, matches Prisma enum
}


const DURATION_PRESET_MINUTES = {
  P_15: 15,
  P_30: 30,
  P_60: 60,
  P_90: 90,
  P_120: 120,
};

const normalizeMinutes = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
};

const inferResourceMinutes = (res) => {
  const name = String(res?.name ?? "");
  const url = String(res?.url ?? "");
  const clean = (url.split(/[?#]/)[0] || name).toLowerCase();
  const ext = (clean.split(".").pop() || "").toLowerCase();

  const sizeBytes = typeof res?.size === "number" && res.size > 0 ? res.size : null;

  const isVideo = ["mp4", "webm", "ogg", "ogv", "mov", "m4v", "avi", "mkv"].includes(ext);
  const isPdf = ext === "pdf";
  const isOffice = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);

  // Baselines + rough scaling by file size (when available)
  if (isVideo) {
    if (sizeBytes) {
      // Rough: ~25MB ~= 10 minutes
      const mins = Math.round((sizeBytes / (25 * 1024 * 1024)) * 10);
      return Math.min(Math.max(mins, 5), 180);
    }
    return 10;
  }

  if (isPdf || isOffice) {
    if (sizeBytes) {
      // Rough: ~2MB ~= 5 minutes
      const mins = Math.round((sizeBytes / (2 * 1024 * 1024)) * 5);
      return Math.min(Math.max(mins, 3), 120);
    }
    return 5;
  }

  if (isImage) return 1;

  return 5;
};

const computeLessonEstimatedMinutes = (lesson) => {
  const resources = Array.isArray(lesson?.resources) ? lesson.resources : [];
  const active = resources.filter((r) => r && !r.deleted);
  if (active.length === 0) return null;

  let sum = 0;
  for (const r of active) {
    const explicit = normalizeMinutes(r?.estimatedMinutes);
    const mins = explicit ?? inferResourceMinutes(r);
    if (mins != null) sum += mins;
  }

  return sum > 0 ? sum : null;
};

const resolveExamDurationMinutes = (exam) => {
  const preset = exam?.durationPreset;
  const custom = exam?.durationCustom;

  if (preset && Object.prototype.hasOwnProperty.call(DURATION_PRESET_MINUTES, preset)) {
    return DURATION_PRESET_MINUTES[preset];
  }

  return normalizeMinutes(custom);
};

const computeItemEstimatedMinutes = (item) => {
  if (!item || item.deleted) return null;
  if (item.type === "exam" && item.exam) return resolveExamDurationMinutes(item.exam);
  if (item.type === "lesson" && item.lesson) return computeLessonEstimatedMinutes(item.lesson);
  return null;
};

const syncExamAnswers = async (tx, questionId, answers = []) => {
  for (const answer of answers) {
    const answerId = answer?.id;
    if (answer?.deleted) {
      if (answerId && !isTempId(answerId)) {
        await softDelete(tx, "examAnswer", { Id: answerId });
      }
      continue;
    }

    const baseData = {
      AnswerText: answer?.answerText ?? "",
      IsCorrect: !!answer?.isCorrect,
    };

    if (!answerId || isTempId(answerId)) {
      await tx.examAnswer.create({
        data: {
          QuestionId: questionId,
          ...baseData,
        },
      });
    } else {
      await safeUpsert(
        tx,
        "examAnswer",
        { Id: answerId },
        {
          QuestionId: questionId,
          ...baseData,
        },
        {
          QuestionId: questionId,
          ...baseData,
          DeletedAt: null,
        },
        "string"
      );
    }
  }
};

/* ============================================================================
 * Main Commit Function
 * ========================================================================== */

const commitDraftToDatabase = async (courseId, draft) => {
  try {
    await prisma.$transaction(async (tx) => {
      /* ======================================================================
       * 1. Update course meta
       * ==================================================================== */

      await tx.course.update({
        where: { Id: courseId },
        data: {
          Name: draft.course.name,
          Description: draft.course.description,
          CategoryId: draft.course.categoryId,
          LastUpdated: new Date(),
        },
      });

      /* ======================================================================
       * 2. Course skills (soft delete + upsert)
       * ==================================================================== */

      const existingSkills = await tx.courseSkill.findMany({
        where: { CourseId: courseId, DeletedAt: null },
      });

      const keepSkillIds = new Set(
        draft.course.skills.filter(s => !isTempId(s.id)).map(s => s.id)
      );

      for (const skill of existingSkills) {
        if (!keepSkillIds.has(skill.Id)) {
          await softDelete(tx, "courseSkill", { Id: skill.Id });
        }
      }

      for (const skill of draft.course.skills.filter(s => !s.deleted)) {
        if (isTempId(skill.id)) {
          await tx.courseSkill.create({
            data: {
              CourseId: courseId,
              SkillName: skill.skillName,
            },
          });
        } else {
          await tx.courseSkill.update({
            where: { Id: skill.id },
            data: { SkillName: skill.skillName, DeletedAt: null },
          });
        }
      }

      /* ======================================================================
       * 3. Modules - ADD SOFT DELETE FOR REMOVED MODULES
       * ==================================================================== */

      // Get existing modules
      const existingModules = await tx.courseModule.findMany({
        where: { CourseId: courseId, DeletedAt: null },
      });

      // Build set of module IDs to keep
      const keepModuleIds = new Set(
        draft.modules
          .filter(m => !m.deleted && !isTempId(m.id))
          .map(m => m.id)
      );

      // Soft delete modules not in draft
      for (const existingModule of existingModules) {
        if (!keepModuleIds.has(existingModule.Id)) {
          await softDelete(tx, "courseModule", { Id: existingModule.Id });
        }
      }

      const moduleIdMap = new Map();

      for (const module of draft.modules) {
        if (module.deleted && !isTempId(module.id)) {
          await softDelete(tx, "courseModule", { Id: module.id });
          continue;
        }

        let moduleId;

        if (isTempId(module.id)) {
          const created = await tx.courseModule.create({
            data: {
              CourseId: courseId,
              Title: module.title,
              OrderNo: module.orderNo,
            },
          });
          moduleId = created.Id;
        } else {
          const result = await safeUpsert(
            tx,
            "courseModule",
            { Id: module.id },
            {
              CourseId: courseId,
              Title: module.title,
              OrderNo: module.orderNo,
            },
            {
              Title: module.title,
              OrderNo: module.orderNo,
              DeletedAt: null,
            }
          );
          moduleId = result.Id;
        }

        moduleIdMap.set(module.id, moduleId);

        /* ====================================================================
         * 4. Module items - ADD SOFT DELETE FOR REMOVED ITEMS
         * ================================================================== */

        // Get existing items for this module
        const existingItems = await tx.moduleItem.findMany({
          where: { CourseModuleId: moduleId, DeletedAt: null },
        });

        // Build set of item IDs to keep
        const keepItemIds = new Set(
          module.items
            .filter(i => !i.deleted && !isTempId(i.id))
            .map(i => i.id)
        );

        // Soft delete items not in draft
        for (const existingItem of existingItems) {
          if (!keepItemIds.has(existingItem.Id)) {
            await softDelete(tx, "moduleItem", { Id: existingItem.Id });
          }
        }

        for (const item of module.items) {
          if (item.deleted && !isTempId(item.id)) {
            await softDelete(tx, "moduleItem", { Id: item.id });
            continue;
          }

          let itemId;

          if (isTempId(item.id)) {
            const created = await tx.moduleItem.create({
              data: {
                CourseModuleId: moduleId,
                OrderNo: item.orderNo,
                EstimatedDuration: computeItemEstimatedMinutes(item),
              },
            });
            itemId = created.Id;
          } else {
            const result = await safeUpsert(
              tx,
              "moduleItem",
              { Id: item.id },
              {
                CourseModuleId: moduleId,
                OrderNo: item.orderNo,
                EstimatedDuration: computeItemEstimatedMinutes(item),
              },
              {
                CourseModuleId: moduleId,
                OrderNo: item.orderNo,
                EstimatedDuration: computeItemEstimatedMinutes(item),
                DeletedAt: null,
              },
              "string"
            );
            itemId = result.Id;
          }

          /* ================================================================
           * 5. Lessons - ADD SOFT DELETE FOR RESOURCES
           * ============================================================== */

          if (item.type === "lesson" && item.lesson) {
            const lesson = item.lesson;

            if (lesson.deleted && !isTempId(lesson.id)) {
              await softDelete(tx, "courseLesson", { Id: lesson.id });
              continue;
            }

            let lessonId;

            if (isTempId(lesson.id)) {
              const created = await tx.courseLesson.create({
                data: {
                  ModuleItemId: itemId,
                  Title: lesson.title,
                  LessonType: lesson.lessonType,
                  VideoUrl: lesson.videoUrl,
                  DocUrl: lesson.docUrl,
                  CreatedById: lesson.createdById,
                },
              });
              lessonId = created.Id;
            } else {
              const result = await safeUpsert(
                tx,
                "courseLesson",
                { Id: lesson.id },
                {
                  ModuleItemId: itemId,
                  Title: lesson.title,
                  LessonType: lesson.lessonType,
                  VideoUrl: lesson.videoUrl,
                  DocUrl: lesson.docUrl,
                  CreatedById: lesson.createdById,
                },
                {
                  ModuleItemId: itemId,
                  Title: lesson.title,
                  LessonType: lesson.lessonType,
                  VideoUrl: lesson.videoUrl,
                  DocUrl: lesson.docUrl,
                  DeletedAt: null,
                },
                "string"
              );
              lessonId = result.Id;
            }

            // ADD: Soft delete resources not in draft
            const existingResources = await tx.lessonResource.findMany({
              where: { LessonId: lessonId, DeletedAt: null },
            });

            const keepResourceIds = new Set(
              lesson.resources
                .filter(r => !r.deleted && !isTempId(r.id))
                .map(r => r.id)
            );

            for (const existingResource of existingResources) {
              if (!keepResourceIds.has(existingResource.Id)) {
                await softDelete(tx, "lessonResource", { Id: existingResource.Id });
              }
            }

            for (const res of lesson.resources) {
              if (res.deleted && !isTempId(res.id)) {
                await softDelete(tx, "lessonResource", { Id: res.id });
              } else if (isTempId(res.id)) {
                await tx.lessonResource.create({
                  data: {
                    LessonId: lessonId,
                    Name: res.name,
                    Url: res.url,
                  },
                });
              } else {
                await safeUpsert(
                  tx,
                  "lessonResource",
                  { Id: res.id },
                  {
                    LessonId: lessonId,
                    Name: res.name,
                    Url: res.url,
                  },
                  {
                    Name: res.name,
                    Url: res.url,
                    DeletedAt: null,
                  }
                );
              }
            }
          }

          /* ================================================================
           * 6. Exams - ADD SOFT DELETE FOR QUESTIONS
           * ============================================================== */

          if (item.type === "exam" && item.exam) {
            const exam = item.exam;

            if (exam.deleted && !isTempId(exam.id)) {
              await softDelete(tx, "exam", { Id: exam.id });
              continue;
            }

            let examId;

            if (isTempId(exam.id)) {
              const created = await tx.exam.create({
                data: {
                  ModuleItemId: itemId,
                  Title: exam.title,
                  Description: exam.description,
                  DurationPreset: exam.durationPreset,
                  DurationCustom: exam.durationCustom,
                  CreatedById: exam.createdById,
                },
              });
              examId = created.Id;
            } else {
              const result = await safeUpsert(
                tx,
                "exam",
                { Id: exam.id },
                {
                  ModuleItemId: itemId,
                  Title: exam.title,
                  Description: exam.description,
                  DurationPreset: exam.durationPreset,
                  DurationCustom: exam.durationCustom,
                },
                {
                  Title: exam.title,
                  Description: exam.description,
                  DurationPreset: exam.durationPreset,
                  DurationCustom: exam.durationCustom,
                  DeletedAt: null,
                }
              );
              examId = result.Id;
            }

            /* ==============================================================
             * 7. Questions - ADD SOFT DELETE FOR REMOVED QUESTIONS
             * ============================================================ */

            // Get existing questions for this exam
            const existingQuestions = await tx.examQuestion.findMany({
              where: { ExamId: examId, DeletedAt: null },
            });

            // Build set of question IDs to keep
            const keepQuestionIds = new Set(
              exam.questions
                .filter(q => !q.deleted && !isTempId(q.id))
                .map(q => q.id)
            );

            // Soft delete questions not in draft
            for (const existingQ of existingQuestions) {
              if (!keepQuestionIds.has(existingQ.Id)) {
                await softDelete(tx, "examQuestion", { Id: existingQ.Id });
              }
            }

            for (const q of exam.questions) {
              if (q.deleted) {
                if (!isTempId(q.id)) {
                  await softDelete(tx, "examQuestion", { Id: q.id });
                }
                continue;
              }

              const qbPayload = q.questionBank;
              if (!qbPayload) {
                throw new Error("Draft exam question missing question bank data");
              }

              const rawQbId = qbPayload.id ?? q.questionBankId;
              let qbId;
              const questionType = mapQuestionType(qbPayload.type);

              // --------------------------------------------------
              // Auto-create QuestionBank if missing ID
              // --------------------------------------------------
              if (rawQbId == null) {
                if (!qbPayload.questionText || !qbPayload.type) {
                  throw new Error("Draft exam question missing question bank identifier");
                }

                const qb = await tx.questionBank.create({
                  data: {
                    QuestionText: qbPayload.questionText,
                    Type: mapQuestionType(qbPayload.type),
                    Answer: qbPayload.answer ?? null,
                    courseId,
                    LessonId: qbPayload.lessonId ?? null,
                  },
                });

                qbId = qb.Id;
              } else {
                const qbIdIsTemp = isTempId(rawQbId);
                const qbIdentifier = qbIdIsTemp ? rawQbId : String(rawQbId);

                if (qbPayload.deleted) {
                  if (!qbIdIsTemp) {
                    await softDelete(tx, "questionBank", { Id: qbIdentifier });
                  }
                  if (!isTempId(q.id)) {
                    await softDelete(tx, "examQuestion", { Id: q.id });
                  }
                  continue;
                }

                const qbBaseData = {
                  QuestionText: qbPayload.questionText,
                  Type: questionType,
                  Answer: qbPayload.answer ?? null,
                  courseId,
                  LessonId: qbPayload.lessonId ?? null,
                };

                if (qbIdIsTemp) {
                  const qb = await tx.questionBank.create({
                    data: qbBaseData,
                  });
                  qbId = qb.Id;
                } else {
                  const qb = await safeUpsert(
                    tx,
                    "questionBank",
                    { Id: qbIdentifier },
                    qbBaseData,
                    { ...qbBaseData, DeletedAt: null },
                    "string"
                  );
                  qbId = qb.Id;
                }

                if (questionType !== "Essay") {
                  await syncExamAnswers(tx, qbId, qbPayload.answers ?? []);
                } else if (qbPayload.answers?.length) {
                  for (const answer of qbPayload.answers) {
                    if (answer?.id && !isTempId(answer.id)) {
                      await softDelete(tx, "examAnswer", { Id: answer.id });
                    }
                  }
                }
              }

              // --------------------------------------------------
              // Link question to exam
              // --------------------------------------------------
              if (isTempId(q.id)) {
                await tx.examQuestion.create({
                  data: {
                    ExamId: examId,
                    QuestionId: qbId,
                    OrderNo: q.orderNo,
                  },
                });
              } else {
                await safeUpsert(
                  tx,
                  "examQuestion",
                  { Id: q.id },
                  {
                    ExamId: examId,
                    QuestionId: qbId,
                    OrderNo: q.orderNo,
                  },
                  {
                    ExamId: examId,
                    QuestionId: qbId,
                    OrderNo: q.orderNo,
                    DeletedAt: null,
                  },
                  "string"
                );
              }
            }
          }
        }
      }

      /* ======================================================================
       * 8. Publish course
       * ==================================================================== */

      await tx.course.update({
        where: { Id: courseId },
        data: {
          PublishedAt: new Date(),
          LastUpdated: new Date(),
        },
      });

      await tx.certificate.upsert({
        where: { CourseId: courseId },
        update: { DeletedAt: null },
        create: {
          CertificateType: "Course",
          Course: { connect: { Id: courseId } },
        },
      });
    }, getTxOptions());

    return { success: true, courseId };
  } catch (error) {
    console.error("Commit draft failed:", error);
    return { success: false, errors: [error.message], courseId };
  }
};

export default commitDraftToDatabase;
