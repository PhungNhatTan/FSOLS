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
       * 3. Modules
       * ==================================================================== */

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
         * 4. Module items
         * ================================================================== */

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
              },
              {
                CourseModuleId: moduleId,
                OrderNo: item.orderNo,
                DeletedAt: null,
              }
            );
            itemId = result.Id;
          }

          /* ================================================================
           * 5. Lessons
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
                }
              );
              lessonId = result.Id;
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
           * 6. Exams
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
             * 7. Questions (safe for submissions)
             * ============================================================ */

            for (const q of exam.questions) {
              if (q.deleted && !isTempId(q.id)) {
                await softDelete(tx, "examQuestion", { Id: q.id });
                continue;
              }

              let qbId;

              if (isTempId(q.questionBank.id)) {
                const qb = await tx.questionBank.create({
                  data: {
                    QuestionText: q.questionBank.questionText,
                    Type: mapQuestionType(q.questionBank.type),
                    Answer: q.questionBank.answer,
                    courseId,
                  },
                });
                qbId = qb.Id;
              } else {
                const qb = await safeUpsert(
                  tx,
                  "questionBank",
                  { Id: q.questionBank.id },
                  {
                    QuestionText: q.questionBank.questionText,
                    Type: mapQuestionType(q.questionBank.type),
                    Answer: q.questionBank.answer,
                    courseId,
                  },
                  {
                    QuestionText: q.questionBank.questionText,
                    Type: mapQuestionType(q.questionBank.type),
                    Answer: q.questionBank.answer,
                    DeletedAt: null,
                  },
                  "string"
                );

                qbId = qb.Id;
              }

              if (q.deleted && !isTempId(q.id)) {
                await softDelete(tx, "examQuestion", { Id: q.id });
                continue;
              }

              if (isTempId(q.id)) {
                await tx.examQuestion.create({
                  data: {
                    ExamId: examId,
                    QuestionId: qbId,
                    OrderNo: q.orderNo,
                  },
                });
              } else {
                await tx.examQuestion.update({
                  where: { Id: q.id },
                  data: {
                    ExamId: examId,
                    QuestionId: qbId,
                    OrderNo: q.orderNo,
                    DeletedAt: null,
                  },
                });
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
          Draft: null,
          PublishedAt: new Date(),
          LastUpdated: new Date(),
        },
      });
    });

    return { success: true, courseId };
  } catch (error) {
    console.error("Commit draft failed:", error);
    return { success: false, errors: [error.message], courseId };
  }
};

export default commitDraftToDatabase;
