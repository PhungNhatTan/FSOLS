import prisma from "../../prismaClient.js";

export default async function getByIdentifier(identifier) {
    return prisma.accountIdentifier.findUnique({
        where: { Identifier: identifier },
    });
}
