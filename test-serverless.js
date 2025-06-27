// Test the serverless interview function directly
const interviewHandler = require('./api/applications/interview.js');

// Mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd",
    interviewType: "hr",
    interviewData: {
      questions: [
        {
          question: "Tell me about yourself",
          score: 4,
          maxScore: 5,
          notes: "Good communication"
        },
        {
          question: "Why work here?",
          score: 3,
          maxScore: 5,
          notes: "Average response"
        }
      ],
      comments: "Good candidate for next round",
      interviewer: "John Doe",
      duration: "30 minutes"
    }
  }
};

const mockRes = {
  headers: {},
  statusCode: 200,
  responseData: null,
  
  setHeader: function(name, value) {
    this.headers[name] = value;
  },
  
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  
  json: function(data) {
    this.responseData = data;
    console.log('Response Status:', this.statusCode);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return this;
  },
  
  end: function() {
    console.log('Response ended');
    return this;
  }
};

// Test the function
async function testInterviewAPI() {
  console.log('Testing serverless interview function...\n');
  
  try {
    await interviewHandler(mockReq, mockRes);
    
    if (mockRes.statusCode === 200) {
      console.log('✅ Test passed! Interview submitted successfully.');
    } else {
      console.log('❌ Test failed with status:', mockRes.statusCode);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testInterviewAPI();
