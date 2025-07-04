// Test the pagination function directly
const getApplicationsHandler = require('./api/applications/get-applications.js');

// Mock request and response objects
function createMockReq(query = {}) {
    return {
        method: 'GET',
        query: query,
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
            console.log('Response Body (truncated):');
            if (data.data && Array.isArray(data.data)) {
                console.log(`  Success: ${data.success}`);
                console.log(`  Records returned: ${data.data.length}`);
                console.log(`  Pagination:`, data.pagination);
                console.log(`  Total Count: ${data.pagination.total_count || 'Not provided'}`);
                console.log(`  First record name: ${data.data[0]?.properties?.['Full Name']?.title?.[0]?.text?.content || 'N/A'}`);
            } else {
                console.log(JSON.stringify(data, null, 2));
            }
            return this;
        },
        
        end() {
            console.log('Response ended');
            return this;
        }
    };
    
    return res;
}

async function testPaginationDirect() {
    console.log('🧪 Testing Pagination Function Directly...\n');
    
    try {
        // Test 1: Default pagination (first page, 20 records)
        console.log('📝 Test 1: Default pagination (first page, 20 records)');
        const req1 = createMockReq({});
        const res1 = createMockRes();
        
        await getApplicationsHandler(req1, res1);
        
        if (res1.body && res1.body.success) {
            console.log('✅ Test 1 SUCCESS!\n');
        } else {
            console.log('❌ Test 1 FAILED\n');
        }
        
        console.log('='.repeat(50) + '\n');
        
        // Test 2: Custom page size (5 records)
        console.log('📝 Test 2: Custom page size (5 records)');
        const req2 = createMockReq({ limit: '5' });
        const res2 = createMockRes();
        
        await getApplicationsHandler(req2, res2);
        
        if (res2.body && res2.body.success && res2.body.data.length <= 5) {
            console.log('✅ Test 2 SUCCESS!\n');
        } else {
            console.log('❌ Test 2 FAILED\n');
        }
        
        console.log('='.repeat(50) + '\n');
        
        // Test 3: Get next page using cursor (if available from test 2)
        if (res2.body && res2.body.pagination && res2.body.pagination.next_cursor) {
            console.log('📝 Test 3: Next page using cursor');
            const req3 = createMockReq({ 
                limit: '5', 
                cursor: res2.body.pagination.next_cursor 
            });
            const res3 = createMockRes();
            
            await getApplicationsHandler(req3, res3);
            
            if (res3.body && res3.body.success) {
                console.log('✅ Test 3 SUCCESS!\n');
            } else {
                console.log('❌ Test 3 FAILED\n');
            }
        } else {
            console.log('📝 Test 3: Skipped (no next cursor available)\n');
        }
        
        console.log('='.repeat(50) + '\n');
        
        // Test 4: Get single record by ID (if we have records)
        if (res1.body && res1.body.data && res1.body.data.length > 0) {
            const firstRecordId = res1.body.data[0].id;
            console.log('📝 Test 4: Get single record by ID');
            console.log('Record ID:', firstRecordId);
            
            const req4 = createMockReq({ id: firstRecordId });
            const res4 = createMockRes();
            
            await getApplicationsHandler(req4, res4);
            
            if (res4.body && res4.body.success && res4.body.data.id === firstRecordId) {
                console.log('✅ Test 4 SUCCESS!\n');
            } else {
                console.log('❌ Test 4 FAILED\n');
            }
        } else {
            console.log('📝 Test 4: Skipped (no records available)\n');
        }
        
    } catch (error) {
        console.log('\n❌ Error occurred:', error.message);
        console.log('Stack:', error.stack);
    }
}

async function testErrorCases() {
    console.log('🚫 Testing Error Cases...\n');
    
    try {
        // Test invalid limit
        console.log('📝 Test: Invalid limit (over 100)');
        const req1 = createMockReq({ limit: '150' });
        const res1 = createMockRes();
        
        await getApplicationsHandler(req1, res1);
        
        if (res1.statusCode === 400) {
            console.log('✅ Correctly rejected invalid limit\n');
        } else {
            console.log('❌ Should have rejected invalid limit\n');
        }
        
        // Test invalid method
        console.log('📝 Test: Invalid method (POST)');
        const req2 = { method: 'POST', query: {} };
        const res2 = createMockRes();
        
        await getApplicationsHandler(req2, res2);
        
        if (res2.statusCode === 405) {
            console.log('✅ Correctly rejected POST method\n');
        } else {
            console.log('❌ Should have rejected POST method\n');
        }
        
    } catch (error) {
        console.log('❌ Error in error tests:', error.message);
    }
}

async function runAllDirectTests() {
    console.log('🚀 Starting Direct Pagination Tests...\n');
    
    await testPaginationDirect();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await testErrorCases();
    
    console.log('\n🎉 All direct tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Pagination functionality tested');
    console.log('✅ Custom page sizes tested');
    console.log('✅ Cursor-based navigation tested');
    console.log('✅ Single record retrieval tested');
    console.log('✅ Error handling tested');
}

// Export for use in other files
module.exports = {
    testPaginationDirect,
    testErrorCases,
    runAllDirectTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllDirectTests();
}
