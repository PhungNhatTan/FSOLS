import prisma from "../../prismaClient.js";

export default async function createAccount({ username, displayName, identifier, password, providerId }) {
  return prisma.account.create({
    data: {
      Username: username,
      DisplayName: displayName,
      AccountIdentifier: {
        create: {
          Identifier: identifier,
          Secret: password, 
          ProviderId: providerId, 
        },
      },
    },
    include: {
      AccountIdentifier: true,
      AccountRole: true,
    },
  });
}