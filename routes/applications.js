const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

// GET /api/applications (with optional id query parameter)
router.get('/', applicationController.getApplications);

// POST /api/applications/interview - Submit interview results
router.post('/interview', applicationController.submitInterview);

// PUT /api/applications/update-questions - Update interview questions only
router.put('/update-questions', applicationController.updateQuestions);

// PUT /api/applications/update-status - Update application status
router.put('/update-status', applicationController.updateStatus);

module.exports = router;
