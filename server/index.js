import app from "./src/app.js";
import { PORT } from "./src/config/server.js";

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
