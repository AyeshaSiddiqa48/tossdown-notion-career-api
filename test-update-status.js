// Test script for Update Status API
const axios = require('axios');

// Test data
const testData = {
    "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
    "status": "HR Interview Completed"
};

async function testUpdateStatus() {
    console.log('🧪 Testing Update Status API...\n');
    
    const LOCAL_URL = 'http://localhost:3000/api/applications/update-status';
    
    try {
        console.log('📝 Sending request to:', LOCAL_URL);
        console.log('📦 Request data:', JSON.stringify(testData, null, 2));
        
        const response = await axios.put(LOCAL_URL, testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Success! Response:');
        console.log('Status:', response.status);
        console.log('Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Verify response structure
        if (response.data.success) {
            console.log('\n🎯 Response Verification:');
            console.log(`✅ Success: ${response.data.success}`);
            console.log(`✅ Message: ${response.data.message}`);
            console.log(`✅ Application ID: ${response.data.data.applicationId}`);
            console.log(`✅ New Status: ${response.data.data.status}`);
            console.log(`✅ Updated At: ${response.data.data.updatedAt}`);
        }
        
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
    }
}

// Test different status values
async function testDifferentStatuses() {
    console.log('\n🔄 Testing different status values...\n');
    
    const statusesToTest = [
        'Under Review',
        'HR Interview Scheduled', 
        'Technical Interview Scheduled',
        'Offer Extended',
        'Hired'
    ];
    
    for (const status of statusesToTest) {
        console.log(`\n📝 Testing status: "${status}"`);
        
        try {
            const response = await axios.put('http://localhost:3000/api/applications/update-status', {
                applicationId: testData.applicationId,
                status: status
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log(`✅ Success: ${status}`);
            console.log(`   Updated at: ${response.data.data.updatedAt}`);
            
        } catch (error) {
            console.log(`❌ Failed: ${status}`);
            if (error.response) {
                console.log(`   Error: ${error.response.data.error}`);
            }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test invalid status
async function testInvalidStatus() {
    console.log('\n🚫 Testing invalid status...\n');
    
    try {
        const response = await axios.put('http://localhost:3000/api/applications/update-status', {
            applicationId: testData.applicationId,
            status: 'Invalid Status'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('❌ Should have failed but succeeded:', response.data);
        
    } catch (error) {
        if (error.response && error.response.status === 500) {
            console.log('✅ Correctly rejected invalid status');
            console.log(`   Error message: ${error.response.data.error}`);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

// Test missing fields
async function testMissingFields() {
    console.log('\n🚫 Testing missing fields...\n');
    
    const testCases = [
        { name: 'Missing applicationId', data: { status: 'Under Review' } },
        { name: 'Missing status', data: { applicationId: testData.applicationId } },
        { name: 'Empty body', data: {} }
    ];
    
    for (const testCase of testCases) {
        console.log(`📝 Testing: ${testCase.name}`);
        
        try {
            const response = await axios.put('http://localhost:3000/api/applications/update-status', testCase.data, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log(`❌ Should have failed but succeeded:`, response.data);
            
        } catch (error) {
            if (error.response && error.response.status === 500) {
                console.log(`✅ Correctly rejected: ${testCase.name}`);
                console.log(`   Error: ${error.response.data.error}`);
            } else {
                console.log(`❌ Unexpected error for ${testCase.name}:`, error.message);
            }
        }
        
        console.log('');
    }
}

async function runAllTests() {
    console.log('🚀 Starting Update Status API Tests...\n');
    
    // Test basic functionality
    await testUpdateStatus();
    
    console.log('\n' + '='.repeat(50));
    
    // Test different valid statuses
    await testDifferentStatuses();
    
    console.log('\n' + '='.repeat(50));
    
    // Test invalid status
    await testInvalidStatus();
    
    console.log('\n' + '='.repeat(50));
    
    // Test missing fields
    await testMissingFields();
    
    console.log('\n🎉 All tests completed!');
}

// Export for use in other files
module.exports = {
    testUpdateStatus,
    testDifferentStatuses,
    testInvalidStatus,
    testMissingFields,
    runAllTests,
    testData
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
