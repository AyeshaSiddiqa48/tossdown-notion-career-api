const { Client } = require('@notionhq/client');
const { updateApplicationInNotion } = require('../../utils/interviewService');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

// This API only updates question text, not scores

// Function to get current interview data from Notion
async function getCurrentInterviewData(applicationId, interviewType) {
  try {
    console.log(`Retrieving page data for application: ${applicationId}`);
    const response = await notion.pages.retrieve({ page_id: applicationId });

    const propertyMapping = {
      'hr': 'HR Interview',
      'technical': 'Technical Interview',
      'final': 'Final Interview'
    };

    const propertyName = propertyMapping[interviewType.toLowerCase()];
    console.log(`Looking for property: ${propertyName}`);

    const property = response.properties[propertyName];

    if (property && property.rich_text && property.rich_text.length > 0) {
      const content = property.rich_text[0].text.content;
      console.log(`Found content length: ${content ? content.length : 0}`);

      if (content && content.trim()) {
        try {
          const parsedData = JSON.parse(content);
          console.log('Successfully parsed interview data');
          return parsedData;
        } catch (parseError) {
          console.error('Error parsing interview data JSON:', parseError);
          console.error('Content that failed to parse:', content.substring(0, 200) + '...');
          return null;
        }
      } else {
        console.log('Property exists but content is empty');
        return null;
      }
    } else {
      console.log(`Property ${propertyName} not found or has no content`);
      return null;
    }

  } catch (error) {
    console.error('Error retrieving current interview data:', error);
    console.error('Error details:', error.message);

    // If it's a 404 error, the page doesn't exist
    if (error.status === 404) {
      console.error('Application page not found in Notion database');
    }

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
        message: `No existing ${interviewType} interview data found for this application. Please submit the interview first using POST /api/applications/interview, then update questions.`,
        hint: "Use the interview submission API first to create the interview data, then use this API to update questions."
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
