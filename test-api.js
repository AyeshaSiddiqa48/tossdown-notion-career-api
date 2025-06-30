// Simple test for the Interview API
// Works with both local development and Vercel production

const API_URL = 'http://localhost:3000/api/applications/interview';
// For production: 'https://your-vercel-app.vercel.app/api/applications/interview'

// Test payloads
const testPayloads = {
  hr: {
    applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd",
    interviewType: "hr",
    interviewData: {
      questions: [
        { question: "Tell me about yourself", score: 4, maxScore: 5, notes: "Good communication" },
        { question: "Why this company?", score: 3, maxScore: 5, notes: "Average response" }
      ],
      comments: "Recommended for technical round",
      interviewer: "HR Manager",
      duration: "30 minutes"
    }
  },
  
  technical: {
    applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd",
    interviewType: "technical",
    interviewData: {
      questions: [
        { question: "JavaScript closures", score: 4, maxScore: 5, notes: "Good understanding" },
        { question: "System design", score: 3, maxScore: 5, notes: "Needs improvement" }
      ],
      comments: "Strong technical skills",
      interviewer: "Tech Lead",
      duration: "45 minutes",
      codingTest: "Passed"
    }
  },
  
  final: {
    applicationId: "21f21223-e79e-81ce-b52e-d2b143d790cd",
    interviewType: "final",
    interviewData: {
      questions: [
        { question: "Work pressure handling", score: 5, maxScore: 5, notes: "Excellent" },
        { question: "Salary expectations", score: 4, maxScore: 5, notes: "Reasonable" }
      ],
      comments: "Strong candidate, hire recommended",
      interviewer: "CEO",
      duration: "20 minutes",
      decision: "Hire"
    }
  }
};

// Test function
async function testInterview(type) {
  console.log(`\n🧪 Testing ${type.toUpperCase()} Interview...`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayloads[type])
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${type.toUpperCase()} Interview Success!`);
      console.log(`📊 Average Score: ${result.data.averageScore}`);
      console.log(`📝 Message: ${result.message}`);
    } else {
      console.log(`❌ ${type.toUpperCase()} Interview Failed:`, result.message);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ ${type.toUpperCase()} Interview Error:`, error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Interview API Tests...');
  
  await testInterview('hr');
  await testInterview('technical');
  await testInterview('final');
  
  console.log('\n🎉 All tests completed!');
}

// Uncomment to run tests
// runAllTests();

module.exports = { testInterview, testPayloads };
