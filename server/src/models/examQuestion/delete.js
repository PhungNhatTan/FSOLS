import prisma from '../../prismaClient.js';

export default async function deleteExamQuestion(id) {
    try {
        const existing = await prisma.examQuestion.findFirst({
            where: {
                Id: id,
                DeletedAt: null,
            },
        });

        if (!existing) {
            return null;
        }

        return await prisma.examQuestion.update({
            where: { Id: id },
            data: {
                DeletedAt: new Date(),
            },
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return null;
        }
        throw err;
    }
}
