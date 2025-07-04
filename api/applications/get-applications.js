const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

const applicationDatabaseId = process.env.APPLICATION_DATABASE_ID || '1d921223-e79e-8164-8cd4-fa013f4dd093';

// Function to get total count of applications in the database
async function getTotalApplicationsCount() {
  try {
    let totalCount = 0;
    let hasMore = true;
    let startCursor = undefined;

    // Keep fetching pages to count all records
    while (hasMore) {
      const queryParams = {
        database_id: applicationDatabaseId,
        page_size: 100 // Use maximum page size for efficiency
      };

      if (startCursor) {
        queryParams.start_cursor = startCursor;
      }

      const response = await notion.databases.query(queryParams);

      if (response && response.results) {
        totalCount += response.results.length;
        hasMore = response.has_more;
        startCursor = response.next_cursor;
      } else {
        throw new Error('Failed to fetch records for counting');
      }
    }

    console.log(`Total applications count: ${totalCount}`);
    return totalCount;

  } catch (error) {
    console.error('Error getting total count:', error);

    // Fallback to axios
    try {
      let totalCount = 0;
      let hasMore = true;
      let startCursor = undefined;

      const url = `https://api.notion.com/v1/databases/${applicationDatabaseId}/query`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      while (hasMore) {
        const requestBody = {
          page_size: 100
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await axios.post(url, requestBody, { headers });

        if (response.data && response.data.results) {
          totalCount += response.data.results.length;
          hasMore = response.data.has_more;
          startCursor = response.data.next_cursor;
        } else {
          throw new Error('Axios fallback failed for counting');
        }
      }

      console.log(`Total applications count (axios): ${totalCount}`);
      return totalCount;

    } catch (axiosError) {
      console.error('Axios fallback error for counting:', axiosError);
      return null; // Return null if count fails
    }
  }
}

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

// Function to get all application records (for single record lookup)
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
    console.error('Error in getAllApplicationsRecordsFromNotion:', error);
    return { error: 'Failed to retrieve application records' };
  }
}

// Main serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Get query parameters
    const requestedId = req.query.id || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || null;

    console.log('=== Get Applications API Debug ===');
    console.log('Requested ID:', requestedId);
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('Cursor:', cursor);

    // Validate limit (max 100 as per Notion API)
    if (limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 100 records per page'
      });
    }

    // If an ID is present, get single record (no pagination needed)
    if (requestedId) {
      const allRecords = await getAllApplicationsRecordsFromNotion();
      
      if (allRecords.error) {
        return res.status(500).json({ success: false, message: allRecords.error });
      }

      const record = allRecords.find(record => record.id === requestedId);

      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: 'Record not found' 
        });
      }

      return res.json({
        success: true,
        data: record
      });
    }

    // Get paginated records
    const pageData = await getApplicationsRecordsFromNotion(limit, cursor);

    if (pageData.error) {
      return res.status(500).json({ success: false, message: pageData.error });
    }

    // Get total count (only for first page to avoid unnecessary API calls)
    let totalCount = null;
    if (!cursor) {
      console.log('Getting total count for first page...');
      totalCount = await getTotalApplicationsCount();
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
        total_in_page: pageData.total_fetched,
        total_count: totalCount // Include total count (null for subsequent pages)
      }
    };

    console.log(`Returning ${pageData.total_fetched} records for page ${page}${totalCount ? `, total: ${totalCount}` : ''}`);
    res.json(response);

  } catch (error) {
    console.error('Error in get-applications API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching applications',
      error: error.message 
    });
  }
};
