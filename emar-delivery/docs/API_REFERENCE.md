# Documents Management API Reference

## Overview

The Documents Management API provides comprehensive endpoints for uploading, managing, and downloading documents for drivers, vehicles, and other entities in the Emar Delivery system. All endpoints support Arabic localization and follow RESTful conventions.

## Base Information

- **Base URL**: `http://localhost:5000/api/documents`
- **Authentication**: Session-based authentication required
- **Content-Type**: `application/json` for JSON requests, `multipart/form-data` for file uploads
- **Character Encoding**: UTF-8
- **Language**: Arabic (ar) with RTL support

## Authentication

All API endpoints require authentication via session cookies. Users must be logged in to access any document management functionality.

```http
Cookie: session=your_session_cookie_here
```

## Rate Limiting

- **Upload endpoints**: 10 requests per minute per user
- **Download endpoints**: 50 requests per minute per user
- **List endpoints**: 100 requests per minute per user

## File Constraints

- **Maximum file size**: 15MB (15,728,640 bytes)
- **Supported file types**: 
  - PDF: `.pdf`
  - Images: `.jpg`, `.jpeg`, `.png`, `.webp`
  - Documents: `.docx`, `.xlsx`
- **Filename restrictions**: Alphanumeric characters, hyphens, underscores only
- **Storage organization**: Files organized by entity type and ID

## API Endpoints

### 1. Upload Document

Upload a new document file for a specific entity.

**Endpoint**: `POST /api/documents/upload`

**Request Parameters**:
```
file (file, required): The document file to upload
entity_type (string, required): Entity type ('drivers', 'vehicles', 'other')
entity_id (string, required): Unique identifier of the entity
category (string, required): Document category
description (string, optional): Human-readable description
expiry_date (string, optional): Expiry date in YYYY-MM-DD format
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@license.pdf" \
  -F "entity_type=drivers" \
  -F "entity_id=driver_123" \
  -F "category=license" \
  -F "description=رخصة القيادة الجديدة" \
  -F "expiry_date=2025-12-31"
```

**Success Response** (200):
```json
{
  "success": true,
  "document_id": "doc_20250122_143052_abc123",
  "message": "تم رفع الوثيقة بنجاح",
  "metadata": {
    "filename": "license_driver_123_20250122_143052.pdf",
    "size": 2048576,
    "type": "application/pdf",
    "upload_date": "2025-01-22T14:30:52Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Missing required parameters
- **413 Payload Too Large**: File exceeds 15MB limit
- **415 Unsupported Media Type**: Invalid file type
- **500 Internal Server Error**: Server-side error

### 2. List Documents

Retrieve documents for a specific entity with optional filtering.

**Endpoint**: `GET /api/documents/{entity_type}/{entity_id}`

**Query Parameters**:
```
category (string, optional): Filter by document category
status (string, optional): Filter by status ('active', 'expired', 'expiring_soon')
search (string, optional): Search in filenames and descriptions
page (integer, optional): Page number for pagination (default: 1)
limit (integer, optional): Items per page (default: 20, max: 100)
```

**Example Request**:
```bash
curl "http://localhost:5000/api/documents/drivers/driver_123?category=license&status=active"
```

**Success Response** (200):
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_123",
      "filename": "license.pdf",
      "category": "license",
      "description": "رخصة القيادة",
      "upload_date": "2025-01-22T14:30:52Z",
      "expiry_date": "2025-12-31",
      "status": "active",
      "size": 2048576,
      "type": "application/pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 3. Download Document

Download a specific document file.

**Endpoint**: `GET /api/documents/download/{document_id}`

**Example Request**:
```bash
curl -O http://localhost:5000/api/documents/download/doc_123
```

**Success Response** (200):
- **Content-Type**: Original file MIME type
- **Content-Disposition**: `attachment; filename="original_filename.pdf"`
- **Body**: Binary file content

### 4. Bulk Download

Download multiple documents as a ZIP archive.

**Endpoint**: `POST /api/documents/download-bulk`

**Request Body**:
```json
{
  "document_ids": ["doc_123", "doc_456", "doc_789"],
  "archive_name": "driver_documents"
}
```

**Success Response** (200):
- **Content-Type**: `application/zip`
- **Content-Disposition**: `attachment; filename="driver_documents.zip"`
- **Body**: ZIP archive containing selected documents

### 5. Update Document

Update document metadata (not the file itself).

**Endpoint**: `PUT /api/documents/{document_id}`

**Request Body**:
```json
{
  "description": "وصف محدث للوثيقة",
  "category": "updated_category",
  "expiry_date": "2026-12-31"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "تم تحديث الوثيقة بنجاح",
  "document": {
    "id": "doc_123",
    "description": "وصف محدث للوثيقة",
    "category": "updated_category",
    "expiry_date": "2026-12-31"
  }
}
```

### 6. Delete Document

Delete a document and its associated file.

**Endpoint**: `DELETE /api/documents/{document_id}`

**Success Response** (200):
```json
{
  "success": true,
  "message": "تم حذف الوثيقة بنجاح"
}
```

### 7. Get Document Statistics

Retrieve statistics for documents by entity type.

**Endpoint**: `GET /api/documents/stats/{entity_type}`

**Success Response** (200):
```json
{
  "success": true,
  "stats": {
    "total_documents": 150,
    "by_category": {
      "license": 45,
      "insurance": 38,
      "id_copy": 42,
      "other": 25
    },
    "by_status": {
      "active": 120,
      "expired": 15,
      "expiring_soon": 10,
      "missing": 5
    },
    "total_size": 52428800,
    "last_updated": "2025-01-22T14:30:52Z"
  }
}
```

## Error Handling

All API endpoints return consistent error responses with Arabic messages:

```json
{
  "error": "رسالة الخطأ باللغة العربية",
  "error_code": "error_type_identifier",
  "timestamp": "2025-01-22T14:30:52Z"
}
```

### Common Error Codes

- `file_too_large`: File exceeds 15MB limit
- `invalid_file_type`: Unsupported file type
- `file_not_found`: Requested file does not exist
- `permission_denied`: Insufficient permissions
- `invalid_request`: Malformed request parameters
- `rate_limit_exceeded`: Too many requests
- `server_error`: Internal server error

## Admin Endpoints

### System Cleanup

**Endpoint**: `POST /api/admin/cleanup`

Performs system maintenance including temporary file cleanup and orphaned file removal.

**Success Response** (200):
```json
{
  "success": true,
  "message": "تم تنظيف النظام بنجاح",
  "results": {
    "temp_files_cleaned": 5,
    "orphaned_files_removed": 2,
    "database_entries_cleaned": 1
  }
}
```

### Performance Statistics

**Endpoint**: `GET /api/admin/performance`

Retrieves system performance metrics and storage usage.

**Success Response** (200):
```json
{
  "success": true,
  "stats": {
    "total_documents": 1250,
    "total_file_size": 524288000,
    "total_file_size_formatted": "500.0 ميجابايت",
    "documents_by_type": {
      "drivers": 450,
      "vehicles": 380,
      "other": 420
    },
    "upload_directories": {
      "drivers": 209715200,
      "vehicles": 157286400,
      "other": 157286400
    }
  }
}
```

## SDK Examples

### JavaScript/Frontend

```javascript
// Upload a document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('entity_type', 'drivers');
formData.append('entity_id', 'driver_123');
formData.append('category', 'license');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### Python/Backend

```python
import requests

# Upload a document
with open('license.pdf', 'rb') as file:
    files = {'file': file}
    data = {
        'entity_type': 'drivers',
        'entity_id': 'driver_123',
        'category': 'license'
    }
    
    response = requests.post(
        'http://localhost:5000/api/documents/upload',
        files=files,
        data=data,
        cookies={'session': 'your_session_cookie'}
    )
```

## Testing

### API Testing with cURL

```bash
# Test upload
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf" \
  -F "entity_type=drivers" \
  -F "entity_id=driver_123" \
  -F "category=license"

# Test download
curl -O http://localhost:5000/api/documents/download/doc_123

# Test bulk download
curl -X POST http://localhost:5000/api/documents/download-bulk \
  -H "Content-Type: application/json" \
  -d '{"document_ids": ["doc_123", "doc_456"]}'
```

### Frontend Testing

The system includes comprehensive Playwright MCP testing for:
- File upload workflows
- Arabic RTL behavior
- Error handling scenarios
- Performance monitoring
- Bulk operations

## Performance Benchmarks

### Upload Performance
- **Small files** (<1MB): ~2-3 seconds
- **Medium files** (1-5MB): ~5-10 seconds
- **Large files** (5-15MB): ~15-30 seconds

### Download Performance
- **Single file**: Immediate streaming
- **Bulk ZIP** (10 files): ~5-15 seconds
- **Bulk ZIP** (50+ files): ~30-60 seconds

## Security Considerations

### File Security
- All uploads validated for type and size
- Filenames sanitized to prevent path traversal
- Files stored outside web root
- No executable file types allowed

### Access Control
- Session-based authentication required
- Entity-level access control
- Admin-only maintenance endpoints
- Audit logging for all operations

## Changelog

### Version 1.0.0 (2025-01-22)
- Initial API release
- Complete CRUD operations for documents
- Arabic localization support
- Bulk operations with ZIP download
- Performance monitoring and cleanup
- Comprehensive error handling
- Full documentation and user guides
