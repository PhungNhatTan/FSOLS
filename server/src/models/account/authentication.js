import prisma from "../../prismaClient.js";

export default async function authenticate(identifier) {
    return prisma.accountIdentifier.findUnique({
        where: { Identifier: identifier },
        include: {
            Account: {
                include: {
                    AccountRole: true, 
                },
            },
        },
    });
}