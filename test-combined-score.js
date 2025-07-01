// Test script to verify combined score calculation
const { submitInterviewData } = require('./utils/interviewService');

// Test application ID (replace with a real one from your Notion database)
const TEST_APPLICATION_ID = "21f21223-e79e-81ce-b52e-d2b143d790cd";

// Test HR Interview Data
const hrInterviewData = {
  questions: [
    { question: "Tell me about yourself", score: 4, maxScore: 5, notes: "Good communication" },
    { question: "Why this company?", score: 3, maxScore: 5, notes: "Average response" },
    { question: "Team work experience", score: 5, maxScore: 5, notes: "Excellent examples" }
  ],
  comments: "Good candidate, recommended for technical round",
  interviewer: "HR Manager",
  duration: "30 minutes"
};

// Test Technical Interview Data
const technicalInterviewData = {
  questions: [
    { question: "JavaScript closures", score: 4, maxScore: 5, notes: "Good understanding" },
    { question: "System design", score: 3, maxScore: 5, notes: "Needs improvement" },
    { question: "Database optimization", score: 4, maxScore: 5, notes: "Solid knowledge" }
  ],
  comments: "Strong technical skills, good problem solving",
  interviewer: "Tech Lead",
  duration: "45 minutes",
  codingTest: "Passed"
};

async function testCombinedScore() {
  console.log('🧪 Testing Combined Score Calculation...\n');

  try {
    // Step 1: Submit HR Interview
    console.log('📝 Step 1: Submitting HR Interview...');
    const hrResult = await submitInterviewData(TEST_APPLICATION_ID, 'hr', hrInterviewData);
    
    if (hrResult.success) {
      console.log('✅ HR Interview submitted successfully');
      console.log(`📊 HR Final Score: ${hrResult.data.final_score}`);
      console.log(`📝 Message: ${hrResult.message}\n`);
    } else {
      console.log('❌ HR Interview failed:', hrResult.message);
      return;
    }

    // Step 2: Submit Technical Interview (should calculate combined score)
    console.log('📝 Step 2: Submitting Technical Interview...');
    const techResult = await submitInterviewData(TEST_APPLICATION_ID, 'technical', technicalInterviewData);
    
    if (techResult.success) {
      console.log('✅ Technical Interview submitted successfully');
      console.log(`📊 Technical Final Score: ${techResult.data.final_score}`);
      
      if (techResult.data.combined_score_info) {
        console.log('🎯 Combined Score Information:');
        console.log(`   HR Score: ${techResult.data.combined_score_info.hr_score}`);
        console.log(`   Technical Score: ${techResult.data.combined_score_info.technical_score}`);
        console.log(`   Combined Average: ${techResult.data.combined_score_info.combined_average}`);
        
        // Verify calculation
        const expectedCombined = Math.round(((techResult.data.combined_score_info.hr_score + techResult.data.combined_score_info.technical_score) / 2) * 100) / 100;
        if (expectedCombined === techResult.data.combined_score_info.combined_average) {
          console.log('✅ Combined score calculation is CORRECT');
        } else {
          console.log(`❌ Combined score calculation is INCORRECT. Expected: ${expectedCombined}, Got: ${techResult.data.combined_score_info.combined_average}`);
        }
      } else {
        console.log('⚠️  No combined score information found in response');
      }
      
      console.log(`📝 Message: ${techResult.message}\n`);
    } else {
      console.log('❌ Technical Interview failed:', techResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test function for technical interview without HR interview
async function testTechnicalWithoutHR() {
  console.log('🧪 Testing Technical Interview without HR Interview...\n');
  
  const TEST_APPLICATION_ID_NO_HR = "test-no-hr-interview-id";
  
  try {
    const techResult = await submitInterviewData(TEST_APPLICATION_ID_NO_HR, 'technical', technicalInterviewData);
    
    if (techResult.success) {
      console.log('✅ Technical Interview submitted successfully (without HR)');
      console.log(`📊 Technical Final Score: ${techResult.data.final_score}`);
      
      if (techResult.data.combined_score_info) {
        console.log('🎯 Score Information:');
        console.log(`   HR Score: ${techResult.data.combined_score_info.hr_score}`);
        console.log(`   Technical Score: ${techResult.data.combined_score_info.technical_score}`);
        console.log(`   Combined Average: ${techResult.data.combined_score_info.combined_average}`);
        console.log(`   Note: ${techResult.data.combined_score_info.note || 'N/A'}`);
      }
    } else {
      console.log('❌ Technical Interview failed:', techResult.message);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Combined Score Tests...\n');
  
  await testCombinedScore();
  console.log('\n' + '='.repeat(50) + '\n');
  await testTechnicalWithoutHR();
  
  console.log('\n🎉 All tests completed!');
}

// Export for use in other files
module.exports = {
  testCombinedScore,
  testTechnicalWithoutHR,
  runTests
};

// Uncomment to run tests directly
// runTests();
