// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// CORS configuration
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
   HEALTH CHECK
====================== */
app.get("/api/health", async (req, res) => {
  try {
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
   🔴 TEMPORARY ROUTE - REMOVE AFTER USE 🔴
   ====================== */
app.get("/api/hash-admin-password", async (req, res) => {
    try {
        // Use bcrypt directly - it's already imported at the top
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const result = await pool.query(
            `UPDATE admin_users SET password = $1 WHERE username = 'admin' RETURNING *`,
            [hashedPassword]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "❌ Admin user not found. Please create admin user first." 
            });
        }
        
        console.log("✅ Admin password hashed successfully for:", result.rows[0].username);
        
        res.json({ 
            success: true, 
            message: "✅ Admin password hashed successfully!",
            credentials: {
                username: "admin",
                password: "admin123"
            },
            warning: "⚠️  REMOVE THIS ROUTE IMMEDIATELY AFTER USE! ⚠️"
        });
    } catch (error) {
        console.error("❌ Password hashing error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
/* ======================
   PUBLIC ROUTES
====================== */

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

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

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

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
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

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

// CONTACT FORM
app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO contacts (fullname, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, message]
    );

    console.log("✅ Contact saved:", result.rows[0]);

    // Send email notification to admin
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@logicspark.com',
        subject: '📬 New Contact Message - Logic Spark',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff8c00; border-radius: 10px;">
            <h2 style="color: #ff8c00; text-align: center;">New Contact Message</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong style="color: #ff8c00;">Name:</strong> ${name}</p>
              <p><strong style="color: #ff8c00;">Email:</strong> ${email}</p>
              <p><strong style="color: #ff8c00;">Message:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
              <p><strong style="color: #ff8c00;">Received:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="http://localhost:5500/admin.html" style="background: #ff8c00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a>
            </p>
          </div>
        `
      });
      console.log("✅ Email notification sent");
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully ✅",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Contact save error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send message. Please try again." 
    });
  }
});

// SPONSOR FORM
app.post("/api/sponsors", async (req, res) => {
  try {
    const { name, email, phone, supportType, message } = req.body;

    if (!name || !email || !supportType || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Required fields missing" 
      });
    }

    const result = await pool.query(
      `INSERT INTO sponsors (name, email, phone, support_type, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone || null, supportType, message]
    );

    console.log("✅ Sponsor request saved:", result.rows[0]);

    // Send email notification to admin
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@logicspark.com',
        subject: '🤝 New Sponsorship Request - Logic Spark',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff8c00; border-radius: 10px;">
            <h2 style="color: #ff8c00; text-align: center;">New Sponsorship Request</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong style="color: #ff8c00;">Name/Organization:</strong> ${name}</p>
              <p><strong style="color: #ff8c00;">Email:</strong> ${email}</p>
              <p><strong style="color: #ff8c00;">Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong style="color: #ff8c00;">Support Type:</strong> ${supportType}</p>
              <p><strong style="color: #ff8c00;">Message:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
              <p><strong style="color: #ff8c00;">Received:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="http://localhost:5500/admin.html" style="background: #ff8c00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a>
            </p>
          </div>
        `
      });
      console.log("✅ Email notification sent");
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

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
   ADMIN AUTH ROUTES
====================== */

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      "SELECT * FROM admin_users WHERE username = $1",
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
    
    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
    
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    
    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
    
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/* ======================
   ADMIN MIDDLEWARE
====================== */
function verifyAdminToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Access denied. No token provided." 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
}

/* ======================
   ADMIN DASHBOARD ROUTES
====================== */

// Get all contact messages
app.get("/api/admin/contacts", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contacts" 
    });
  }
});

// Get all sponsor requests
app.get("/api/admin/sponsors", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sponsors ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching sponsors:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch sponsors" 
    });
  }
});

// Mark message as read
app.put("/api/admin/contacts/:id/read", verifyAdminToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE contacts SET is_read = TRUE WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// Mark sponsor as read
app.put("/api/admin/sponsors/:id/read", verifyAdminToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE sponsors SET is_read = TRUE WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// Delete contact message
app.delete("/api/admin/contacts/:id", verifyAdminToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// Delete sponsor request
app.delete("/api/admin/sponsors/:id", verifyAdminToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM sponsors WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Request deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// Database setup route (run once)
app.get("/api/admin/setup", async (req, res) => {
  try {
    await pool.query(
      "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE"
    );
    await pool.query(
      "ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE"
    );
    res.json({ success: true, message: "Database setup complete" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================
   ERROR HANDLING
====================== */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

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