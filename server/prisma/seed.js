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


  const emailProvider = await prisma.provider.upsert({
    where: { Name: "email" },
    update: {},
    create: { Name: "email", Enabled: true },
  });
  console.log("Email provider:", emailProvider.Name);

  // 1.1️⃣ Categories
  const categories = [
    { Name: "Development", Slug: "development", Description: "Software development, web development, and programming." },
    { Name: "Business", Slug: "business", Description: "Business management, finance, and entrepreneurship." },
    { Name: "IT & Software", Slug: "it-software", Description: "IT certifications, network security, and hardware." },
    { Name: "Design", Slug: "design", Description: "Graphic design, UI/UX, and creative arts." },
    { Name: "Marketing", Slug: "marketing", Description: "Digital marketing, SEO, and social media strategy." },
    { Name: "Health & Fitness", Slug: "health-fitness", Description: "Yoga, nutrition, and personal training." },
    { Name: "Lifestyle", Slug: "lifestyle", Description: "Arts & crafts, beauty, and home improvement." },
    { Name: "Photography & Video", Slug: "photography-video", Description: "Digital photography and video editing." },
    { Name: "Music", Slug: "music", Description: "Instruments, production, and music theory." },
    { Name: "Teaching & Academics", Slug: "teaching-academics", Description: "Language learning, social science, and humanities." },
    { Name: "Personal Development", Slug: "personal-development", Description: "Leadership, productivity, and soft skills." },
    { Name: "Finance & Accounting", Slug: "finance-accounting", Description: "Investing, taxes, and financial modeling." },
    { Name: "Office Productivity", Slug: "office-productivity", Description: "Microsoft Excel, SAP, and project management tools." },
    { Name: "Languages", Slug: "languages", Description: "English, Spanish, Mandarin, and more." },
    { Name: "Data Science", Slug: "data-science", Description: "Machine learning, AI, and data analysis." },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { Slug: category.Slug },
      update: category,
      create: category,
    });
  }
  console.log("Categories seeded ✅");

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
