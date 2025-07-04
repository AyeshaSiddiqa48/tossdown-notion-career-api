const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'
});
const applicationDatabaseId =
  process.env.APPLICATION_DATABASE_ID || "1d921223-e79e-8164-8cd4-fa013f4dd093";


// Function to get paginated application records from Notion
async function getApplicationsRecordsFromNotion(pageSize = 20, startCursor = null) {
  try {
    const queryParams = {
      database_id: applicationDatabaseId,
      page_size: pageSize
    };

    // Add start_cursor for pagination (if provided)
    if (startCursor) {
      queryParams.start_cursor = startCursor;
    }

    console.log('Query params:', queryParams);

    const response = await notion.databases.query(queryParams);

    if (response && response.results) {
      console.log(`Fetched ${response.results.length} records. Has more: ${response.has_more}`);

      return {
        results: response.results,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
        total_fetched: response.results.length
      };
    } else {
      return { error: 'Failed to retrieve application records' };
    }

  } catch (error) {
    console.error('Error fetching from Notion:', error);

    // Fallback to using axios if the Notion client fails
    try {
      const url = `https://api.notion.com/v1/databases/${applicationDatabaseId}/query`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      const requestBody = {
        page_size: pageSize
      };

      if (startCursor) {
        requestBody.start_cursor = startCursor;
      }

      const response = await axios.post(url, requestBody, { headers });

      if (response.data && response.data.results) {
        console.log(`Axios fallback: Fetched ${response.data.results.length} records. Has more: ${response.data.has_more}`);

        return {
          results: response.data.results,
          has_more: response.data.has_more,
          next_cursor: response.data.next_cursor,
          total_fetched: response.data.results.length
        };
      }
    } catch (axiosError) {
      console.error('Axios fallback error:', axiosError);
    }

    return { error: 'Failed to retrieve application records' };
  }
}

// Function to get all application records (for backward compatibility)
async function getAllApplicationsRecordsFromNotion() {
  try {
    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    // Keep fetching pages until we have all records
    while (hasMore) {
      const pageData = await getApplicationsRecordsFromNotion(100, startCursor);

      if (pageData.error) {
        return pageData;
      }

      allResults = allResults.concat(pageData.results);
      hasMore = pageData.has_more;
      startCursor = pageData.next_cursor;
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

// Get applications with pagination support
exports.getApplications = async (req, res) => {
  try {
    // Get query parameters
    const requestedId = req.query.id || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || null;

    console.log('=== Get Applications Debug ===');
    console.log('Requested ID:', requestedId);
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('Cursor:', cursor);

    // If an ID is present, get single record (no pagination needed)
    if (requestedId) {
      const allRecords = await getAllApplicationsRecordsFromNotion();

      if (allRecords.error) {
        return res.status(500).json({ success: false, message: allRecords.error });
      }

      const record = allRecords.find(record => record.id === requestedId);

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      return res.json(record);
    }

    // Get paginated records
    const pageData = await getApplicationsRecordsFromNotion(limit, cursor);

    if (pageData.error) {
      return res.status(500).json({ success: false, message: pageData.error });
    }

    // Prepare pagination response
    const response = {
      success: true,
      data: pageData.results,
      pagination: {
        current_page: page,
        page_size: limit,
        has_more: pageData.has_more,
        next_cursor: pageData.next_cursor,
        total_in_page: pageData.total_fetched
      }
    };

    console.log(`Returning ${pageData.total_fetched} records for page ${page}`);
    res.json(response);

  } catch (error) {
    console.error('Error in getApplications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



const { submitInterviewData } = require('../utils/interviewService');

// Submit interview results (HR, Technical, or Final)
exports.submitInterview = async (req, res) => {
  try {
    // Debug logging
    console.log('=== Controller Debug ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');

    const { applicationId, interviewType, interviewData } = req.body;

    console.log('Extracted values:');
    console.log('- applicationId:', applicationId, '(type:', typeof applicationId, ')');
    console.log('- interviewType:', interviewType, '(type:', typeof interviewType, ')');
    console.log('- interviewData:', !!interviewData, '(type:', typeof interviewData, ')');

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

// Update application status
exports.updateStatus = async (req, res) => {
  try {
    // Import the serverless function and call it
    const updateStatusHandler = require('../api/applications/update-status.js');
    await updateStatusHandler(req, res);
  } catch (error) {
    console.error('Error in updateStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: error.message
    });
  }
};

// Get applications with pagination (serverless endpoint)
exports.getApplicationsPaginated = async (req, res) => {
  try {
    // Import the serverless function and call it
    const getApplicationsHandler = require('../api/applications/get-applications.js');
    await getApplicationsHandler(req, res);
  } catch (error) {
    console.error('Error in getApplicationsPaginated:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications',
      error: error.message
    });
  }
};

