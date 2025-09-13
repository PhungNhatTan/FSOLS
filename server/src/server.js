import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});

