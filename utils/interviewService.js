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
    console.error('Error details:', error.message);
    if (error.body) {
      console.error('Error body:', error.body);
    }

    // Fallback to axios
    try {
      const url = `https://api.notion.com/v1/pages/${applicationId}`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      console.log('Trying axios fallback...');
      const response = await axios.patch(url, { properties: updateData }, { headers });
      return response.data;
    } catch (axiosError) {
      console.error('Axios fallback error:', axiosError);
      console.error('Axios error details:', axiosError.message);
      if (axiosError.response) {
        console.error('Axios response data:', axiosError.response.data);
      }
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

  // Debug logging
  console.log('=== Interview Submission Debug ===');
  console.log('Application ID:', applicationId);
  console.log('Interview Type:', interviewType);
  console.log('Interview Data:', JSON.stringify(interviewData, null, 2));

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
      interviewField: 'HR Interview',
      finalScoreField: 'HR Final Score'
    },
    'technical': {
      interviewField: 'Technical Interview',
      finalScoreField: 'Technical Final Score'
    },
    'final': {
      interviewField: 'Final Interview',
      finalScoreField: 'Final Score'
    }
  };

  const mapping = propertyMapping[interviewTypeKey];

  // Restructure the data with questions and result separated
  const finalInterviewData = {
    questions: interviewData.questions || [],
    result: {
      comments: interviewData.comments || '',
      final_score: averageScore,
      submittedAt: new Date().toISOString(),
      // Include any other fields from interviewData except questions and comments
      ...Object.fromEntries(
        Object.entries(interviewData).filter(([key]) =>
          !['questions', 'comments'].includes(key)
        )
      )
    }
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

  // For technical interviews, calculate combined score with HR interview
  if (interviewTypeKey === 'technical') {
    try {
      // Fetch the application to get HR interview data
      const response = await notion.pages.retrieve({ page_id: applicationId });
      
      // Extract HR interview data if it exists
      let hrScore = 0;
      if (response.properties && response.properties['HR Interview'] && 
          response.properties['HR Interview'].rich_text && 
          response.properties['HR Interview'].rich_text.length > 0) {
        
        const hrInterviewText = response.properties['HR Interview'].rich_text[0].text.content;
        try {
          const hrInterviewData = JSON.parse(hrInterviewText);
          if (hrInterviewData.result && hrInterviewData.result.final_score) {
            hrScore = parseFloat(hrInterviewData.result.final_score) || 0;
          }
        } catch (parseError) {
          console.error('Error parsing HR interview data:', parseError);
        }
      }
      
      // Calculate combined average score (HR + Technical) / 2
      const combinedScore = Math.round(((hrScore + averageScore) / 2) * 100) / 100;
      
      // Add combined score to update data
      updateData[mapping.finalScoreField] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: JSON.stringify({
                technical_score: averageScore,
                hr_score: hrScore,
                combined_average: combinedScore
              }, null, 2)
            }
          }
        ]
      };
      
      console.log(`Combined score calculation: HR (${hrScore}) + Technical (${averageScore}) = ${combinedScore}`);
      
    } catch (error) {
      console.error('Error calculating combined score:', error);
    }
  }

  // Debug logging
  console.log(`Attempting to update ${interviewType} interview for application ${applicationId}`);
  console.log(`Property field: ${mapping.interviewField}`);
  console.log(`Update data:`, JSON.stringify(updateData, null, 2));

  // Update the record in Notion
  await updateApplicationInNotion(applicationId, updateData);

  console.log(`Successfully updated ${interviewType} interview for application ${applicationId} with score ${averageScore}`);

  return {
    success: true,
    message: `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview submitted successfully`,
    data: {
      applicationId,
      interviewType,
      final_score: averageScore,
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




