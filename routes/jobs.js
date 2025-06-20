const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');

// GET /api/jobs (with optional id query parameter)
router.get('/', jobsController.getJobs);

module.exports = router;
