const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

// GET /api/applications (with optional id query parameter)
router.get('/', applicationController.getApplications);

module.exports = router;
