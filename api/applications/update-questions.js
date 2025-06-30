const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

// This API only updates question text, not scores

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

// Function to get current interview data from Notion
async function getCurrentInterviewData(applicationId, interviewType) {
  try {
    const response = await notion.pages.retrieve({ page_id: applicationId });
    
    const propertyMapping = {
      'hr': 'HR Interview',
      'technical': 'Technical Interview',
      'final': 'Final Interview'
    };

    const propertyName = propertyMapping[interviewType.toLowerCase()];
    const property = response.properties[propertyName];

    if (property && property.rich_text && property.rich_text.length > 0) {
      const content = property.rich_text[0].text.content;
      if (content && content.trim()) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error('Error parsing interview data JSON:', parseError);
          console.error('Content that failed to parse:', content);
          return null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error retrieving current interview data:', error);
    return null;
  }
}

// Main serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use PUT.'
    });
  }

  try {
    const { applicationId, interviewType, questions } = req.body;

    // Validate required fields
    if (!applicationId || !interviewType || !questions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicationId, interviewType, and questions are required'
      });
    }

    // Validate interview type
    const validInterviewTypes = ['hr', 'technical', 'final'];
    if (!validInterviewTypes.includes(interviewType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview type. Must be one of: hr, technical, final'
      });
    }

    // Validate questions format
    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Questions must be an array'
      });
    }

    console.log(`Updating questions for ${interviewType} interview - Application: ${applicationId}`);

    // Get current interview data
    console.log(`Fetching current ${interviewType} interview data for application: ${applicationId}`);
    const currentData = await getCurrentInterviewData(applicationId, interviewType);

    if (!currentData) {
      console.log(`No existing ${interviewType} interview data found`);
      return res.status(404).json({
        success: false,
        message: `No existing ${interviewType} interview data found for this application`
      });
    }

    console.log('Current interview data found:', JSON.stringify(currentData, null, 2));

    // Update only the question text, preserve all scores and other data
    const updatedQuestions = currentData.questions.map((currentQuestion, index) => {
      if (index < questions.length) {
        // Update only the question text, keep all other fields (score, maxScore, notes)
        return {
          ...currentQuestion,
          question: questions[index].question || questions[index] // Support both object and string format
        };
      }
      return currentQuestion; // Keep original question if no update provided
    });

    // If new questions are provided beyond existing ones, add them with default scores
    if (questions.length > currentData.questions.length) {
      for (let i = currentData.questions.length; i < questions.length; i++) {
        updatedQuestions.push({
          question: questions[i].question || questions[i],
          score: 0, // Default score for new questions
          maxScore: 5,
          notes: ""
        });
      }
    }

    // Create updated data with only question text changed
    const updatedData = {
      ...currentData,
      questions: updatedQuestions,
      result: {
        ...currentData.result,
        updatedAt: new Date().toISOString()
        // Keep original final_score, comments, and all other result data
      }
    };

    // Prepare update data for Notion
    const propertyMapping = {
      'hr': 'HR Interview',
      'technical': 'Technical Interview', 
      'final': 'Final Interview'
    };

    const propertyName = propertyMapping[interviewType.toLowerCase()];
    const updateData = {
      [propertyName]: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: JSON.stringify(updatedData, null, 2)
            }
          }
        ]
      }
    };

    // Update the record in Notion
    await updateApplicationInNotion(applicationId, updateData);

    console.log(`Successfully updated ${interviewType} questions text for application ${applicationId}`);

    res.json({
      success: true,
      message: `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview questions updated successfully`,
      data: {
        applicationId,
        interviewType,
        questionsCount: updatedQuestions.length,
        originalScore: currentData.result?.final_score || 0, // Score remains unchanged
        updatedData: updatedData,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in updateQuestions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating questions',
      error: error.message
    });
  }
};
