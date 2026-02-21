const pool = require("../db");

exports.createSponsor = async (req, res) => {
  try {
    const { name, email, phone, supportType, message } = req.body;

    await pool.query(
      `INSERT INTO sponsors (name, email, phone, support_type, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, phone, supportType, message]
    );

    res.json({ message: "Sponsor request submitted ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
