import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually locate the .env file in the server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { generateEmbedding } from '../src/services/aiService.js';
import prisma from '../src/prismaClient.js';

async function sync() {
  try {
    const courses = await prisma.course.findMany({ 
        where: { Embedding: null } 
    });
    
    console.log(`Found ${courses.length} courses to process.`);

    for (const course of courses) {
      const vector = await generateEmbedding(`${course.Name} ${course.Description}`);
      await prisma.courseEmbedding.create({
        data: { CourseId: course.Id, Vector: vector }
      });
      console.log(`✅ Updated: ${course.Name}`);
    }
    console.log("Sync complete!");
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
