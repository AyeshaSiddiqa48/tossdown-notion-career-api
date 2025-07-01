// Test script for Technical interview submission (after HR interview)
const { submitInterviewData } = require('./utils/interviewService');

// Test application ID (same as HR interview)
const TEST_APPLICATION_ID = "22321223-e79e-811d-aeff-ddf2dd9b581f";

// Test Technical Interview Data
const technicalInterviewData = {
    "questions": [
        {
            "question": "Explain JavaScript closures and provide an example",
            "score": 4
        },
        {
            "question": "Design a REST API for a blog system",
            "score": 3
        },
        {
            "question": "What is the difference between SQL and NoSQL databases?",
            "score": 4
        }
    ],
    "comments": "Good technical knowledge, needs improvement in system design"
};

async function testTechnicalInterview() {
    console.log('🧪 Testing Technical Interview with Combined Score...\n');
    
    try {
        console.log('📝 Submitting Technical Interview...');
        console.log('📦 Request data:', JSON.stringify({
            applicationId: TEST_APPLICATION_ID,
            interviewType: 'technical',
            interviewData: technicalInterviewData
        }, null, 2));
        
        const result = await submitInterviewData(TEST_APPLICATION_ID, 'technical', technicalInterviewData);
        
        if (result.success) {
            console.log('✅ Technical Interview submitted successfully!');
            console.log(`📊 Technical Final Score: ${result.data.final_score}`);
            
            if (result.data.combined_score_info) {
                console.log('\n🎯 Combined Score Information:');
                console.log(`   HR Score: ${result.data.combined_score_info.hr_score}`);
                console.log(`   Technical Score: ${result.data.combined_score_info.technical_score}`);
                console.log(`   Combined Average: ${result.data.combined_score_info.combined_average}`);
                
                // Verify calculation
                const expectedCombined = Math.round(((result.data.combined_score_info.hr_score + result.data.combined_score_info.technical_score) / 2) * 100) / 100;
                if (expectedCombined === result.data.combined_score_info.combined_average) {
                    console.log('✅ Combined score calculation is CORRECT');
                } else {
                    console.log(`❌ Combined score calculation is INCORRECT. Expected: ${expectedCombined}, Got: ${result.data.combined_score_info.combined_average}`);
                }
                
                console.log(`   Submitted At: ${result.data.combined_score_info.submittedAt}`);
            } else {
                console.log('⚠️  No combined score information found in response');
            }
            
            console.log(`\n📝 Message: ${result.message}`);
            console.log(`📅 Updated At: ${result.data.updatedAt}`);
            
        } else {
            console.log('❌ Technical Interview failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Test function for technical interview without HR interview (edge case)
async function testTechnicalWithoutHR() {
    console.log('\n🧪 Testing Technical Interview without HR Interview (Edge Case)...\n');
    
    const TEST_APPLICATION_ID_NO_HR = "test-no-hr-interview-id";
    
    try {
        const result = await submitInterviewData(TEST_APPLICATION_ID_NO_HR, 'technical', technicalInterviewData);
        
        if (result.success) {
            console.log('✅ Technical Interview submitted successfully (without HR)');
            console.log(`📊 Technical Final Score: ${result.data.final_score}`);
            
            if (result.data.combined_score_info) {
                console.log('🎯 Score Information:');
                console.log(`   HR Score: ${result.data.combined_score_info.hr_score}`);
                console.log(`   Technical Score: ${result.data.combined_score_info.technical_score}`);
                console.log(`   Combined Average: ${result.data.combined_score_info.combined_average}`);
                console.log(`   Note: ${result.data.combined_score_info.note || 'N/A'}`);
            }
        } else {
            console.log('❌ Technical Interview failed:', result.message);
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Calculate expected scores for verification
function calculateExpectedScores() {
    console.log('🧮 Calculating Expected Scores...\n');
    
    // HR Interview scores: 2, 2, 1 → average = 1.67
    const hrScores = [2, 2, 1];
    const hrAverage = hrScores.reduce((sum, score) => sum + score, 0) / hrScores.length;
    console.log(`HR Interview Expected Score: ${Math.round(hrAverage * 100) / 100}`);
    
    // Technical Interview scores: 4, 3, 4 → average = 3.67
    const techScores = [4, 3, 4];
    const techAverage = techScores.reduce((sum, score) => sum + score, 0) / techScores.length;
    console.log(`Technical Interview Expected Score: ${Math.round(techAverage * 100) / 100}`);
    
    // Combined average: (1.67 + 3.67) / 2 = 2.67
    const combinedAverage = (hrAverage + techAverage) / 2;
    console.log(`Combined Average Expected Score: ${Math.round(combinedAverage * 100) / 100}`);
    
    return {
        hr: Math.round(hrAverage * 100) / 100,
        technical: Math.round(techAverage * 100) / 100,
        combined: Math.round(combinedAverage * 100) / 100
    };
}

async function runAllTests() {
    console.log('🚀 Starting Technical Interview Tests...\n');
    
    // Calculate expected scores
    const expectedScores = calculateExpectedScores();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test technical interview with existing HR data
    await testTechnicalInterview();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test technical interview without HR data
    await testTechnicalWithoutHR();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Expected vs Actual Summary:');
    console.log(`Expected HR Score: ${expectedScores.hr}`);
    console.log(`Expected Technical Score: ${expectedScores.technical}`);
    console.log(`Expected Combined Score: ${expectedScores.combined}`);
}

// Export for use in other files
module.exports = {
    testTechnicalInterview,
    testTechnicalWithoutHR,
    calculateExpectedScores,
    runAllTests,
    technicalInterviewData
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
