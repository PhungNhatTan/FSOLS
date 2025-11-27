import express from "express";
import routes from "./routers/index.js";
import cors from "cors";
import { uploadsDir } from "./config/fileUpload.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

app.use(routes);

// Error handler for upload errors
app.use((err, req, res, next) => {
  if (err.message === "Unsupported file type") {
    return res.status(400).json({ message: "File type not allowed" });
  }
  if (err.message.includes("File too large")) {
    return res.status(413).json({ message: "File size exceeds limit" });
  }
  next(err);
});

export default app;

