import prisma from "../../prismaClient.js";

export default async function get(id) {
    return prisma.provider.findUnique({
        where: {
            Id: id,
            Enabled: true,
        },
        select: {
            Id: true,
            Name: true,
            Config: true,
        }
    });
}
