import pool from "../../config/database.js";

export const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        location TEXT NOT NULL,
        city VARCHAR(255) DEFAULT '',
        cleaned BOOLEAN DEFAULT false,
        coffee_delivered BOOLEAN DEFAULT false,
        reminders TEXT DEFAULT '',
        completed BOOLEAN DEFAULT false,
        owner_acceptance JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
      CREATE INDEX IF NOT EXISTS idx_locations_completed ON locations(completed);
    `);

    await client.query("COMMIT");
    console.log("✅ Database tables created successfully");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating tables:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const checkTablesExist = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'locations'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error("Error checking tables:", error);
    return false;
  } finally {
    client.release();
  }
};

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("migrations/index.js");

if (isMainModule) {
  (async () => {
    try {
      await createTables();
      console.log("✅ All migrations completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  })();
}
