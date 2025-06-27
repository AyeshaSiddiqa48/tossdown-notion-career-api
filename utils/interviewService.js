const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

const applicationDatabaseId = process.env.APPLICATION_DATABASE_ID || '1d921223-e79e-8164-8cd4-fa013f4dd093';

// Function to calculate average score from interview questions
function calculateAverageScore(questions) {
  if (!questions || questions.length === 0) {
    return 0;
  }

  const totalScore = questions.reduce((sum, question) => {
    const score = parseFloat(question.score) || 0;
    const maxScore = parseFloat(question.maxScore) || 5;
    // Normalize to 5-point scale
    const normalizedScore = (score / maxScore) * 5;
    return sum + normalizedScore;
  }, 0);

  return Math.round((totalScore / questions.length) * 100) / 100; // Round to 2 decimal places
}

// Function to update application record in Notion
async function updateApplicationInNotion(applicationId, updateData) {
  try {
    const response = await notion.pages.update({
      page_id: applicationId,
      properties: updateData
    });

    return response;
  } catch (error) {
    console.error('Error updating application in Notion:', error);
    
    // Fallback to axios
    try {
      const url = `https://api.notion.com/v1/pages/${applicationId}`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      const response = await axios.patch(url, { properties: updateData }, { headers });
      return response.data;
    } catch (axiosError) {
      console.error('Axios fallback error:', axiosError);
      throw axiosError;
    }
  }
}

// Main interview submission logic
async function submitInterviewData(applicationId, interviewType, interviewData) {
  // Validate required fields
  if (!applicationId || !interviewType || !interviewData) {
    throw new Error('Missing required fields: applicationId, interviewType, and interviewData are required');
  }

  // Validate interview type
  const validInterviewTypes = ['hr', 'technical', 'final'];
  if (!validInterviewTypes.includes(interviewType.toLowerCase())) {
    throw new Error('Invalid interview type. Must be one of: hr, technical, final');
  }

  // Calculate average score if questions exist in the data
  let averageScore = 0;
  if (interviewData.questions && Array.isArray(interviewData.questions) && interviewData.questions.length > 0) {
    averageScore = calculateAverageScore(interviewData.questions);
  }

  // Prepare update data based on interview type
  const updateData = {};
  const interviewTypeKey = interviewType.toLowerCase();

  // Map interview types to Notion property names
  const propertyMapping = {
    'hr': {
      interviewField: 'HR Interview'
    },
    'technical': {
      interviewField: 'Technical Interview'
    },
    'final': {
      interviewField: 'Final Interview'
    }
  };

  const mapping = propertyMapping[interviewTypeKey];

  // Add calculated average score and timestamp to the interview data
  const finalInterviewData = {
    ...interviewData,
    averageScore: averageScore,
    submittedAt: new Date().toISOString()
  };

  // Update the interview field with complete JSON data
  updateData[mapping.interviewField] = {
    rich_text: [
      {
        type: 'text',
        text: {
          content: JSON.stringify(finalInterviewData, null, 2)
        }
      }
    ]
  };

  // Update the record in Notion
  await updateApplicationInNotion(applicationId, updateData);

  console.log(`Successfully updated ${interviewType} interview for application ${applicationId} with score ${averageScore}`);

  return {
    success: true,
    message: `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview submitted successfully`,
    data: {
      applicationId,
      interviewType,
      averageScore,
      submittedData: finalInterviewData,
      updatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  submitInterviewData,
  calculateAverageScore,
  updateApplicationInNotion
};
