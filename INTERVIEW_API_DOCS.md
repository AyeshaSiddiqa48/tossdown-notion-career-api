# Interview Submission API Documentation

## Overview
This API allows you to submit interview results for job applications. It supports three types of interviews: HR, Technical, and Final interviews. The API calculates average scores automatically and stores the complete interview data in your Notion database.

## Base URL
- **Local Development**: `http://localhost:3000/api/applications`
- **Vercel Production**: `https://your-vercel-app.vercel.app/api/applications`

## Endpoints

### 1. Submit Interview Results
**POST** `/interview`

Submit interview results for a specific application and interview type.

#### Request Body
```json
{
  "applicationId": "string (required) - Notion page ID",
  "interviewType": "string (required) - hr|technical|final",
  "interviewData": {
    "questions": [
      {
        "question": "string - The interview question",
        "score": "number - Score given (0-5 scale)",
        "maxScore": "number - Maximum possible score (default: 5)",
        "notes": "string - Additional notes"
      }
    ],
    "comments": "string - Overall interview comments",
    "interviewer": "string - Interviewer name",
    "duration": "string - Interview duration",
    "any_other_field": "any_value - You can add any custom fields"
  }
}
```

#### Example Requests

**HR Interview:**
```json
{
  "applicationId": "21f21223-e79e-81ce-b52e-d2b143d790cd",
  "interviewType": "hr",
  "interviewData": {
    "questions": [
      {
        "question": "Tell me about yourself",
        "score": 4,
        "maxScore": 5,
        "notes": "Good communication skills"
      },
      {
        "question": "Why do you want to work here?",
        "score": 3,
        "maxScore": 5,
        "notes": "Average response"
      }
    ],
    "comments": "Candidate showed good communication skills. Recommended for technical round.",
    "interviewer": "John Doe",
    "duration": "30 minutes"
  }
}
```

**Technical Interview:**
```json
{
  "applicationId": "21f21223-e79e-81ce-b52e-d2b143d790cd",
  "interviewType": "technical",
  "interviewData": {
    "questions": [
      {
        "question": "Explain JavaScript closures",
        "score": 4,
        "maxScore": 5,
        "notes": "Good understanding"
      },
      {
        "question": "Design a REST API",
        "score": 3,
        "maxScore": 5,
        "notes": "Basic knowledge"
      }
    ],
    "comments": "Strong technical skills, needs improvement in system design",
    "interviewer": "Jane Smith",
    "duration": "45 minutes",
    "codingTest": "Passed",
    "technicalRating": "Good"
  }
}
```

**Final Interview:**
```json
{
  "applicationId": "21f21223-e79e-81ce-b52e-d2b143d790cd",
  "interviewType": "final",
  "interviewData": {
    "questions": [
      {
        "question": "How do you handle work pressure?",
        "score": 4,
        "maxScore": 5,
        "notes": "Good stress management"
      },
      {
        "question": "Salary expectations?",
        "score": 3,
        "maxScore": 5,
        "notes": "Reasonable expectations"
      }
    ],
    "comments": "Strong candidate, good cultural fit",
    "interviewer": "CEO",
    "duration": "20 minutes",
    "decision": "Hire",
    "startDate": "2025-07-01"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Hr interview submitted successfully",
  "data": {
    "applicationId": "21f21223-e79e-81ce-b52e-d2b143d790cd",
    "interviewType": "hr",
    "averageScore": 3.5,
    "submittedData": {
      "questions": [...],
      "comments": "Candidate showed good communication skills...",
      "interviewer": "John Doe",
      "duration": "30 minutes",
      "averageScore": 3.5,
      "submittedAt": "2025-06-27T10:30:00.000Z"
    },
    "updatedAt": "2025-06-27T10:30:00.000Z"
  }
}
```

## Interview Types

### 1. HR Interview (`"hr"`)
- Updates: `HR Interview Score`, `HR Interview Comments`, `HR Interview Questions`
- Focus: Communication, cultural fit, basic qualifications

### 2. Technical Interview (`"technical"`)
- Updates: `Technical Interview Score`, `Technical Interview Comments`, `Technical Interview Questions`
- Focus: Technical skills, problem-solving, coding abilities

### 3. Final Interview (`"final"`)
- Updates: `Final Interview Score`, `Final Interview Comments`, `Final Interview Questions`
- Focus: Final assessment, salary discussion, decision making

## Score Calculation

The API automatically calculates the average score from all questions:

1. **Normalization**: All scores are normalized to a 5-point scale
   - If `maxScore` is 10 and `score` is 8, normalized score = (8/10) * 5 = 4
2. **Average**: Sum of all normalized scores divided by number of questions
3. **Rounding**: Result is rounded to 2 decimal places

### Example:
```
Question 1: 4/5 = 4.0
Question 2: 3/5 = 3.0  
Question 3: 8/10 = 4.0 (normalized)
Average: (4.0 + 3.0 + 4.0) / 3 = 3.67
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: applicationId, interviewType, and questions are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error while submitting interview",
  "error": "Detailed error message"
}
```

## Frontend Integration Examples

### React.js Example
```javascript
import { useState } from 'react';

const InterviewForm = ({ applicationId }) => {
  const [interviewType, setInterviewType] = useState('hr');
  const [questions, setQuestions] = useState([
    { question: '', score: 0, maxScore: 5, notes: '' }
  ]);
  const [comments, setComments] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [loading, setLoading] = useState(false);

  const submitInterview = async () => {
    setLoading(true);

    const payload = {
      applicationId,
      interviewType,
      interviewData: {
        questions,
        comments,
        interviewer,
        duration: '30 minutes',
        submittedBy: 'HR Team'
      }
    };

    try {
      const response = await fetch('/api/applications/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert('Interview submitted successfully!');
        console.log('Average Score:', result.data.averageScore);
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
      <h2>Submit Interview</h2>

      <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
        <option value="hr">HR Interview</option>
        <option value="technical">Technical Interview</option>
        <option value="final">Final Interview</option>
      </select>

      {questions.map((q, index) => (
        <div key={index}>
          <input
            placeholder="Question"
            value={q.question}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[index].question = e.target.value;
              setQuestions(newQuestions);
            }}
          />
          <input
            type="number"
            min="0"
            max="5"
            placeholder="Score (0-5)"
            value={q.score}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[index].score = parseInt(e.target.value);
              setQuestions(newQuestions);
            }}
          />
          <input
            placeholder="Notes"
            value={q.notes}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[index].notes = e.target.value;
              setQuestions(newQuestions);
            }}
          />
        </div>
      ))}

      <button onClick={() => setQuestions([...questions, { question: '', score: 0, maxScore: 5, notes: '' }])}>
        Add Question
      </button>

      <textarea
        placeholder="Overall Comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <input
        placeholder="Interviewer Name"
        value={interviewer}
        onChange={(e) => setInterviewer(e.target.value)}
      />

      <button onClick={submitInterview} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Interview'}
      </button>
    </div>
  );
};

export default InterviewForm;
```

### Next.js API Route Example
```javascript
// pages/api/submit-interview.js or app/api/submit-interview/route.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { applicationId, interviewType, interviewData } = req.body;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId,
        interviewType,
        interviewData
      })
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit interview' });
  }
}
```

### Vanilla JavaScript Example
```javascript
async function submitInterview(applicationId, interviewType, interviewData) {
  const payload = {
    applicationId,
    interviewType,
    interviewData
  };

  try {
    const response = await fetch('https://your-vercel-app.vercel.app/api/applications/interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Interview submitted successfully!');
      console.log('Average Score:', result.data.averageScore);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error submitting interview:', error);
    throw error;
  }
}

// Usage
const interviewData = {
  questions: [
    { question: "Tell me about yourself", score: 4, maxScore: 5, notes: "Good response" },
    { question: "Why this company?", score: 3, maxScore: 5, notes: "Average" }
  ],
  comments: "Good candidate",
  interviewer: "John Doe",
  duration: "30 minutes"
};

submitInterview("21f21223-e79e-81ce-b52e-d2b143d790cd", "hr", interviewData);
```

### cURL
```bash
curl -X POST https://your-vercel-app.vercel.app/api/applications/interview \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "21b21223-e79e-81c1-9a80-efa6642f881e",
    "interviewType": "technical",
    "questions": [
      {
        "question": "Explain JavaScript closures",
        "score": 4,
        "maxScore": 5
      }
    ],
    "comments": "Good technical knowledge"
  }'
```

## Notion Database Updates

The API updates the following fields in your Notion database:

| Interview Type | Score Field | Comments Field | Questions Field |
|---------------|-------------|----------------|-----------------|
| HR | HR Interview Score | HR Interview Comments | HR Interview Questions |
| Technical | Technical Interview Score | Technical Interview Comments | Technical Interview Questions |
| Final | Final Interview Score | Final Interview Comments | Final Interview Questions |

## Deployment Notes

1. **Environment Variables**: Ensure `NOTION_TOKEN` and `APPLICATION_DATABASE_ID` are set
2. **CORS**: The API includes CORS support for web applications
3. **Vercel**: The API is ready for Vercel deployment with the existing `vercel.json` configuration
