// Database configuration that supports both SQLite (local dev) and Neon (production)

import { convertToNeonCompatibleQuery } from "./neon";

let dbInstance: any = null;

// SQLite configuration for local development (dev dependencies only)
function createSQLiteConnection() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SQLite is not available in production environment");
  }

  try {
    // Import better-sqlite3 only in development
    const Database = require("better-sqlite3");
    const path = require("path");

    const dbPath = path.join(process.cwd(), "local.db");
    const db = new Database(dbPath);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");

    return {
      query: async (sql: string, params?: any[]) => {
        try {
          if (sql.trim().toLowerCase().startsWith("select")) {
            const stmt = db.prepare(sql);
            const rows = params ? stmt.all(...params) : stmt.all();
            return { rows };
          } else {
            const stmt = db.prepare(sql);
            const result = params ? stmt.run(...params) : stmt.run();
            return {
              rows: [],
              rowCount: result.changes,
              insertId: result.lastInsertRowid,
            };
          }
        } catch (error) {
          console.error("SQLite query error:", error);
          throw error;
        }
      },
      close: () => db.close(),
    };
  } catch (error) {
    console.error("Failed to create SQLite connection:", error);
    throw new Error(
      "SQLite dependencies not available. Run: npm install --save-dev better-sqlite3"
    );
  }
}

// Neon configuration for production
function createNeonConnection() {
  try {
    const { Pool } = require("@neondatabase/serverless");

    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL environment variable is required for Neon connection"
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    return {
      query: (text: string, params?: any[]) => pool.query(convertToNeonCompatibleQuery(text), params),
      close: () => pool.end(),
    };
  } catch (error) {
    console.error("Failed to create Neon connection:", error);
    throw error;
  }
}

// Get database connection based on environment
function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const hasNeonUrl = !!process.env.DATABASE_URL;

  // Use Neon if in production OR if DATABASE_URL is provided (even in dev)
  if (isProduction || hasNeonUrl) {
    console.log("Using Neon database connection");
    dbInstance = createNeonConnection();
  } else {
    console.log("Using SQLite database connection for local development");
    dbInstance = createSQLiteConnection();
  }

  return dbInstance;
}

// Export query function
export const query = (text: string, params?: any[]) => {
  const db = getDatabase();
  return db.query(text, params);
};

// Export default for backward compatibility
export default {
  query,
};

// Export close function for cleanup
export const closeDatabase = () => {
  if (dbInstance && dbInstance.close) {
    dbInstance.close();
    dbInstance = null;
  }
};
