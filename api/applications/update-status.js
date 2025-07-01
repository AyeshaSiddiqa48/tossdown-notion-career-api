const { Client } = require('@notionhq/client');
const axios = require('axios');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

const applicationDatabaseId = process.env.APPLICATION_DATABASE_ID || '1d921223-e79e-8164-8cd4-fa013f4dd093';

// Function to update application status in Notion
async function updateApplicationStatus(applicationId, status) {
  try {
    // Validate required fields
    if (!applicationId || !status) {
      throw new Error('Missing required fields: applicationId and status are required');
    }

    // Validate status values (you can customize these based on your Notion database)
    // const validStatuses = [
    //   'Applied',
    //   'Under Review', 
    //   'HR Interview Scheduled',
    //   'HR Interview Completed',
    //   'Technical Interview Scheduled', 
    //   'Technical Interview Completed',
    //   'Final Interview Scheduled',
    //   'Final Interview Completed',
    //   'Offer Extended',
    //   'Hired',
    //   'Rejected',
    //   'Withdrawn',
    //   'Applicant Status',
    // ];

    // if (!validStatuses.includes(status)) {
    //   throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    // }

    console.log('=== Update Status Debug ===');
    console.log('Application ID:', applicationId);
    console.log('New Status:', status);

    // Prepare update data for Notion
    const updateData = {
      'Applicant Status': {
        rich_text: [
          {
            type: 'text',
            text: {
              content: status
            }
          }
        ]
      }
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Update the record in Notion using the official client
    const response = await notion.pages.update({
      page_id: applicationId,
      properties: updateData
    });

    console.log('Successfully updated application status');

    return {
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId,
        status,
        updatedAt: new Date().toISOString(),
        notionResponse: {
          id: response.id,
          lastEditedTime: response.last_edited_time
        }
      }
    };

  } catch (error) {
    console.error('Error updating application status:', error);
    console.error('Error details:', error.message);

    // Fallback to axios if Notion client fails
    try {
      console.log('Trying axios fallback...');

      // Re-validate status in fallback to prevent bypassing validation
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const url = `https://api.notion.com/v1/pages/${applicationId}`;
      const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1'}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      };

      const updateData = {
        properties: {
          'Applicant Status': {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: status
                }
              }
            ]
          }
        }
      };

      const response = await axios.patch(url, updateData, { headers });
      
      console.log('Axios fallback successful');
      
      return {
        success: true,
        message: 'Application status updated successfully (via fallback)',
        data: {
          applicationId,
          status,
          updatedAt: new Date().toISOString(),
          notionResponse: response.data
        }
      };

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

// Main serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow PUT and PATCH requests
  if (!['PUT', 'PATCH'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use PUT or PATCH.'
    });
  }

  try {
    // Debug logging
    console.log('=== API Debug ===');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);

    const { applicationId, status } = req.body;

    const result = await updateApplicationStatus(applicationId, status);
    res.json(result);

  } catch (error) {
    console.error('Error in update-status API:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status',
      error: error.message
    });
  }
};
