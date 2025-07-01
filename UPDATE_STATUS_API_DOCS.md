# Update Application Status API Documentation

## Overview
This API allows you to update the status of job applications in your Notion database. It's designed as a serverless function for Vercel deployment and supports various application statuses throughout the hiring process.

## Endpoint Details

### **Vercel Production URL**
```
PUT https://your-vercel-app.vercel.app/api/applications/update-status
```

### **Local Development URL**
```
PUT http://localhost:3000/api/applications/update-status
```

## Request Format

### **HTTP Method**
`PUT` or `PATCH`

### **Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Request Body**
```json
{
  "applicationId": "string (required) - Notion page ID",
  "status": "string (required) - New status value"
}
```

## Valid Status Values

The API accepts the following status values:

- `Applied`
- `Under Review`
- `HR Interview Scheduled`
- `HR Interview Completed`
- `Technical Interview Scheduled`
- `Technical Interview Completed`
- `Final Interview Scheduled`
- `Final Interview Completed`
- `Offer Extended`
- `Hired`
- `Rejected`
- `Withdrawn`

## Example Requests

### **Basic Status Update**
```json
{
  "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
  "status": "HR Interview Completed"
}
```

### **Moving to Technical Interview**
```json
{
  "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
  "status": "Technical Interview Scheduled"
}
```

### **Final Hiring Decision**
```json
{
  "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
  "status": "Hired"
}
```

## Response Format

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
    "status": "HR Interview Completed",
    "updatedAt": "2025-07-01T10:30:45.123Z",
    "notionResponse": {
      "id": "22321223-e79e-811d-aeff-ddf2dd9b581f",
      "lastEditedTime": "2025-07-01T10:30:45.000Z"
    }
  }
}
```

### **Error Response (400/500)**
```json
{
  "success": false,
  "message": "Server error while updating application status",
  "error": "Invalid status. Must be one of: Applied, Under Review, HR Interview Scheduled, ..."
}
```

## Frontend Integration Examples

### **React/Next.js with fetch**
```javascript
async function updateApplicationStatus(applicationId, status) {
  try {
    const response = await fetch('/api/applications/update-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId,
        status
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Status updated successfully:', result.data);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Usage
updateApplicationStatus('22321223-e79e-811d-aeff-ddf2dd9b581f', 'Hired');
```

### **React Component Example**
```jsx
import { useState } from 'react';

function StatusUpdater({ applicationId, currentStatus }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    'Applied',
    'Under Review',
    'HR Interview Scheduled',
    'HR Interview Completed',
    'Technical Interview Scheduled',
    'Technical Interview Completed',
    'Final Interview Scheduled',
    'Final Interview Completed',
    'Offer Extended',
    'Hired',
    'Rejected',
    'Withdrawn'
  ];

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/applications/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus(newStatus);
        alert('Status updated successfully!');
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Current Status: {status}</h3>
      <select 
        value={status} 
        onChange={(e) => handleStatusUpdate(e.target.value)}
        disabled={loading}
      >
        {statusOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {loading && <p>Updating...</p>}
    </div>
  );
}
```

### **Axios Example**
```javascript
import axios from 'axios';

async function updateStatus(applicationId, status) {
  try {
    const response = await axios.put('/api/applications/update-status', {
      applicationId,
      status
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

### **cURL Example**
```bash
curl -X PUT https://your-vercel-app.vercel.app/api/applications/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
    "status": "Hired"
  }'
```

## Error Handling

### **Common Error Cases**

1. **Missing Fields (400)**
   ```json
   {
     "success": false,
     "message": "Server error while updating application status",
     "error": "Missing required fields: applicationId and status are required"
   }
   ```

2. **Invalid Status (400)**
   ```json
   {
     "success": false,
     "message": "Server error while updating application status", 
     "error": "Invalid status. Must be one of: Applied, Under Review, ..."
   }
   ```

3. **Invalid Application ID (400)**
   ```json
   {
     "success": false,
     "message": "Server error while updating application status",
     "error": "path failed validation: path.page_id should be a valid uuid"
   }
   ```

4. **Method Not Allowed (405)**
   ```json
   {
     "success": false,
     "message": "Method not allowed. Use PUT or PATCH."
   }
   ```

## Notion Database Updates

The API updates the following fields in your Notion database:

| Field | Type | Description |
|-------|------|-------------|
| `Applicant Status` | Rich Text | The application status as text content |

## Deployment Notes

1. **Environment Variables**: Ensure `NOTION_TOKEN` and `APPLICATION_DATABASE_ID` are set in your Vercel environment
2. **CORS**: The API includes CORS headers for cross-origin requests
3. **Error Handling**: Includes fallback to axios if the Notion client fails
4. **Validation**: Validates both required fields and status values

## Testing

Use the provided test script to verify the API:
```bash
node test-update-status.js
```

This will test various scenarios including valid updates, invalid statuses, and missing fields.
