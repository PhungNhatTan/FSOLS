import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "./src/app.js";
import { PORT } from "./src/config/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("BOOT from", __filename);
console.log("DIR is", __dirname);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist"); // vite default build path
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/assets/")) {
      return next(); // let express.static handle assets
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
