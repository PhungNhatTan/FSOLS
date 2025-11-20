import prisma from '../../prismaClient.js';

export default async function deleteExamQuestion(id) {
    return prisma.examQuestion.update({
        where: {
            Id: id,
            DeletedAt: null,
        },
        data: {
            DeletedAt: new Date(),
        },
    });
}