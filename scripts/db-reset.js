import pool from "../src/config/database.js";
import { createTables, checkTablesExist } from "../src/database/migrations/index.js";
import { seedDatabase } from "../src/database/seeders/index.js";

(async () => {
  try {
    const exists = await checkTablesExist();
    if (!exists) {
      await createTables();
    }
    await pool.query("DELETE FROM locations");
    await seedDatabase();
    console.log("✅ DB reset complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ DB reset failed:", error);
    process.exit(1);
  }
})();
