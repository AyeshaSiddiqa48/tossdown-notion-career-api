const { submitInterviewData } = require('../../utils/interviewService');

// Main serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Debug logging to see what we're receiving
    console.log('=== API Debug ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Body type:', typeof req.body);

    const { applicationId, interviewType, interviewData } = req.body;

    // Additional debug logging
    console.log('Extracted values:');
    console.log('- applicationId:', applicationId);
    console.log('- interviewType:', interviewType);
    console.log('- interviewData:', interviewData);

    const result = await submitInterviewData(applicationId, interviewType, interviewData);
    res.json(result);

  } catch (error) {
    console.error('Error in submitInterview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting interview',
      error: error.message
    });
  }
};
