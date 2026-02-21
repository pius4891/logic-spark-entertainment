app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    await pool.query(
      `INSERT INTO "Contacts" ("fullName", email, message)
       VALUES ($1, $2, $3)`,
      [name, email, message]
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully ✅"
    });

  } catch (error) {
    console.error("❌ Contact save error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
