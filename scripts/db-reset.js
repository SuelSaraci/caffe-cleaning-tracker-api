import pool from "../src/config/database.js";
import { createTables } from "../src/database/migrations/index.js";
import { seedDatabase } from "../src/database/seeders/index.js";

(async () => {
  try {
    // Always run createTables so new columns (coffee_price_kg, etc.)
    // are added via ALTER TABLE ... IF NOT EXISTS even if the table already exists.
    await createTables();

    await pool.query("DELETE FROM locations");
    await seedDatabase();
    console.log("✅ DB reset complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ DB reset failed:", error);
    process.exit(1);
  }
})();
