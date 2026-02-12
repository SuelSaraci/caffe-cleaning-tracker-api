import pool from "../../config/database.js";
import { rawLocations } from "./seedData.js";

export const isDatabaseSeeded = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT COUNT(*) as count FROM locations"
    );
    return parseInt(result.rows[0].count, 10) > 0;
  } catch (error) {
    return false;
  } finally {
    client.release();
  }
};

export const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    const count = await client.query("SELECT COUNT(*) as count FROM locations");
    if (parseInt(count.rows[0].count, 10) > 0) {
      console.log("⚠️  Locations already exist, skipping seed");
      return;
    }

    const sorted = [...rawLocations].sort((a, b) => {
      const byCity = (a.City || "").localeCompare(b.City || "", "sq");
      return byCity !== 0 ? byCity : (a.Name || "").localeCompare(b.Name || "", "sq");
    });

    for (let i = 0; i < sorted.length; i++) {
      const loc = sorted[i];
      await client.query(
        `INSERT INTO locations (
           id, name, location, city,
           cleaned, coffee_delivered, reminders, completed,
           coffee_price_kg, coffee_type, phone
         )
         VALUES ($1, $2, $3, $4, false, false, '', false, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          `loc-${i}`,
          loc.Name,
          loc.Location,
          loc.City ?? "",
          loc.CoffeePriceKg ?? null,
          loc.CoffeeType ?? null,
          loc.Phone ?? null,
        ]
      );
    }
    console.log(`✅ Seeded ${sorted.length} locations`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("seeders/index.js");

if (isMainModule) {
  (async () => {
    try {
      await seedDatabase();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  })();
}
