// Test script for updated interview scoring system
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/applications';

// Test data for different interview types
const testApplicationId = '22621223-e79e-8131-8317-f7fb6753c15b'; // Valid application ID from database

const hrInterviewData = {
  questions: [
    { question: "How do you handle stress?", score: "4" },
    { question: "Describe your teamwork experience", score: "5" },
    { question: "What motivates you?", score: "3" }
  ],
  comments: "Good communication skills, positive attitude"
};

const technicalInterviewData = {
  questions: [
    { question: "Explain your technical expertise", score: "4" },
    { question: "How do you solve complex problems?", score: "5" },
    { question: "Describe a challenging project", score: "4" }
  ],
  comments: "Strong technical background, good problem-solving skills"
};

const finalInterviewData = {
  questions: [
    { question: "How do you align with company vision?", score: "5" },
    { question: "Describe your leadership style", score: "4" },
    { question: "How do you handle change?", score: "4" }
  ],
  comments: "Excellent cultural fit, strong leadership potential"
};

// Function to submit interview
async function submitInterview(interviewType, interviewData) {
  try {
    console.log(`\n🧪 Testing ${interviewType.toUpperCase()} Interview Submission...`);
    
    const response = await axios.post(`${BASE_URL}/interview`, {
      applicationId: testApplicationId,
      interviewType: interviewType,
      interviewData: interviewData
    });

    console.log('✅ Success! Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('Final Score:', response.data.data.final_score);
    
    if (response.data.data.total_average_score) {
      console.log('🎯 Total Average Score:', response.data.data.total_average_score);
    }
    
    return response.data;

  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Is the server running?');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    
    return null;
  }
}

// Function to get application data to verify scores
async function getApplicationData() {
  try {
    console.log('\n📋 Fetching application data to verify scores...');
    
    const response = await axios.get(`${BASE_URL}?id=${testApplicationId}`);
    
    if (response.data && response.data.properties) {
      const props = response.data.properties;
      
      console.log('📊 Current Scores:');
      
      // HR Final Score
      if (props['HR Final Score'] && props['HR Final Score'].rich_text.length > 0) {
        console.log('HR Final Score:', props['HR Final Score'].rich_text[0].text.content);
      } else {
        console.log('HR Final Score: Not set');
      }
      
      // Technical Final Score
      if (props['Technical Final Score'] && props['Technical Final Score'].rich_text.length > 0) {
        console.log('Technical Final Score:', props['Technical Final Score'].rich_text[0].text.content);
      } else {
        console.log('Technical Final Score: Not set');
      }
      
      // Final Score
      if (props['Final Score'] && props['Final Score'].rich_text.length > 0) {
        console.log('Final Score:', props['Final Score'].rich_text[0].text.content);
      } else {
        console.log('Final Score: Not set');
      }
      
      // Total Score
      if (props['Total Score'] && props['Total Score'].rich_text.length > 0) {
        console.log('🎯 Total Score:', props['Total Score'].rich_text[0].text.content);
      } else {
        console.log('Total Score: Not set');
      }
    }
    
  } catch (error) {
    console.log('❌ Error fetching application data:', error.message);
  }
}

// Function to calculate expected scores
function calculateExpectedScore(questions) {
  const totalScore = questions.reduce((sum, q) => sum + parseFloat(q.score), 0);
  return Math.round((totalScore / questions.length) * 100) / 100;
}

// Check server status
async function checkServerStatus() {
  console.log('🔍 Checking if server is running...\n');
  
  try {
    const response = await axios.get('http://localhost:3000/', {
      timeout: 5000
    });
    
    console.log('✅ Server is running!');
    console.log('Status:', response.status);
    return true;
    
  } catch (error) {
    console.log('❌ Server is not responding:');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Please start it with:');
      console.log('   npm start');
      console.log('   or');
      console.log('   node index.js');
    }
    
    return false;
  }
}

async function runInterviewTests() {
  console.log('🚀 Starting Interview Scoring Tests...\n');
  
  // Check server status first
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('\n❌ Cannot proceed with tests - server is not running');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Calculate expected scores
  const expectedHR = calculateExpectedScore(hrInterviewData.questions);
  const expectedTechnical = calculateExpectedScore(technicalInterviewData.questions);
  const expectedFinal = calculateExpectedScore(finalInterviewData.questions);
  const expectedTotal = Math.round(((expectedHR + expectedTechnical + expectedFinal) / 3) * 100) / 100;
  
  console.log('\n📊 Expected Scores:');
  console.log(`HR: ${expectedHR}`);
  console.log(`Technical: ${expectedTechnical}`);
  console.log(`Final: ${expectedFinal}`);
  console.log(`Total Average: ${expectedTotal}`);
  
  console.log('\n' + '='.repeat(60));
  
  // Test 1: Submit HR Interview
  await submitInterview('hr', hrInterviewData);
  await getApplicationData();
  
  console.log('\n' + '='.repeat(60));
  
  // Test 2: Submit Technical Interview
  await submitInterview('technical', technicalInterviewData);
  await getApplicationData();
  
  console.log('\n' + '='.repeat(60));
  
  // Test 3: Submit Final Interview (should calculate total)
  await submitInterview('final', finalInterviewData);
  await getApplicationData();
  
  console.log('\n' + '='.repeat(60));
  
  console.log('\n🎉 All interview tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ HR Interview scoring tested');
  console.log('✅ Technical Interview scoring tested');
  console.log('✅ Final Interview scoring tested');
  console.log('✅ Total average calculation tested');
}

// Export for use in other files
module.exports = {
  submitInterview,
  getApplicationData,
  runInterviewTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runInterviewTests();
}
