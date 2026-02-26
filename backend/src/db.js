// backend/src/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Check if we're in production (Render) or development (local)
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isProduction ? {
    ssl: {
      rejectUnauthorized: false // SSL only in production
    }
  } : {
    ssl: false // No SSL for local development
  }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
    console.error("Environment:", process.env.NODE_ENV || 'development');
    console.error("SSL Enabled:", isProduction ? "Yes" : "No");
  } else {
    console.log(`✅ PostgreSQL connected successfully (${isProduction ? 'production' : 'development'} mode)`);
    release();
  }
});

export default pool;