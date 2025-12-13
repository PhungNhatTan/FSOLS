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
          Provider: { connect: { Id: providerId } }, 
        },
      },
    },
    include: {
      AccountIdentifier: true,
      AccountRole: true,
    },
  });
}
