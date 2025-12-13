import prisma from "../../prismaClient.js";

export default async function updateScore(submissionId, score) {
    return prisma.examSubmission.update({
        where:{
            Id: submissionId
        },
        data: {
            Score: Math.round(score),
        },
    })    
}
