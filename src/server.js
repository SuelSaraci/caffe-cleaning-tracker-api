import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import {
  createTables,
  checkTablesExist,
} from "./database/migrations/index.js";
import { isDatabaseSeeded, seedDatabase } from "./database/seeders/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const runMigrationsOnStartup = async () => {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.log("📦 Tables not found. Running migrations...");
      await createTables();
      console.log("✅ Migrations completed successfully");
    } else {
      console.log("✅ Database tables already exist");
    }
  } catch (error) {
    console.error("⚠️  Could not run migrations on startup:", error.message);
  }
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*") {
      const allowedOrigins = process.env.CORS_ORIGIN.split(",").map((o) =>
        o.trim()
      );
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 100,
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
  });
});

const startServer = async () => {
  await runMigrationsOnStartup();

  try {
    const seeded = await isDatabaseSeeded();
    if (!seeded) {
      console.log("🌱 Seeding database...");
      await seedDatabase();
      console.log("✅ Database seeded");
    }
  } catch (error) {
    console.error("⚠️  Could not seed on startup:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Caffe Tracker API running on port ${PORT}`);
  });
};

startServer();

export default app;
