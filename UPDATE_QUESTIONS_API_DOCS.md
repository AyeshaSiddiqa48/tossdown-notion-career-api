# Update Questions API Documentation

## Overview
This API allows you to update only the question text for existing interview data. It preserves all scores, comments, interviewer, duration, and other metadata. Only the question text is updated.

## Base URL
- **Vercel Production**: `https://your-vercel-app.vercel.app/api/applications/update-questions`

## Endpoint

### Update Interview Questions
**PUT** `/api/applications/update-questions`

Updates only the question text for an existing interview while preserving all scores, comments, and other data.

#### Request Body
```json
{
  "applicationId": "string (required) - Notion page ID",
  "interviewType": "string (required) - hr|technical|final",
  "questions": [
    "string - Just the question text"
  ]
}
```

**OR with object format:**
```json
{
  "applicationId": "string (required) - Notion page ID",
  "interviewType": "string (required) - hr|technical|final",
  "questions": [
    {
      "question": "string - The interview question text"
    }
  ]
}
```

#### Example Requests

**Update HR Interview Questions (Simple Format):**
```json
{
  "applicationId": "21f21223-e79e-816e-acca-e8b283bfbf9a",
  "interviewType": "hr",
  "questions": [
    "Tell me about yourself and your background",
    "Why do you want to work at our company?",
    "What are your greatest strengths and weaknesses?"
  ]
}
```

**Update Technical Interview Questions (Object Format):**
```json
{
  "applicationId": "21f21223-e79e-816e-acca-e8b283bfbf9a",
  "interviewType": "technical",
  "questions": [
    {
      "question": "Explain JavaScript closures and provide an example"
    },
    {
      "question": "Design a REST API for user management system"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Hr interview questions updated successfully",
  "data": {
    "applicationId": "21f21223-e79e-816e-acca-e8b283bfbf9a",
    "interviewType": "hr",
    "questionsCount": 3,
    "originalScore": 2.8,
    "updatedData": {
      "questions": [
        {
          "question": "Tell me about yourself and your background",
          "score": 4,
          "maxScore": 5,
          "notes": "Good communication skills"
        }
      ],
      "result": {
        "comments": "Original comments preserved",
        "final_score": 2.8,
        "submittedAt": "2025-06-27T12:41:52.219Z",
        "updatedAt": "2025-06-27T14:30:00.000Z",
        "interviewer": "Original interviewer preserved",
        "duration": "Original duration preserved"
      }
    },
    "updatedAt": "2025-06-27T14:30:00.000Z"
  }
}
```

#### Error Responses

**Missing Required Fields:**
```json
{
  "success": false,
  "message": "Missing required fields: applicationId, interviewType, and questions are required"
}
```

**Invalid Interview Type:**
```json
{
  "success": false,
  "message": "Invalid interview type. Must be one of: hr, technical, final"
}
```

**No Existing Interview Data:**
```json
{
  "success": false,
  "message": "No existing hr interview data found for this application"
}
```

## Frontend Integration Examples

### React.js Example
```javascript
import { useState } from 'react';

const UpdateQuestionsForm = ({ applicationId, interviewType, currentQuestions }) => {
  const [questions, setQuestions] = useState(currentQuestions || []);
  const [loading, setLoading] = useState(false);

  const updateQuestions = async () => {
    setLoading(true);
    
    const payload = {
      applicationId,
      interviewType,
      questions
    };

    try {
      const response = await fetch('/api/applications/update-questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Questions updated successfully!');
        console.log('New Average Score:', result.data.newAverageScore);
        console.log('Previous Score:', result.data.previousScore);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionScore = (index, newScore) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].score = parseInt(newScore);
    setQuestions(updatedQuestions);
  };

  return (
    <div>
      <h2>Update {interviewType.toUpperCase()} Interview Questions</h2>
      
      {questions.map((q, index) => (
        <div key={index} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <p><strong>Q{index + 1}:</strong> {q.question}</p>
          <label>
            Score: 
            <input
              type="number"
              min="0"
              max={q.maxScore || 5}
              value={q.score}
              onChange={(e) => updateQuestionScore(index, e.target.value)}
            />
            / {q.maxScore || 5}
          </label>
          {q.notes && <p><em>Notes: {q.notes}</em></p>}
        </div>
      ))}

      <button onClick={updateQuestions} disabled={loading}>
        {loading ? 'Updating...' : 'Update Questions'}
      </button>
    </div>
  );
};

export default UpdateQuestionsForm;
```

### Vanilla JavaScript Example
```javascript
async function updateInterviewQuestions(applicationId, interviewType, questions) {
  const payload = {
    applicationId,
    interviewType,
    questions
  };

  try {
    const response = await fetch('https://your-vercel-app.vercel.app/api/applications/update-questions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Questions updated successfully!');
      console.log('New Average Score:', result.data.newAverageScore);
      console.log('Previous Score:', result.data.previousScore);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error updating questions:', error);
    throw error;
  }
}

// Usage Example
const updatedQuestions = [
  { question: "Tell me about yourself", score: 4, maxScore: 5, notes: "Good response" },
  { question: "Why this company?", score: 3, maxScore: 5, notes: "Average" },
  { question: "Your strengths?", score: 5, maxScore: 5, notes: "Excellent" }
];

updateInterviewQuestions("21f21223-e79e-816e-acca-e8b283bfbf9a", "hr", updatedQuestions);
```

### Custom Hook for React
```javascript
import { useState } from 'react';

const useUpdateQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateQuestions = async (applicationId, interviewType, questions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applications/update-questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          interviewType,
          questions
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateQuestions, loading, error };
};

// Usage in component
const InterviewEditor = ({ applicationId, interviewType }) => {
  const { updateQuestions, loading, error } = useUpdateQuestions();

  const handleUpdate = async (questions) => {
    try {
      const result = await updateQuestions(applicationId, interviewType, questions);
      console.log('Success:', result.data.newAverageScore);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  return (
    <div>
      {/* Your form components */}
      {error && <div style={{color: 'red'}}>Error: {error}</div>}
      <button onClick={() => handleUpdate(questions)} disabled={loading}>
        {loading ? 'Updating...' : 'Update Questions'}
      </button>
    </div>
  );
};
```

## Key Features

- ✅ **Preserves Existing Data**: Only updates questions, keeps comments, interviewer, etc.
- ✅ **Auto Score Calculation**: Automatically recalculates average score
- ✅ **Validation**: Checks if interview data exists before updating
- ✅ **Flexible Questions**: Accept any question format with scores
- ✅ **Vercel Ready**: Serverless function ready for deployment
- ✅ **CORS Enabled**: Ready for frontend integration

## Deployment

1. Deploy to Vercel: `vercel --prod`
2. Set environment variables: `NOTION_TOKEN`, `APPLICATION_DATABASE_ID`
3. Use the API at: `https://your-app.vercel.app/api/applications/update-questions`

## Important Notes

- This API requires existing interview data to update
- Use `PUT` method (not POST)
- Only updates questions array and recalculates final_score
- All other interview metadata is preserved
- Returns both new and previous scores for comparison
