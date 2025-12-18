import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const baseUploadsDir = path.join(__dirname, "../../uploads");

export const draftUploadsDir = path.join(baseUploadsDir, "draft");
export const productionUploadsDir = path.join(baseUploadsDir, "production");

[draftUploadsDir, productionUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
