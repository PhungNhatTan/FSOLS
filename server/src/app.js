import express from "express";
import routes from "./routers/index.js";
// import errorHandler from "./middleware/errorHandler.js";
import cors from "cors";
import certificateRoutes from "./routers/manage/certificateRoute.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,               
  })
);

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(routes);
// app.use(errorHandler);
app.use('/api/certificates', certificateRoutes);

export default app;

