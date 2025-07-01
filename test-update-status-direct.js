// Test the update status function directly
const updateStatusHandler = require('./api/applications/update-status.js');

// Mock request and response objects
function createMockReq(body, method = 'PUT') {
    return {
        method: method,
        body: body,
        headers: {
            'content-type': 'application/json'
        }
    };
}

function createMockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        
        setHeader(name, value) {
            this.headers[name] = value;
        },
        
        status(code) {
            this.statusCode = code;
            return this;
        },
        
        json(data) {
            this.body = data;
            console.log('Response Status:', this.statusCode);
            console.log('Response Body:', JSON.stringify(data, null, 2));
            return this;
        },
        
        end() {
            console.log('Response ended');
            return this;
        }
    };
    
    return res;
}

async function testUpdateStatusDirect() {
    console.log('🧪 Testing Update Status Function Directly...\n');
    
    const testData = {
        "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
        "status": "HR Interview Completed"
    };
    
    try {
        console.log('📦 Test data:', JSON.stringify(testData, null, 2));
        
        const req = createMockReq(testData);
        const res = createMockRes();
        
        console.log('\n📡 Calling update status function...\n');
        
        await updateStatusHandler(req, res);
        
        if (res.body && res.body.success) {
            console.log('\n✅ SUCCESS! Function worked correctly');
            console.log('🎯 Verification:');
            console.log(`   Application ID: ${res.body.data.applicationId}`);
            console.log(`   New Status: ${res.body.data.status}`);
            console.log(`   Updated At: ${res.body.data.updatedAt}`);
        } else {
            console.log('\n❌ Function returned error or unexpected response');
        }
        
    } catch (error) {
        console.log('\n❌ Error occurred:', error.message);
        console.log('Stack:', error.stack);
    }
}

async function testInvalidStatus() {
    console.log('\n🚫 Testing Invalid Status...\n');
    
    const testData = {
        "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
        "status": "Invalid Status Value"
    };
    
    try {
        const req = createMockReq(testData);
        const res = createMockRes();
        
        await updateStatusHandler(req, res);
        
        if (res.statusCode === 500 && res.body && !res.body.success) {
            console.log('✅ Correctly rejected invalid status');
            console.log(`   Error: ${res.body.error}`);
        } else {
            console.log('❌ Should have rejected invalid status');
        }
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

async function testMissingFields() {
    console.log('\n🚫 Testing Missing Fields...\n');
    
    const testCases = [
        { name: 'Missing applicationId', data: { status: 'Under Review' } },
        { name: 'Missing status', data: { applicationId: '22321223-e79e-811d-aeff-ddf2dd9b581f' } },
        { name: 'Empty body', data: {} }
    ];
    
    for (const testCase of testCases) {
        console.log(`📝 Testing: ${testCase.name}`);
        
        try {
            const req = createMockReq(testCase.data);
            const res = createMockRes();
            
            await updateStatusHandler(req, res);
            
            if (res.statusCode === 500 && res.body && !res.body.success) {
                console.log(`✅ Correctly rejected: ${testCase.name}`);
                console.log(`   Error: ${res.body.error}`);
            } else {
                console.log(`❌ Should have rejected: ${testCase.name}`);
            }
            
        } catch (error) {
            console.log(`❌ Unexpected error for ${testCase.name}:`, error.message);
        }
        
        console.log('');
    }
}

async function testMethodNotAllowed() {
    console.log('\n🚫 Testing Method Not Allowed...\n');
    
    const testData = {
        "applicationId": "22321223-e79e-811d-aeff-ddf2dd9b581f",
        "status": "Under Review"
    };
    
    try {
        const req = createMockReq(testData, 'GET'); // Wrong method
        const res = createMockRes();
        
        await updateStatusHandler(req, res);
        
        if (res.statusCode === 405 && res.body && !res.body.success) {
            console.log('✅ Correctly rejected GET method');
            console.log(`   Message: ${res.body.message}`);
        } else {
            console.log('❌ Should have rejected GET method');
        }
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

async function runAllDirectTests() {
    console.log('🚀 Starting Direct Function Tests...\n');
    
    await testUpdateStatusDirect();
    
    console.log('\n' + '='.repeat(50));
    await testInvalidStatus();
    
    console.log('\n' + '='.repeat(50));
    await testMissingFields();
    
    console.log('\n' + '='.repeat(50));
    await testMethodNotAllowed();
    
    console.log('\n🎉 All direct tests completed!');
}

// Export for use in other files
module.exports = {
    testUpdateStatusDirect,
    testInvalidStatus,
    testMissingFields,
    testMethodNotAllowed,
    runAllDirectTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllDirectTests();
}
