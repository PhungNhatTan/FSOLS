// prisma/seed.js
import bcrypt from "bcrypt";
import prisma from "../src/prismaClient.js";

async function main() {
  console.log("Seeding database...");

  // Use env vars for production
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // 1️⃣ Default provider
  const provider = await prisma.provider.upsert({
    where: { Name: "username" },
    update: {},
    create: { Name: "username", Enabled: true },
  });
  console.log("Default provider:", provider.Name);

  // 2️⃣ Admin account
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminAccount = await prisma.account.upsert({
    where: { Username: adminUsername },
    update: {},
    create: {
      Username: adminUsername,
      DisplayName: "Administrator",
      Admin: { create: {} },
      AccountRole: { create: { Role: "Admin" } },
    },
  });

  // 3️⃣ Admin AccountIdentifier (for login)
  const existingIdentifier = await prisma.accountIdentifier.findUnique({
    where: {
      ProviderId_Identifier: {
        ProviderId: provider.Id,
        Identifier: adminAccount.Username,
      },
    },
  });

  if (!existingIdentifier) {
    await prisma.accountIdentifier.create({
      data: {
        AccountId: adminAccount.Id,
        Identifier: adminAccount.Username,
        Secret: hashedPassword,
        Verified: true,
        ProviderId: provider.Id,
      },
    });
    console.log("Admin login credentials created ✅");
  } else {
    console.log("Admin login credentials already exist, skipping ✅");
  }

  console.log("Seeding finished ✅");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
