# Technical Documentation - Documents Management System
## Emar Delivery Company

### System Overview
The Documents Management System is a comprehensive web application built for managing driver, vehicle, and other documents for Emar Delivery Company. The system provides a modern, responsive interface with full Arabic RTL support.

### Architecture

#### Frontend Architecture
- **Framework**: Vanilla JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3
- **Styling**: CSS3 with CSS Custom Properties
- **Language Support**: Arabic RTL with English fallback
- **Responsive Design**: Mobile-first approach

#### Backend Architecture
- **Framework**: Python Flask
- **Database**: JSON-based file storage
- **File Storage**: Local filesystem with security
- **Authentication**: Session-based authentication
- **API**: RESTful API design

#### Key Components

##### Frontend Components
1. **DocumentsManager**: Main application controller
2. **DocumentModal**: Document viewing and management
3. **UploadModal**: File upload interface
4. **APICache**: Performance optimization
5. **ErrorHandler**: Error management
6. **BulkOperations**: Multi-document operations
7. **UXUtils**: User experience utilities

##### Backend Components
1. **Flask Application**: Main server application
2. **JSON Store**: Data persistence layer
3. **File Manager**: File upload/download handling
4. **Authentication**: User session management
5. **API Endpoints**: RESTful service layer

### API Documentation

#### Core Endpoints

##### Document Upload
```
POST /api/documents/upload
Content-Type: multipart/form-data

Parameters:
- file: File to upload
- entity_type: 'driver', 'vehicle', or 'other'
- entity_id: ID of the entity (for driver/vehicle)
- display_name: Display name for the document
- category: Document category
- status: Document status
- notes: Optional notes

Response:
{
  "success": true,
  "message": "تم رفع الملف بنجاح",
  "document": {
    "id": "document_id",
    "original_filename": "filename.pdf",
    "display_name": "Document Name",
    "file_url": "/api/documents/download/document_id"
  }
}
```

##### Document Listing
```
GET /api/documents?entity_type=driver&entity_id=123

Response:
{
  "documents": [...],
  "total_documents": 10,
  "stats": {
    "total_documents": 10,
    "by_status": {...},
    "by_category": {...}
  }
}
```

##### Bulk Download
```
POST /api/documents/bulk/download
Content-Type: application/json

Body:
{
  "document_ids": ["id1", "id2", "id3"]
}

Response: ZIP file download
```

##### Document Search
```
GET /api/documents/search?q=search_term

Response:
{
  "documents": [...],
  "total_results": 5,
  "query": "search_term"
}
```

### Performance Features

#### Caching Strategy
- **API Cache**: 5-minute cache for API responses
- **Maximum Entries**: 100 cached items
- **Cache Keys**: Based on request parameters
- **Automatic Cleanup**: LRU eviction policy

#### Error Handling
- **Retry Logic**: Exponential backoff (3 retries)
- **Arabic Messages**: Localized error messages
- **Error Logging**: Client-side error tracking
- **Graceful Degradation**: Fallback mechanisms

#### UX Optimizations
- **Debounced Search**: 300ms delay
- **Skeleton Loading**: Visual loading states
- **Progress Tracking**: Upload/download progress
- **Animations**: Smooth transitions

### Security Features

#### File Validation
- **File Types**: Whitelist of allowed extensions
- **File Size**: 15MB maximum per file
- **MIME Type**: Server-side validation
- **Path Security**: Secure filename generation

#### Data Protection
- **Authentication**: Required for all operations
- **Session Management**: Secure session handling
- **Input Sanitization**: XSS protection
- **File Storage**: Secure directory structure

### Database Schema

#### Documents Collection
```json
{
  "id": "unique_document_id",
  "original_filename": "document.pdf",
  "stored_filename": "uuid___document.pdf",
  "display_name": "Document Display Name",
  "entity_type": "driver|vehicle|other",
  "entity_id": "entity_identifier",
  "category": "license|insurance|registration|other",
  "status": "active|expired|expiring_soon|missing",
  "mime_type": "application/pdf",
  "size_bytes": 1024000,
  "file_path": "/path/to/file",
  "uploaded_at": "2025-08-22T12:00:00Z",
  "notes": "Optional notes",
  "metadata": {
    "uploader": "user_id",
    "checksum": "file_hash"
  }
}
```

### File Structure
```
emar-delivery/
├── app.py                 # Main Flask application
├── static/
│   ├── js/
│   │   ├── documents.js   # Main documents management
│   │   └── app.js         # Core application
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── uploads/           # File storage
├── templates/
│   └── documents.html     # Main template
├── utils/
│   ├── json_store.py      # Data persistence
│   ├── auth.py            # Authentication
│   └── event_logger.py    # Logging
└── docs/                  # Documentation
```

### Deployment Guide

#### Requirements
- Python 3.8+
- Flask 2.0+
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

#### Installation
```bash
# Clone repository
git clone <repository_url>
cd emar-delivery

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=development

# Run application
flask run
```

#### Production Configuration
```python
# Production settings
DEBUG = False
SECRET_KEY = 'your-secret-key'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
UPLOAD_FOLDER = '/secure/upload/path'
```

### Monitoring and Maintenance

#### Performance Monitoring
- **Response Times**: Monitor API response times
- **Error Rates**: Track error frequency
- **Cache Hit Ratio**: Monitor cache effectiveness
- **File Storage**: Monitor disk usage

#### Maintenance Tasks
- **Log Rotation**: Regular log file cleanup
- **Cache Cleanup**: Periodic cache clearing
- **File Cleanup**: Remove orphaned files
- **Database Backup**: Regular data backups

### Browser Compatibility
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

### Accessibility Features
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **RTL Support**: Right-to-left language support
- **Screen Reader**: Arabic announcements

---
**Version**: 1.0  
**Last Updated**: August 2025  
**Emar Delivery Company**
