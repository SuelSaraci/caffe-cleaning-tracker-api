import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL;

if (
  !connectionString ||
  connectionString.includes("user:password@host:port/database") ||
  connectionString === "postgresql://user:password@host:port/database"
) {
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || "caffetracker";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";

  connectionString = `postgresql://${dbUser}${dbPassword ? `:${dbPassword}` : ""}@${dbHost}:${dbPort}/${dbName}`;
}

const isRailway =
  connectionString?.includes("railway.app") ||
  connectionString?.includes("proxy.rlwy.net") ||
  process.env.DB_HOST?.includes("railway") ||
  process.env.DB_HOST?.includes("rlwy.net");
const isProduction = process.env.NODE_ENV === "production";
const needsSSL = isProduction || isRailway;

// Railway uses self-signed certs - allow by default; set DB_SSL_REJECT_UNAUTHORIZED=true to enforce
const sslConfig = needsSSL
  ? {
      rejectUnauthorized: isRailway
        ? process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
        : process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(process.env.DB_CA_CERT && { ca: process.env.DB_CA_CERT }),
    }
  : false;

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Connected to PostgreSQL database");
  }
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
