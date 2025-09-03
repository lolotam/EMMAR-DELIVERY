# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Arabic delivery management system for Emar Delivery Company. Flask-based web application with JSON file storage, featuring Arabic RTL interface for managing drivers, vehicles, clients, orders, payroll, and document attachments.

## Development Commands

### Running the Application
```bash
python app.py
```
The application runs on http://localhost:5000 by default.

### Testing
Test files are prefixed with `test_` and use standard Python unittest framework:
```bash
python -m pytest test_*.py
```

### Python Environment
- Python 3.8+ required
- Install dependencies: `pip install -r requirements.txt`

## Architecture

### Backend (Flask)
- **app.py**: Main Flask application with all routes and business logic
- **utils/**: Modular utilities for specific functionality
  - `auth.py`: Authentication and session management
  - `json_store.py`: Thread-safe JSON file operations with file locking
  - `event_logger.py`: Action logging and audit trail
  - `commissions.py`: Commission calculation logic
  - `payroll.py`: Salary and advance processing

### Frontend (SPA)
- **templates/index.html**: Single-page application entry point
- **static/js/app.js**: Main SPA controller with hash-based routing
- **static/js/api.js**: API communication layer
- **static/js/components/**: Reusable UI components (DataTable, FormModal)
- **static/js/utils/**: Client-side utilities (ErrorManager, ValidationManager, FileUploadManager)
- **static/js/documents.js**: Document management functionality
- **static/js/entity-document-*.js**: Entity-specific document operations

### Data Storage
- **data/**: JSON files for all application data
  - Core entities: drivers.json, vehicles.json, clients.json, orders.json
  - Financial: advances.json, payroll_runs.json, commission_rules.json
  - Operations: maintenance_schedules.json, breakdowns.json, event_log.json
  - Documents: documents.json (metadata), uploads/ (file storage)
- **data/backup/**: Automatic daily backups organized by date

### Document System
- **uploads/documents/**: Organized by entity type (drivers/, vehicles/, other/)
- **Document metadata**: Stored in documents.json with file references
- **File operations**: Upload, download, delete with security validation

## Key Features

### Arabic RTL Interface
- Bootstrap 5 RTL with Tajawal font
- Complete Arabic localization
- Date handling supports both Hijri and Gregorian formats

### Security Implementation
- Session-based authentication with CSRF protection
- File upload validation and secure filename handling
- Rate limiting and security headers (Talisman)
- Environment-based configuration (.env support)

### Business Logic
- **Commission System**: Flexible per-driver and per-client commission rates
- **Payroll Processing**: Automated salary calculation with advance deduction
- **Maintenance Scheduling**: Proactive vehicle maintenance tracking
- **Document Management**: Entity-linked file attachments with metadata

### Data Integrity
- Thread-safe JSON operations with file locking
- Atomic updates with rollback capability
- Event logging for audit trails
- Automatic backup system

## Development Guidelines

### Adding New Features
1. Backend routes in app.py follow RESTful patterns
2. Frontend components use consistent SPA architecture
3. Data models follow existing JSON schema patterns
4. Authentication required for all data operations

### File Upload Security
- Allowed extensions defined in config
- Files stored with UUID prefixes to prevent conflicts
- Metadata validation before storage
- Secure filename generation

### Testing Strategy
- Test files cover core functionality areas
- Focus on document operations, API endpoints, and data integrity
- Use existing test patterns for consistency

### Arabic Development Notes
- All user-facing text in Arabic
- RTL layout considerations for UI components
- Date formatting supports Arabic locale
- Error messages and validation in Arabic

[byterover-mcp]

# important 
always use byterover-retrieve-knowledge tool to get the related context before any tasks 
always use byterover-store-knowledge to store all the critical informations after sucessful tasks
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.