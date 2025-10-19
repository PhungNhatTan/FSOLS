import prisma from "../../prismaClient.js";

export default async function get(id) {
    return prisma.Exam.findUnique({
        where:{ 
            Id: id,
            DeletedAt: null,
        },
        select:{
            Id: true,
            Title: true,
            Description: true,
            DurationPreset:true,
            DUrationCustom: true,
        }
    });
}
