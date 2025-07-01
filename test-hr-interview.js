// Test script for HR interview submission
const axios = require('axios');

// Test data from your request
const testData = {
    "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
    "interviewType": "hr",
    "interviewData": {
        "questions": [
            {
                "question": "Tell me about yourself — focus on how your journey connects to this role.",
                "score": 2
            },
            {
                "question": "Tell me about a time you received hard feedback. How did you respond?",
                "score": 2
            },
            {
                "question": "What are your personal values, and how do they show up in how you work?",
                "score": 1
            }
        ],
        "comments": ""
    }
};

async function testHRInterview() {
    console.log('🧪 Testing HR Interview API...\n');
    
    // Test locally first
    const LOCAL_URL = 'http://localhost:3000/api/applications/interview';
    
    try {
        console.log('📝 Sending request to:', LOCAL_URL);
        console.log('📦 Request data:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post(LOCAL_URL, testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Success! Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Error occurred:');
        
        if (error.response) {
            // Server responded with error status
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.log('No response received. Is the server running?');
            console.log('Error:', error.message);
        } else {
            // Something else happened
            console.log('Error:', error.message);
        }
    }
}

// Test the service function directly
async function testServiceDirectly() {
    console.log('\n🔧 Testing service function directly...\n');
    
    try {
        const { submitInterviewData } = require('./utils/interviewService');
        
        const result = await submitInterviewData(
            testData.applicationId,
            testData.interviewType,
            testData.interviewData
        );
        
        console.log('✅ Service function success:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.log('❌ Service function error:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Validate the test data
function validateTestData() {
    console.log('🔍 Validating test data...\n');
    
    const { applicationId, interviewType, interviewData } = testData;
    
    console.log('applicationId:', applicationId, '(type:', typeof applicationId, ')');
    console.log('interviewType:', interviewType, '(type:', typeof interviewType, ')');
    console.log('interviewData:', !!interviewData, '(type:', typeof interviewData, ')');
    
    if (!applicationId) {
        console.log('❌ applicationId is missing or falsy');
        return false;
    }
    
    if (!interviewType) {
        console.log('❌ interviewType is missing or falsy');
        return false;
    }
    
    if (!interviewData) {
        console.log('❌ interviewData is missing or falsy');
        return false;
    }
    
    console.log('✅ All required fields are present\n');
    return true;
}

async function runAllTests() {
    console.log('🚀 Starting HR Interview Tests...\n');
    
    // First validate the data
    if (!validateTestData()) {
        console.log('❌ Test data validation failed. Stopping tests.');
        return;
    }
    
    // Test service function directly
    await testServiceDirectly();
    
    // Test API endpoint
    await testHRInterview();
    
    console.log('\n🎉 All tests completed!');
}

// Export for use in other files
module.exports = {
    testHRInterview,
    testServiceDirectly,
    validateTestData,
    runAllTests,
    testData
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
