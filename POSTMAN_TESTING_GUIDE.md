# Postman Testing Guide - Paginated Applications API

## 🚀 **Quick Setup**

### **1. Create New Collection**
- Collection Name: `Tossdown Applications API - Pagination`
- Base URL Variable: `{{baseUrl}}` = `http://localhost:3000` (or your Vercel URL)

### **2. Environment Variables**
Create these variables in your Postman environment:
```
baseUrl = http://localhost:3000
nextCursor = (will be set automatically by tests)
applicationId = 22321223-e79e-81d0-9e03-d85c0ca1421f
```

## 📋 **Test Requests**

### **Request 1: Get First Page (Default)**
```
GET {{baseUrl}}/api/applications/get-applications
```

**Expected Response:**
```json
{
  "success": true,
  "data": [/* 20 application records */],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "has_more": true,
    "next_cursor": "CURSOR_VALUE",
    "total_in_page": 20
  }
}
```

**Test Script (Add to Tests tab):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Returns 20 records by default", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.lengthOf(20);
});

pm.test("Has pagination metadata", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.pagination).to.have.property('current_page');
    pm.expect(jsonData.pagination).to.have.property('page_size');
    pm.expect(jsonData.pagination).to.have.property('has_more');
    pm.expect(jsonData.pagination).to.have.property('next_cursor');
});

// Store cursor for next request
if (pm.response.json().pagination.next_cursor) {
    pm.environment.set("nextCursor", pm.response.json().pagination.next_cursor);
}
```

### **Request 2: Get Custom Page Size**
```
GET {{baseUrl}}/api/applications/get-applications?limit=5
```

**Test Script:**
```javascript
pm.test("Returns exactly 5 records", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.lengthOf(5);
    pm.expect(jsonData.pagination.page_size).to.equal(5);
});
```

### **Request 3: Get Next Page Using Cursor**
```
GET {{baseUrl}}/api/applications/get-applications?cursor={{nextCursor}}&limit=20
```

**Test Script:**
```javascript
pm.test("Next page returns different records", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.lengthOf.greaterThan(0);
    pm.expect(jsonData.pagination.current_page).to.equal(1); // Page number is for reference
});

// Update cursor for further pagination
if (pm.response.json().pagination.next_cursor) {
    pm.environment.set("nextCursor", pm.response.json().pagination.next_cursor);
}
```

### **Request 4: Get Single Record by ID**
```
GET {{baseUrl}}/api/applications/get-applications?id={{applicationId}}
```

**Test Script:**
```javascript
pm.test("Returns single record", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data.id).to.equal(pm.environment.get("applicationId"));
});

pm.test("Single record has properties", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('properties');
    pm.expect(jsonData.data.properties).to.have.property('Full Name');
});
```

### **Request 5: Test Error Cases**

#### **Invalid Limit (Over 100)**
```
GET {{baseUrl}}/api/applications/get-applications?limit=150
```

**Test Script:**
```javascript
pm.test("Rejects invalid limit", function () {
    pm.response.to.have.status(400);
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.message).to.include("exceed 100");
});
```

#### **Invalid Record ID**
```
GET {{baseUrl}}/api/applications/get-applications?id=invalid-id-12345
```

**Test Script:**
```javascript
pm.test("Rejects invalid record ID", function () {
    pm.response.to.have.status(404);
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
});
```

## 🔄 **Complete Test Sequence**

### **Automated Test Runner**
Create a Collection Runner sequence:

1. **Get First Page** → Stores `nextCursor`
2. **Get Custom Page Size** → Verifies limit parameter
3. **Get Next Page** → Uses stored cursor
4. **Get Single Record** → Tests ID lookup
5. **Test Invalid Limit** → Error handling
6. **Test Invalid ID** → Error handling

### **Pre-request Script (Collection Level)**
```javascript
// Set timestamp for unique testing
pm.globals.set("timestamp", new Date().toISOString());

// Log test start
console.log("Starting pagination tests at: " + pm.globals.get("timestamp"));
```

### **Test Script (Collection Level)**
```javascript
// Log response summary
const jsonData = pm.response.json();
console.log(`Request: ${pm.request.name}`);
console.log(`Status: ${pm.response.status}`);
if (jsonData.pagination) {
    console.log(`Records: ${jsonData.data.length}, Has More: ${jsonData.pagination.has_more}`);
}
```

## 📊 **Expected Test Results**

### **Successful Run Should Show:**
- ✅ 6/6 tests passed
- ✅ All status codes correct (200, 400, 404)
- ✅ Pagination metadata present
- ✅ Cursor navigation working
- ✅ Error handling functional

### **Sample Console Output:**
```
Starting pagination tests at: 2025-07-01T15:30:00.000Z
Request: Get First Page
Status: 200
Records: 20, Has More: true

Request: Get Custom Page Size  
Status: 200
Records: 5, Has More: true

Request: Get Next Page
Status: 200
Records: 20, Has More: true

Request: Get Single Record
Status: 200

Request: Test Invalid Limit
Status: 400

Request: Test Invalid ID
Status: 404
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Server Not Running**
   - Error: `ECONNREFUSED`
   - Solution: Start server with `npm start` or `node index.js`

2. **Invalid Cursor**
   - Error: 400 Bad Request
   - Solution: Use cursor from previous response

3. **No Records Returned**
   - Check if Notion database has data
   - Verify `APPLICATION_DATABASE_ID` environment variable

4. **CORS Errors**
   - Use Postman Desktop (not web version)
   - Check server CORS configuration

## 🚀 **Ready for Production Testing**

Once local testing passes, update `{{baseUrl}}` to your Vercel production URL:
```
https://your-vercel-app.vercel.app
```

All tests should work identically in production! 🎉
