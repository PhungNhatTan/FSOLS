import express from "express";
import routes from "./routers/index.js";
// import errorHandler from "./middleware/errorHandler.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,               
  })
);

app.use(express.json());
app.use(routes);
// app.use(errorHandler);

export default app;

