import prisma from "../../prismaClient.js";

export default async function getByUsername(username) {
    return prisma.account.findUnique({
        where: { Username: username },
    });
}