import prisma from "../../prismaClient.js";

export default async function create(data) {
    return prisma.exam.create({
    data: {
      Title: data.Title,
      Description: data.Description,
      DurationPreset: data.DurationPreset,
      DurationCustom: data.DurationCustom,
      ModuleItem: {
        create: {
          OrderNo: data.OrderNo ?? 10,
          CourseModule: { connect: { Id: data.CourseModuleId } },
        },
      },
    },
    include: { ModuleItem: true },
  });
}
