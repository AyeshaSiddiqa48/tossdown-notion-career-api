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

  // Save individual interview average score to respective final score field
  if (mapping.finalScoreField) {
    updateData[mapping.finalScoreField] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: averageScore.toString()
          }
        }
      ]
    };
    console.log(`${interviewType} interview submitted with score: ${averageScore}`);
  }

  // Calculate and save total score based on available interviews
  await calculateAndSaveTotalScore(applicationId, interviewTypeKey, averageScore, updateData);

// Function to calculate and save total score based on available interviews
async function calculateAndSaveTotalScore(applicationId, currentInterviewType, currentScore, updateData) {
  try {
    // Fetch the application to get existing interview scores
    const response = await notion.pages.retrieve({ page_id: applicationId });

    let hrScore = null;
    let technicalScore = null;
    let finalScore = null;

    // Extract existing scores from the application
    if (response.properties) {
      // Get HR Final Score
      if (response.properties['HR Final Score'] &&
          response.properties['HR Final Score'].rich_text &&
          response.properties['HR Final Score'].rich_text.length > 0) {
        hrScore = parseFloat(response.properties['HR Final Score'].rich_text[0].text.content) || null;
      }

      // Get Technical Final Score
      if (response.properties['Technical Final Score'] &&
          response.properties['Technical Final Score'].rich_text &&
          response.properties['Technical Final Score'].rich_text.length > 0) {
        technicalScore = parseFloat(response.properties['Technical Final Score'].rich_text[0].text.content) || null;
      }

      // Get Final Score
      if (response.properties['Final Score'] &&
          response.properties['Final Score'].rich_text &&
          response.properties['Final Score'].rich_text.length > 0) {
        finalScore = parseFloat(response.properties['Final Score'].rich_text[0].text.content) || null;
      }
    }

    // Update the current interview score
    if (currentInterviewType === 'hr') {
      hrScore = currentScore;
    } else if (currentInterviewType === 'technical') {
      technicalScore = currentScore;
    } else if (currentInterviewType === 'final') {
      finalScore = currentScore;
    }

    // Calculate total score based on available interviews
    const availableScores = [];
    let scoreDetails = [];

    if (hrScore !== null) {
      availableScores.push(hrScore);
      scoreDetails.push(`HR(${hrScore})`);
    }
    if (technicalScore !== null) {
      availableScores.push(technicalScore);
      scoreDetails.push(`Technical(${technicalScore})`);
    }
    if (finalScore !== null) {
      availableScores.push(finalScore);
      scoreDetails.push(`Final(${finalScore})`);
    }

    if (availableScores.length > 0) {
      // Calculate average of available scores
      const totalAverage = Math.round((availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length) * 100) / 100;

      // Save total average to Total Score field
      updateData['Total Score'] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: totalAverage.toString()
            }
          }
        ]
      };

      console.log(`Total score calculation: ${scoreDetails.join(' + ')} = ${totalAverage} (${availableScores.length} interview${availableScores.length > 1 ? 's' : ''})`);
    } else {
      console.warn('No interview scores available for total calculation');
    }

  } catch (error) {
    console.error('Error calculating total score:', error);
    console.warn('Warning: Could not calculate total score. Individual interview score saved only.');
  }
}

  // Debug logging
  console.log(`Attempting to update ${interviewType} interview for application ${applicationId}`);
  console.log(`Property field: ${mapping.interviewField}`);
  console.log(`Update data:`, JSON.stringify(updateData, null, 2));

  // Update the record in Notion
  await updateApplicationInNotion(applicationId, updateData);

  console.log(`Successfully updated ${interviewType} interview for application ${applicationId} with score ${averageScore}`);

  // Prepare return data with additional score information
  const returnData = {
    applicationId,
    interviewType,
    final_score: averageScore,
    submittedData: finalInterviewData,
    updatedAt: new Date().toISOString()
  };

  // Add total score info for all interview types
  if (updateData['Total Score']) {
    try {
      const totalScore = parseFloat(updateData['Total Score'].rich_text[0].text.content);
      returnData.total_average_score = totalScore;
    } catch (error) {
      console.error('Error parsing total score for return:', error);
    }
  }

  return {
    success: true,
    message: `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview submitted successfully`,
    data: returnData
  };
}

module.exports = {
  submitInterviewData,
  calculateAverageScore,
  updateApplicationInNotion
};




