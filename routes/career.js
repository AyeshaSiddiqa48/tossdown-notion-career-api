const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');

// POST /api/career/apply - Submit job application
router.post('/apply', careerController.submitApplication);

// ✅ NEW: POST /api/career/update-status - Update status of an application
router.post('/update-status', careerController.updateApplicationStatus);

module.exports = router;

