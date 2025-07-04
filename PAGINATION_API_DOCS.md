# Paginated Applications API Documentation

## 🚀 **API Endpoints**

### **Vercel Production URL**
```
GET https://your-vercel-app.vercel.app/api/applications/get-applications
```

### **Local Development URL**
```
GET http://localhost:3000/api/applications
GET http://localhost:3000/api/applications/get-applications
```

## 📋 **Request Parameters**

### **Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (for reference only) |
| `limit` | integer | 20 | Number of records per page (max 100) |
| `cursor` | string | null | Notion cursor for pagination |
| `id` | string | null | Get single record by ID (bypasses pagination) |

### **Example Requests**

#### **Get First Page (Default)**
```
GET /api/applications/get-applications
```

#### **Get First Page with Custom Limit**
```
GET /api/applications/get-applications?limit=10
```

#### **Get Next Page Using Cursor**
```
GET /api/applications/get-applications?cursor=CURSOR_VALUE&limit=20
```

#### **Get Single Record by ID**
```
GET /api/applications/get-applications?id=22321223-e79e-811d-aeff-ddf2dd9b581f
```

## 📤 **Response Format**

### **Paginated Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "22321223-e79e-811d-aeff-ddf2dd9b581f",
      "properties": {
        "Full Name": {
          "title": [{"text": {"content": "John Doe"}}]
        },
        "Email Address": {
          "email": "john@example.com"
        },
        "Applicant Status": {
          "rich_text": [{"text": {"content": "Under Review"}}]
        }
        // ... other properties
      }
    }
    // ... more records
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "has_more": true,
    "next_cursor": "NEXT_CURSOR_VALUE",
    "total_in_page": 20
  }
}
```

### **Single Record Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "22321223-e79e-811d-aeff-ddf2dd9b581f",
    "properties": {
      // ... full record properties
    }
  }
}
```

### **Error Response (400/404/500)**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔧 **Frontend Integration Examples**

### **React Hook for Pagination**
```jsx
import { useState, useEffect } from 'react';

function useApplicationsPagination(pageSize = 20) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: pageSize,
    has_more: false,
    next_cursor: null,
    total_in_page: 0
  });

  const fetchApplications = async (cursor = null, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pageSize.toString()
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/applications/get-applications?${params}`);
      const result = await response.json();

      if (result.success) {
        if (reset) {
          setApplications(result.data);
        } else {
          setApplications(prev => [...prev, ...result.data]);
        }
        setPagination(result.pagination);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_more && !loading) {
      fetchApplications(pagination.next_cursor);
    }
  };

  const refresh = () => {
    fetchApplications(null, true);
  };

  useEffect(() => {
    fetchApplications(null, true);
  }, [pageSize]);

  return {
    applications,
    loading,
    error,
    pagination,
    loadMore,
    refresh
  };
}

export default useApplicationsPagination;
```

### **React Component with Pagination**
```jsx
import React from 'react';
import useApplicationsPagination from './useApplicationsPagination';

function ApplicationsList() {
  const { applications, loading, error, pagination, loadMore, refresh } = useApplicationsPagination(20);

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="applications-list">
      <div className="header">
        <h2>Applications ({applications.length} loaded)</h2>
        <button onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="applications-grid">
        {applications.map(app => (
          <div key={app.id} className="application-card">
            <h3>{app.properties['Full Name']?.title?.[0]?.text?.content || 'No Name'}</h3>
            <p>{app.properties['Email Address']?.email || 'No Email'}</p>
            <p>Status: {app.properties['Applicant Status']?.rich_text?.[0]?.text?.content || 'No Status'}</p>
          </div>
        ))}
      </div>

      {pagination.has_more && (
        <div className="pagination">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
          <p>Showing {applications.length} applications</p>
        </div>
      )}

      {!pagination.has_more && applications.length > 0 && (
        <p className="end-message">All applications loaded</p>
      )}
    </div>
  );
}

export default ApplicationsList;
```

### **Page-Based Pagination Component**
```jsx
import React, { useState, useEffect } from 'react';

function ApplicationsPagination() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState(['']); // Array to store cursors for each page
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  const fetchPage = async (pageNum, cursor = null) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        page: pageNum.toString()
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/applications/get-applications?${params}`);
      const result = await response.json();

      if (result.success) {
        setApplications(result.data);
        setHasMore(result.pagination.has_more);
        
        // Store next cursor for next page
        if (result.pagination.next_cursor && !cursors[pageNum]) {
          setCursors(prev => {
            const newCursors = [...prev];
            newCursors[pageNum] = result.pagination.next_cursor;
            return newCursors;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum < 1) return;
    
    const cursor = cursors[pageNum - 1] || null;
    setCurrentPage(pageNum);
    fetchPage(pageNum, cursor);
  };

  const nextPage = () => {
    if (hasMore) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  return (
    <div className="applications-pagination">
      <div className="applications-list">
        {applications.map(app => (
          <div key={app.id} className="application-item">
            {/* Application content */}
          </div>
        ))}
      </div>

      <div className="pagination-controls">
        <button 
          onClick={prevPage} 
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>
        
        <span>Page {currentPage}</span>
        
        <button 
          onClick={nextPage} 
          disabled={!hasMore || loading}
        >
          Next
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}

export default ApplicationsPagination;
```

## 📋 **Postman Testing Guide**

### **Collection Setup**
1. Create new collection: "Applications Pagination API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3000` or your Vercel URL

### **Test Requests**

#### **1. Get First Page**
```
GET {{baseUrl}}/api/applications/get-applications
```

#### **2. Get Custom Page Size**
```
GET {{baseUrl}}/api/applications/get-applications?limit=5
```

#### **3. Get Next Page (use cursor from previous response)**
```
GET {{baseUrl}}/api/applications/get-applications?cursor=CURSOR_VALUE&limit=20
```

#### **4. Get Single Record**
```
GET {{baseUrl}}/api/applications/get-applications?id=RECORD_ID
```

#### **5. Test Error Cases**
```
GET {{baseUrl}}/api/applications/get-applications?limit=150
GET {{baseUrl}}/api/applications/get-applications?id=invalid-id
```

### **Postman Test Scripts**
Add to Tests tab in Postman:

```javascript
// Test for successful pagination response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has pagination info", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('pagination');
    pm.expect(jsonData.pagination).to.have.property('page_size');
    pm.expect(jsonData.pagination).to.have.property('has_more');
});

// Store cursor for next request
pm.test("Store next cursor", function () {
    const jsonData = pm.response.json();
    if (jsonData.pagination && jsonData.pagination.next_cursor) {
        pm.environment.set("nextCursor", jsonData.pagination.next_cursor);
    }
});
```

## 🔧 **Key Features**

- ✅ **Cursor-based pagination** (Notion native)
- ✅ **Configurable page size** (1-100 records)
- ✅ **Single record retrieval** by ID
- ✅ **Error handling** and validation
- ✅ **CORS support** for frontend
- ✅ **Serverless ready** for Vercel
- ✅ **Backward compatibility** with existing API

## 🚀 **Ready for Production**

The paginated API is fully tested and ready for frontend integration. Use the React examples above to implement pagination in your v0 dev frontend!
