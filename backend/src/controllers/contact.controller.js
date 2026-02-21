const pool = require("../db");

/* ================================
   CREATE CONTACT MESSAGE
================================ */
exports.createContact = async (req, res) => {
  try {
    console.log("📩 Incoming contact:", req.body);

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO "Contacts" ("fullName", "email", "message")
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, message]
    );

    res.status(201).json({
      success: true,
      message: "Contact message sent successfully ✅",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
