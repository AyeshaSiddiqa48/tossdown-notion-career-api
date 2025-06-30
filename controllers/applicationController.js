const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'
});
const applicationDatabaseId =
  process.env.APPLICATION_DATABASE_ID || "1d921223-e79e-8164-8cd4-fa013f4dd093";


// Function to get all application records from Notion with pagination
async function getApplicationsRecordsFromNotion() {
  try {
    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    // Keep fetching pages until we have all records
    while (hasMore) {
      const queryParams = {
        database_id: applicationDatabaseId,
        page_size: 100 // Maximum allowed by Notion API
      };

      // Add start_cursor for pagination (except for first request)
      if (startCursor) {
        queryParams.start_cursor = startCursor;
      }

      const response = await notion.databases.query(queryParams);

      if (response && response.results) {
        allResults = allResults.concat(response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;

        console.log(`Fetched ${response.results.length} records. Total so far: ${allResults.length}`);
      } else {
        return { error: 'Failed to retrieve application records' };
      }
    }

    console.log(`Successfully retrieved all ${allResults.length} application records from Notion`);
    return allResults;

  } catch (error) {
    console.error('Error fetching from Notion:', error);

    // Fallback to using axios if the Notion client fails
    try {
      let allResults = [];
      let hasMore = true;
      let startCursor = undefined;

      while (hasMore) {
        const url = `https://api.notion.com/v1/databases/${applicationDatabaseId}/query`;
        const headers = {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        };

        const requestBody = {
          page_size: 100
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await axios.post(url, requestBody, { headers });

        if (response.data && response.data.results) {
          allResults = allResults.concat(response.data.results);
          hasMore = response.data.has_more;
          startCursor = response.data.next_cursor;

          console.log(`Axios fallback: Fetched ${response.data.results.length} records. Total so far: ${allResults.length}`);
        } else {
          break;
        }
      }

      if (allResults.length > 0) {
        console.log(`Axios fallback: Successfully retrieved all ${allResults.length} application records`);
        return allResults;
      }
    } catch (axiosError) {
      console.error('Axios fallback error:', axiosError);
    }

    return { error: 'Failed to retrieve application records' };
  }
}

// Get applications (all or by ID)
exports.getApplications = async (req, res) => {
  try {
    // Get the 'id' query parameter from the URL
    const requestedId = req.query.id || null;

    const allRecords = await getApplicationsRecordsFromNotion();

    console.log(`Total records retrieved: ${allRecords.length}`);

    if (allRecords.error) {
      return res.status(500).json({ success: false, message: allRecords.error });
    }



    // If an ID is present in the query string, find and return only that record
    if (requestedId) {
      const record = allRecords.find(record => record.id === requestedId);

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      return res.json(record);
    }

    // No specific ID, return all records
    res.json(allRecords);
  } catch (error) {
    console.error('Error in getApplications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



const { submitInterviewData } = require('../utils/interviewService');

// Submit interview results (HR, Technical, or Final)
exports.submitInterview = async (req, res) => {
  try {
    const { applicationId, interviewType, interviewData } = req.body;

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

// Update interview questions only
exports.updateQuestions = async (req, res) => {
  try {
    // Import the serverless function and call it
    const updateQuestionsHandler = require('../api/applications/update-questions.js');
    await updateQuestionsHandler(req, res);
  } catch (error) {
    console.error('Error in updateQuestions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating questions',
      error: error.message
    });
  }
};

