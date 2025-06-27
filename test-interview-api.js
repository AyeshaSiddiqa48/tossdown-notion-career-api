// Test file for Interview API
// This shows examples of how to use the simplified interview submission API

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/applications';

// Example 1: HR Interview Submission
const hrInterviewExample = {
  applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd", // Replace with actual application ID
  interviewType: "hr",
  interviewData: {
    questions: [
      {
        question: "Tell me about yourself",
        score: 4,
        maxScore: 5,
        notes: "Good communication skills"
      },
      {
        question: "Why do you want to work here?",
        score: 3,
        maxScore: 5,
        notes: "Average response"
      },
      {
        question: "What are your strengths?",
        score: 5,
        maxScore: 5,
        notes: "Excellent self-awareness"
      }
    ],
    comments: "Candidate showed good communication skills and enthusiasm. Recommended for technical round.",
    interviewer: "John Doe",
    duration: "30 minutes"
  }
};

// Example 2: Technical Interview Submission
const technicalInterviewExample = {
  applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd", // Replace with actual application ID
  interviewType: "technical",
  interviewData: {
    questions: [
      {
        question: "Explain JavaScript closures",
        score: 4,
        maxScore: 5,
        notes: "Good understanding with minor gaps"
      },
      {
        question: "Design a REST API for user management",
        score: 3,
        maxScore: 5,
        notes: "Basic understanding, needs improvement"
      },
      {
        question: "Write a function to reverse a string",
        score: 5,
        maxScore: 5,
        notes: "Perfect implementation"
      },
      {
        question: "Explain database normalization",
        score: 2,
        maxScore: 5,
        notes: "Limited knowledge"
      }
    ],
    comments: "Candidate has good programming fundamentals but needs to improve system design skills.",
    interviewer: "Jane Smith",
    duration: "45 minutes",
    codingTest: "Passed",
    technicalRating: "Good"
  }
};

// Example 3: Final Interview Submission
const finalInterviewExample = {
  applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd", // Replace with actual application ID
  interviewType: "final",
  interviewData: {
    questions: [
      {
        question: "How do you handle work pressure?",
        score: 4,
        maxScore: 5,
        notes: "Good stress management techniques"
      },
      {
        question: "Where do you see yourself in 5 years?",
        score: 4,
        maxScore: 5,
        notes: "Clear career goals"
      },
      {
        question: "What is your expected salary?",
        score: 3,
        maxScore: 5,
        notes: "Reasonable expectations"
      }
    ],
    comments: "Strong candidate with good cultural fit. Recommended for hiring.",
    interviewer: "CEO",
    duration: "20 minutes",
    decision: "Hire",
    startDate: "2025-07-01"
  }
};

// Function to submit interview
async function submitInterview(interviewData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/interview`, interviewData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Interview submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting interview:', error.response?.data || error.message);
    throw error;
  }
}

// Test function
async function testInterviewAPI() {
  console.log('Testing Interview API...\n');
  
  try {
    // Test HR Interview
    console.log('1. Submitting HR Interview...');
    await submitInterview(hrInterviewExample);
    console.log('✅ HR Interview submitted successfully\n');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test Technical Interview
    console.log('2. Submitting Technical Interview...');
    await submitInterview(technicalInterviewExample);
    console.log('✅ Technical Interview submitted successfully\n');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test Final Interview
    console.log('3. Submitting Final Interview...');
    await submitInterview(finalInterviewExample);
    console.log('✅ Final Interview submitted successfully\n');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment the line below to run the test
// testInterviewAPI();

module.exports = {
  submitInterview,
  hrInterviewExample,
  technicalInterviewExample,
  finalInterviewExample
};
