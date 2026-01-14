import prisma from "../prismaClient.js";

export async function ensureAuthProviders() {
  const usernameProvider = await prisma.provider.upsert({
    where: { Name: "username" },
    update: {},
    create: { Name: "username", Enabled: true },
  });

  const emailProvider = await prisma.provider.upsert({
    where: { Name: "email" },
    update: {},
    create: { Name: "email", Enabled: true },
  });

  return { usernameProvider, emailProvider };
}
