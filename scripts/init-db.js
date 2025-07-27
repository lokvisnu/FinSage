#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
  console.log("🚀 Initializing database...");

  try {
    // Check if we're in production or have a DATABASE_URL
    const isProduction = process.env.NODE_ENV === "production";
    const hasNeonUrl = !!process.env.DATABASE_URL;

    if (isProduction || hasNeonUrl) {
      console.log("📝 Setting up Neon PostgreSQL database...");

      // Use Neon for production or when DATABASE_URL is provided
      const { Pool } = require("@neondatabase/serverless");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      // Read the PostgreSQL schema
      const schemaPath = path.join(process.cwd(), "db", "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");

      // Split schema into individual statements and execute
      const statements = schema
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await pool.query(statement + ";");
      }

      await pool.end();
      console.log("✅ Neon PostgreSQL database initialized successfully!");
    } else {
      console.log("📝 Setting up SQLite database for development...");

      // Use SQLite for local development
      const Database = require("better-sqlite3");
      const dbPath = path.join(process.cwd(), "local.db");
      const db = new Database(dbPath);

      // Enable foreign keys
      db.pragma("foreign_keys = ON");

      // Read the SQLite schema
      const schemaPath = path.join(process.cwd(), "db", "schema-sqlite.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");

      // Split schema into individual statements and execute
      const statements = schema
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement + ";");
        }
      }

      db.close();
      console.log("✅ SQLite database initialized successfully!");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
