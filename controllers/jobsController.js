const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'
});

const databaseId = process.env.NOTION_DATABASE_ID || '19a21223-e79e-80a3-8049-c04ca8c01f9c';

// Function to get job records from Notion
async function getJobRecordsFromNotion() {
  try {
    // Using the official Notion client
    const response = await notion.databases.query({
      database_id: databaseId
    });
     

    if (response && response.results) {
      return response.results;
    } else {
      return { error: 'Failed to retrieve job records' };
    }
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    
    // Fallback to using axios if the Notion client fails
    try {
      const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      const response = await axios.post(url, {}, { headers });
      
      if (response.data && response.data.results) {
        return response.data.results;
      }
    } catch (axiosError) {
      console.error('Axios fallback error:', axiosError);
    }
    
    return { error: 'Failed to retrieve job records' };
  }
}

// Get jobs (all or by ID)
exports.getJobs = async (req, res) => {
  try {
    // Get the 'id' query parameter from the URL
    const requestedId = req.query.id || null;
    
    const allRecords = await getJobRecordsFromNotion();
    
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
    console.error('Error in getJobs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

