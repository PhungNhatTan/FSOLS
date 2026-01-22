import prisma from "../src/prismaClient.js";
import { upsertCourseEmbedding } from "../src/services/courseEmbeddingService.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const courses = await prisma.course.findMany({
    where: { DeletedAt: null, PublishedAt: { not: null } },
    select: { Id: true, Name: true, Embedding: { select: { CourseId: true } } },
  });

  const targets = courses.filter((c) => !c.Embedding);

  console.log(`Published courses: ${courses.length}`);
  console.log(`Missing embeddings: ${targets.length}`);

  for (const c of targets) {
    console.log(`Embedding course ${c.Id} - ${c.Name}`);
    await upsertCourseEmbedding(c.Id);

    // Simple throttle to avoid rate limiting
    await sleep(300);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
