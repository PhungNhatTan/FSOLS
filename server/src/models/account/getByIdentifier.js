import prisma from "../../prismaClient.js";

export default async function getByIdentifier(identifier, providerId) {
    return prisma.accountIdentifier.findUnique({
        where: {
            ProviderId_Identifier: {
                ProviderId: providerId,
                Identifier: identifier,
            },
        },
    });
}
