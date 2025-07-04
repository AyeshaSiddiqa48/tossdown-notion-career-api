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
      let content = property.rich_text[0].text.content;
      console.log(`Found content length: ${content ? content.length : 0}`);

      if (content && content.trim()) {
        try {
          // Clean up content - remove markdown code blocks if present
          content = content.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

          // Handle truncated JSON by trying to fix common issues
          if (content.includes('"resu') && !content.includes('"result"')) {
            // Fix truncated "result" field
            content = content.replace(/,\s*"resu[^"]*$/, '');
            if (!content.includes('"result"')) {
              // Add missing result section
              if (content.endsWith(']')) {
                content += ', "result": {"final_score": "", "comments": ""}';
              }
            }
          }

          // Handle other truncation patterns
          if (content.includes('Unterminated string') || content.endsWith('"')) {
            // Try to close unterminated strings
            const lastQuote = content.lastIndexOf('"');
            if (lastQuote > 0 && content.substring(lastQuote + 1).trim() === '') {
              // String was cut off, close it properly
              content = content.substring(0, lastQuote + 1);
              if (!content.endsWith('}')) {
                content += '}';
              }
            }
          }

          // Ensure proper JSON closure
          let openBraces = (content.match(/{/g) || []).length;
          let closeBraces = (content.match(/}/g) || []).length;
          while (closeBraces < openBraces) {
            content += '}';
            closeBraces++;
          }

          console.log('Content after cleanup (last 100 chars):', content.substring(content.length - 100));

          const parsedData = JSON.parse(content);
          console.log('Successfully parsed interview data');

          // Fix malformed question objects
          if (parsedData.questions) {
            parsedData.questions = parsedData.questions.map(q => {
              if (q.question && typeof q.question === 'object' && q.question.question !== undefined) {
                // Fix malformed structure: {"question": {"question": "text"}} -> {"question": "text"}
                return {
                  ...q,
                  question: q.question.question || ""
                };
              }
              return q;
            });
          }

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
    const updatedQuestions = [];

    // Process all questions from the input
    for (let i = 0; i < questions.length; i++) {
      const newQuestionText = questions[i].question || questions[i]; // Support both object and string format

      if (i < currentData.questions.length) {
        // Update existing question - preserve all data except question text
        updatedQuestions.push({
          ...currentData.questions[i],
          question: newQuestionText
        });
      } else {
        // Add new question with default values
        updatedQuestions.push({
          question: newQuestionText,
          score: currentData.questions[0]?.score || 0, // Use same score format as existing
          maxScore: currentData.questions[0]?.maxScore || 5,
          notes: currentData.questions[0]?.notes || ""
        });
      }
    }

    // If there are fewer new questions than existing ones, keep the remaining with original text
    if (questions.length < currentData.questions.length) {
      for (let i = questions.length; i < currentData.questions.length; i++) {
        updatedQuestions.push(currentData.questions[i]);
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
