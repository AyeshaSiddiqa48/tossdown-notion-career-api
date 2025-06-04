const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');

// POST /api/career/apply - Submit job application
router.post('/apply', careerController.submitApplication);

module.exports = router;

