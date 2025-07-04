// Test script for Paginated Applications API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/applications';

// Test pagination functionality
async function testPagination() {
    console.log('🧪 Testing Pagination API...\n');
    
    try {
        // Test 1: Get first page (default)
        console.log('📝 Test 1: Get first page (default parameters)');
        const response1 = await axios.get(`${BASE_URL}`);
        
        console.log('✅ Success! Response:');
        console.log('Status:', response1.status);
        console.log('Success:', response1.data.success);
        console.log('Records in page:', response1.data.pagination.total_in_page);
        console.log('Page size:', response1.data.pagination.page_size);
        console.log('Has more:', response1.data.pagination.has_more);
        console.log('Next cursor:', response1.data.pagination.next_cursor ? 'Available' : 'None');
        
        // Store cursor for next test
        const nextCursor = response1.data.pagination.next_cursor;
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Get specific page size
        console.log('📝 Test 2: Get first page with custom page size (5 records)');
        const response2 = await axios.get(`${BASE_URL}?limit=5`);
        
        console.log('✅ Success! Response:');
        console.log('Records in page:', response2.data.pagination.total_in_page);
        console.log('Page size:', response2.data.pagination.page_size);
        console.log('Has more:', response2.data.pagination.has_more);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Get next page using cursor (if available)
        if (nextCursor) {
            console.log('📝 Test 3: Get next page using cursor');
            const response3 = await axios.get(`${BASE_URL}?cursor=${encodeURIComponent(nextCursor)}&limit=20`);
            
            console.log('✅ Success! Response:');
            console.log('Records in page:', response3.data.pagination.total_in_page);
            console.log('Current page:', response3.data.pagination.current_page);
            console.log('Has more:', response3.data.pagination.has_more);
            console.log('Next cursor:', response3.data.pagination.next_cursor ? 'Available' : 'None');
        } else {
            console.log('📝 Test 3: Skipped (no more pages available)');
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 4: Get single record by ID (if we have records)
        if (response1.data.data && response1.data.data.length > 0) {
            const firstRecordId = response1.data.data[0].id;
            console.log('📝 Test 4: Get single record by ID');
            console.log('Record ID:', firstRecordId);
            
            const response4 = await axios.get(`${BASE_URL}?id=${firstRecordId}`);
            
            console.log('✅ Success! Response:');
            console.log('Success:', response4.data.success);
            console.log('Record ID:', response4.data.data.id);
            console.log('Record has properties:', !!response4.data.data.properties);
        } else {
            console.log('📝 Test 4: Skipped (no records available)');
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

// Test serverless endpoint
async function testServerlessEndpoint() {
    console.log('\n🔄 Testing Serverless Endpoint...\n');
    
    const SERVERLESS_URL = `${BASE_URL}/get-applications`;
    
    try {
        console.log('📝 Testing serverless endpoint with pagination');
        const response = await axios.get(`${SERVERLESS_URL}?limit=10&page=1`);
        
        console.log('✅ Serverless endpoint success!');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Records in page:', response.data.pagination.total_in_page);
        console.log('Page size:', response.data.pagination.page_size);
        console.log('Has more:', response.data.pagination.has_more);
        
    } catch (error) {
        console.log('❌ Serverless endpoint error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Test error cases
async function testErrorCases() {
    console.log('\n🚫 Testing Error Cases...\n');
    
    try {
        // Test invalid limit
        console.log('📝 Test: Invalid limit (over 100)');
        const response1 = await axios.get(`${BASE_URL}/get-applications?limit=150`);
        console.log('❌ Should have failed but succeeded:', response1.data);
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Correctly rejected invalid limit');
            console.log('Error message:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
    
    console.log('');
    
    try {
        // Test invalid record ID
        console.log('📝 Test: Invalid record ID');
        const response2 = await axios.get(`${BASE_URL}?id=invalid-id-12345`);
        console.log('❌ Should have failed but succeeded:', response2.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('✅ Correctly rejected invalid record ID');
            console.log('Error message:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
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

async function runAllTests() {
    console.log('🚀 Starting Pagination API Tests...\n');
    
    // Check server status first
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
        console.log('\n❌ Cannot proceed with tests - server is not running');
        return;
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test main pagination functionality
    await testPagination();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test serverless endpoint
    await testServerlessEndpoint();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test error cases
    await testErrorCases();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Pagination functionality tested');
    console.log('✅ Serverless endpoint tested');
    console.log('✅ Error handling tested');
    console.log('✅ Single record retrieval tested');
}

// Export for use in other files
module.exports = {
    testPagination,
    testServerlessEndpoint,
    testErrorCases,
    checkServerStatus,
    runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
