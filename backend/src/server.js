import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   TEST ROUTE
====================== */
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Backend is reachable 🚀",
    timestamp: new Date().toISOString()
  });
});

/* ======================
   AUTH ROUTES
====================== */

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});
/* ======================
   CONTACT ROUTE
====================== */
// CONTACT ROUTE - Fixed version
app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    console.log("📨 Received contact request:", { name, email, message });

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Insert contact - using correct column names (fullname, email, message)
    const query = {
      text: 'INSERT INTO contacts (fullname, email, message) VALUES ($1, $2, $3) RETURNING *',
      values: [name, email, message]
    };

    const result = await pool.query(query);
    
    console.log("✅ Contact saved successfully:", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Message sent successfully ✅",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Contact save error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      table: error.table
    });
    
    // Check for specific PostgreSQL errors
    if (error.code === '42P01') { // Undefined table
      return res.status(500).json({ 
        success: false,
        error: "Database table not found. Please run the schema setup.",
        details: "Missing contacts table"
      });
    } else if (error.code === '42703') { // Undefined column
      return res.status(500).json({ 
        success: false,
        error: "Database column mismatch. Please check schema.",
        details: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Failed to send message. Please try again." 
    });
  }
});
/* ======================
   SPONSOR ROUTE
====================== */
app.post("/api/sponsors", async (req, res) => {
  try {
    const { name, email, phone, supportType, message } = req.body;

    // Validate required fields
    if (!name || !email || !supportType || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Required fields missing" 
      });
    }

    // Insert sponsor request
    const result = await pool.query(
      `INSERT INTO sponsors (name, email, phone, support_type, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone || null, supportType, message]
    );

    console.log("✅ Sponsor request saved:", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Sponsorship request submitted successfully ✅",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Sponsor save error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit request. Please try again." 
    });
  }
});

/* ======================
   HEALTH CHECK
====================== */
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query("SELECT NOW() as current_time");
    
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbResult.rows[0].current_time
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

/* ======================
   ERROR HANDLING MIDDLEWARE
====================== */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* ======================
   START SERVER
====================== */
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on http://localhost:${PORT}
  📝 Environment: ${process.env.NODE_ENV || 'development'}
  🔌 Connected to PostgreSQL
  `);
});