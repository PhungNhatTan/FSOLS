import prisma from "../../prismaClient.js";

export default async function authenticate(identifier) {
    return prisma.accountIdentifier.findUnique({
        where: {
            ProviderId_Identifier: {
                ProviderId: 1,
                Identifier: identifier,
            },
        },
        include: {
            Account: {
                include: {
                    AccountRole: true,
                },
            },
        },
    });
}