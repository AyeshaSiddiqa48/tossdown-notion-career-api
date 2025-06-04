const express = require('express');
const cors = require('cors');
require('dotenv').config();
const emailService = require('./services/emailService');
const notionService = require('./services/notionService');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://tossdown.com';

// CORS configuration
const corsOptions = {
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Get new job applications from email
app.get('/api/applications/email', async (req, res) => {
  try {
    console.log('Fetching new job applications from email...');
    await emailService.connect();
    const applications = await emailService.getNewApplicationEmails();
    await emailService.disconnect();
    
    res.json({
      success: true,
      message: `Found ${applications.length} new applications`,
      applications: applications
    });
  } catch (error) {
    console.error('Email fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications from email',
      error: error.message
    });
  }
});

// Save application to Notion
app.post('/api/applications/notion', async (req, res) => {
  try {
    const application = req.body;
    
    // Validate required fields
    if (!application || !application.email) {
      return res.status(400).json({
        success: false,
        message: 'Application data is required with at least an email field'
      });
    }

    // Check for duplicate
    const exists = await notionService.checkIfApplicationExists(application.email);
    if (exists) {
      return res.json({
        success: true,
        message: 'Application already exists in Notion',
        exists: true
      });
    }

    // Add to Notion
    const response = await notionService.addApplication(application);
    res.json({
      success: true,
      message: 'Application successfully added to Notion',
      response: response
    });
  } catch (error) {
    console.error('Notion save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save application to Notion',
      error: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Job Applications API',
    endpoints: {
      'GET /api/applications/email': 'Fetch new job applications from email',
      'POST /api/applications/notion': 'Save an application to Notion database'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

