const express = require("express");
const router = express.Router();
const { createSponsor } = require("../controllers/sponsor.controller");

router.post("/", createSponsor);

module.exports = router;
