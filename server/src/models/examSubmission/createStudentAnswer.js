import prisma from "../../prismaClient.js";

export default async function createStudentAnswer(data) {
    return prisma.studentAnswer.create({ data });
}
