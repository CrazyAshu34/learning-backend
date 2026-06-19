import app from "./src/app.js";
import { initDB } from "./src/config/db.js";

const PORT = 5000;

const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database and start server:", error);
    process.exit(1);
  }
};

startServer();
