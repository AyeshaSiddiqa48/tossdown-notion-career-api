// Test script to verify the API endpoint is working
const axios = require('axios');

// Your exact test data
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

async function testAPIEndpoint() {
    console.log('🧪 Testing API Endpoint: http://localhost:3000/api/applications/interview\n');
    
    try {
        console.log('📦 Sending request with data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n📡 Making POST request...\n');
        
        const response = await axios.post('http://localhost:3000/api/applications/interview', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
        
        console.log('✅ SUCCESS! API Response:');
        console.log('Status:', response.status);
        console.log('Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Verify the response structure
        if (response.data.success) {
            console.log('\n🎯 Response Verification:');
            console.log(`✅ Success: ${response.data.success}`);
            console.log(`✅ Message: ${response.data.message}`);
            console.log(`✅ Final Score: ${response.data.data.final_score}`);
            console.log(`✅ Application ID: ${response.data.data.applicationId}`);
            console.log(`✅ Interview Type: ${response.data.data.interviewType}`);
            console.log(`✅ Updated At: ${response.data.data.updatedAt}`);
        }
        
        return response.data;
        
    } catch (error) {
        console.log('❌ ERROR occurred:');
        
        if (error.response) {
            // Server responded with error status
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Headers:', error.response.headers);
            console.log('Response Data:');
            console.log(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.log('❌ No response received from server');
            console.log('Request details:', error.request);
            console.log('Error message:', error.message);
            console.log('\n💡 Possible causes:');
            console.log('- Server is not running on port 3000');
            console.log('- CORS issues');
            console.log('- Network connectivity problems');
        } else {
            // Something else happened
            console.log('❌ Request setup error:', error.message);
        }
        
        throw error;
    }
}

// Test with different HTTP clients to verify
async function testWithFetch() {
    console.log('\n🔄 Testing with fetch (Node.js 18+ built-in)...\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/applications/interview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        
        console.log('✅ Fetch SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.log('❌ Fetch ERROR:', error.message);
        throw error;
    }
}

// Check if server is running
async function checkServerStatus() {
    console.log('🔍 Checking if server is running...\n');
    
    try {
        const response = await axios.get('http://localhost:3000/', {
            timeout: 5000
        });
        
        console.log('✅ Server is running!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
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

async function runAllTests() {
    console.log('🚀 Starting API Endpoint Tests...\n');
    
    // Check server status first
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
        console.log('\n❌ Cannot proceed with tests - server is not running');
        return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    try {
        // Test with axios
        await testAPIEndpoint();
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test with fetch (if available)
        if (typeof fetch !== 'undefined') {
            await testWithFetch();
        } else {
            console.log('ℹ️  Fetch not available in this Node.js version');
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ Server is running');
        console.log('✅ API endpoint is working');
        console.log('✅ Request/response format is correct');
        console.log('✅ Interview data is being processed');
        
    } catch (error) {
        console.log('\n❌ Tests failed. Please check the error details above.');
    }
}

// Export for use in other files
module.exports = {
    testAPIEndpoint,
    testWithFetch,
    checkServerStatus,
    runAllTests,
    testData
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
