import prisma from "../../prismaClient.js";

export default async function authenticate(identifier) {
  const providers = await prisma.provider.findMany({
    where: { Name: { in: ["username", "email"] }, Enabled: true },
    select: { Id: true },
  });

  const providerIds = providers.map((p) => p.Id);
  if (providerIds.length === 0) return null;

  return prisma.accountIdentifier.findFirst({
    where: { ProviderId: { in: providerIds }, Identifier: identifier },
    include: {
      Provider: true,
      Account: {
        include: {
          AccountRole: true,
          AccountIdentifier: { include: { Provider: true } },
        },
      },
    },
  });
}
