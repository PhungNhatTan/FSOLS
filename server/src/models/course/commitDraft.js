import prisma from "../../prismaClient.js";

/**
 * Commits a draft JSON to the database, creating/updating all related records.
 * This is called when a course is approved for publication.
 * @param {number} courseId
 * @param {object} draft
 */
const commitDraftToDatabase = async (courseId, draft) => {
  try {
    await prisma.$transaction(async (tx) => {
      // ========================================================================
      // STEP 1: Update Course-level data
      // ========================================================================
      await tx.course.update({
        where: { Id: courseId },
        data: {
          Name: draft.course.name,
          Description: draft.course.description,
          CategoryId: draft.course.categoryId,
          LastUpdated: new Date(),
        },
      });

      // ========================================================================
      // STEP 2: Handle Skills (delete old, insert new)
      // ========================================================================
      
      // Get all existing skills for this course
      const existingSkills = await tx.courseSkill.findMany({
        where: { CourseId: courseId },
        select: { Id: true },
      });

      const existingSkillIds = existingSkills.map(s => s.Id);
      const skillIdsToKeep = draft.course.skills
        .filter((s) => !s.deleted && s.id > 0)
        .map((s) => s.id);
      
      // Delete removed skills
      const skillIdsToDelete = existingSkillIds.filter(id => !skillIdsToKeep.includes(id));
      if (skillIdsToDelete.length > 0) {
        await tx.courseSkill.deleteMany({
          where: {
            Id: { in: skillIdsToDelete },
          },
        });
      }

      // Insert new skills
      const newSkills = draft.course.skills.filter((s) => !s.deleted && s.id < 0);
      for (const skill of newSkills) {
        await tx.courseSkill.create({
          data: {
            CourseId: courseId,
            SkillName: skill.skillName,
          },
        });
      }

      // Update existing skills
      const existingSkillsToUpdate = draft.course.skills.filter((s) => !s.deleted && s.id > 0);
      for (const skill of existingSkillsToUpdate) {
        await tx.courseSkill.update({
          where: { Id: skill.id },
          data: { SkillName: skill.skillName },
        });
      }

      // ========================================================================
      // STEP 3: Delete flagged items (bottom-up to respect FK constraints)
      // ========================================================================

      for (const module of draft.modules) {
        for (const item of module.items) {
          // Delete exam questions and their related data
          if (item.type === "exam" && item.exam) {
            for (const q of item.exam.questions) {
              // Delete question bank and answers if flagged
              if (q.questionBank?.deleted) {
                // Delete answers first
                const answersToDelete = q.questionBank.answers
                  .filter(a => a.id && !a.id.startsWith("temp_"))
                  .map(a => a.id);
                
                if (answersToDelete.length > 0) {
                  await tx.examAnswer.deleteMany({
                    where: { Id: { in: answersToDelete } },
                  });
                }
                
                // Delete question bank
                // Check if it's a real ID (not temp)
                const isTempQB = q.questionBank.id.toString().startsWith("temp_") || q.questionBank.id < 0;
                if (q.questionBank.id && !isTempQB) {
                  await tx.questionBank.delete({
                    where: { Id: q.questionBank.id.toString() },
                  });
                }
              }

              // Delete exam question link if flagged
              if (q.deleted && q.id && !q.id.startsWith("temp_")) {
                await tx.examQuestion.delete({
                  where: { Id: q.id },
                });
              }
            }

            // Delete exam if flagged
            if (item.exam.deleted && item.exam.id > 0) {
              await tx.exam.delete({
                where: { Id: item.exam.id },
              });
            }
          }

          // Delete lesson and resources if flagged
          if (item.type === "lesson" && item.lesson?.deleted) {
            // Delete resources first
            const resourcesToDelete = item.lesson.resources
              .filter(r => r.id > 0)
              .map(r => r.id);
            
            if (resourcesToDelete.length > 0) {
              await tx.lessonResource.deleteMany({
                where: { Id: { in: resourcesToDelete } },
              });
            }

            // Delete lesson
            if (item.lesson.id && !item.lesson.id.startsWith("temp_")) {
              await tx.courseLesson.delete({
                where: { Id: item.lesson.id },
              });
            }
          }

          // Delete module item if flagged
          if (item.deleted && item.id && !item.id.startsWith("temp_")) {
            await tx.moduleItem.delete({
              where: { Id: item.id },
            });
          }
        }

        // Delete module if flagged
        if (module.deleted && module.id > 0) {
          await tx.courseModule.delete({
            where: { Id: module.id },
          });
        }
      }

      // ========================================================================
      // STEP 4: Insert/Update Modules (top-down)
      // ========================================================================

      // Map to track temp ID -> real ID conversions
      const moduleIdMap = new Map();
      const itemIdMap = new Map();
      const questionBankIdMap = new Map();

      for (const module of draft.modules.filter((m) => !m.deleted)) {
        let moduleId;

        if (module.id < 0) {
          // Insert new module
          const newModule = await tx.courseModule.create({
            data: {
              CourseId: courseId,
              OrderNo: module.orderNo,
              Title: module.title,
            },
          });
          moduleId = newModule.Id;
          moduleIdMap.set(module.id, moduleId);
        } else {
          // Update existing module
          await tx.courseModule.update({
            where: { Id: module.id },
            data: {
              OrderNo: module.orderNo,
              Title: module.title,
            },
          });
          moduleId = module.id;
        }

        // ========================================================================
        // STEP 5: Insert/Update Module Items
        // ========================================================================

        for (const item of module.items.filter((i) => !i.deleted)) {
          let itemId;

          if (item.id.startsWith("temp_")) {
            // Insert new module item
            const newItem = await tx.moduleItem.create({
              data: {
                CourseModuleId: moduleId,
                OrderNo: item.orderNo,
              },
            });
            itemId = newItem.Id;
            itemIdMap.set(item.id, itemId);
          } else {
            // Update existing module item
            await tx.moduleItem.update({
              where: { Id: item.id },
              data: { OrderNo: item.orderNo },
            });
            itemId = item.id;
          }

          // ========================================================================
          // STEP 6: Insert/Update Lessons or Exams
          // ========================================================================

          if (item.type === "lesson" && item.lesson && !item.lesson.deleted) {
            let lessonId;

            if (item.lesson.id.startsWith("temp_")) {
              // Insert new lesson
              const newLesson = await tx.courseLesson.create({
                data: {
                  ModuleItemId: itemId,
                  Title: item.lesson.title,
                  LessonType: item.lesson.lessonType,
                  VideoUrl: item.lesson.videoUrl,
                  DocUrl: item.lesson.docUrl,
                  CreatedById: item.lesson.createdById,
                },
              });
              lessonId = newLesson.Id;
            } else {
              // Update existing lesson
              await tx.courseLesson.update({
                where: { Id: item.lesson.id },
                data: {
                  Title: item.lesson.title,
                  LessonType: item.lesson.lessonType,
                  VideoUrl: item.lesson.videoUrl,
                  DocUrl: item.lesson.docUrl,
                },
              });
              lessonId = item.lesson.id;
            }

            // Handle lesson resources
            for (const resource of item.lesson.resources.filter((r) => !r.deleted)) {
              if (resource.id < 0) {
                // Insert new resource
                await tx.lessonResource.create({
                  data: {
                    LessonId: lessonId,
                    Name: resource.name,
                    Url: resource.url,
                    OrderNo: null, // or calculate based on index if needed
                  },
                });
              } else {
                // Update existing resource
                await tx.lessonResource.update({
                  where: { Id: resource.id },
                  data: {
                    Name: resource.name,
                    Url: resource.url,
                  },
                });
              }
            }
          } else if (item.type === "exam" && item.exam && !item.exam.deleted) {
            let examId;

            if (item.exam.id < 0) {
              // Insert new exam
              const newExam = await tx.exam.create({
                data: {
                  ModuleItemId: itemId,
                  Title: item.exam.title,
                  Description: item.exam.description,
                  DurationPreset: item.exam.durationPreset,
                  DurationCustom: item.exam.durationCustom,
                  CreatedById: item.exam.createdById,
                },
              });
              examId = newExam.Id;
            } else {
              // Update existing exam
              await tx.exam.update({
                where: { Id: item.exam.id },
                data: {
                  Title: item.exam.title,
                  Description: item.exam.description,
                  DurationPreset: item.exam.durationPreset,
                  DurationCustom: item.exam.durationCustom,
                },
              });
              examId = item.exam.id;
            }

            // ========================================================================
            // STEP 7: Insert/Update Questions and Question Banks
            // ========================================================================

            for (const q of item.exam.questions.filter((qu) => !qu.deleted)) {
              let questionBankId;

              // Insert or update question bank
              // Changed logic to check for temp_ prefix for QuestionBank as it is String ID
              const isTempQB = q.questionBank.id.toString().startsWith("temp_") || q.questionBank.id < 0;
              if (isTempQB) {
                const newQB = await tx.questionBank.create({
                  data: {
                    QuestionText: q.questionBank.questionText,
                    Type: q.questionBank.type,
                    Answer: q.questionBank.answer,
                    LessonId: q.questionBank.lessonId,
                    courseId: q.questionBank.courseId,
                  },
                });
                questionBankId = newQB.Id;
                questionBankIdMap.set(q.questionBank.id, questionBankId);
              } else {
                await tx.questionBank.update({
                  where: { Id: q.questionBank.id.toString() },
                  data: {
                    QuestionText: q.questionBank.questionText,
                    Type: q.questionBank.type,
                    Answer: q.questionBank.answer,
                  },
                });
                questionBankId = q.questionBank.id.toString();
              }

              // Insert/update answers for MCQ, Fill, TF
              if (q.questionBank.type !== "Essay") {
                for (const ans of q.questionBank.answers.filter((a) => !a.deleted)) {
                  if (ans.id.startsWith("temp_")) {
                    await tx.examAnswer.create({
                      data: {
                        QuestionId: questionBankId,
                        AnswerText: ans.answerText,
                        IsCorrect: ans.isCorrect,
                      },
                    });
                  } else {
                    await tx.examAnswer.update({
                      where: { Id: ans.id },
                      data: {
                        AnswerText: ans.answerText,
                        IsCorrect: ans.isCorrect,
                      },
                    });
                  }
                }
              }

              // Create/update ExamQuestion link
              if (q.id.startsWith("temp_")) {
                await tx.examQuestion.create({
                  data: {
                    ExamId: examId,
                    QuestionId: questionBankId,
                  },
                });
              }
            }
          }
        }
      }

      await tx.course.update({
        where: { Id: courseId },
        data: {
          Draft: null,
          LastUpdated: new Date(),
          PublishedAt: new Date(), 
        },
      });
    });

    return { success: true, courseId };
  } catch (error) {
    console.error("Error committing draft:", error);
    return { success: false, errors: [error.message], courseId };
  }
};

export default commitDraftToDatabase;
