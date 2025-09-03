# Implementation Guide for Augment IDE - Emar Delivery Arabic App

## Instructions for Augment IDE

Create a complete Arabic web application for Emar Delivery Company based on the PRD specifications. The application should be fully functional with Arabic RTL interface and local JSON storage.

## Project Structure to Create

```
emar-delivery/
├── app.py                      # Flask backend server
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css          # RTL Arabic styles
│   ├── js/
│   │   ├── app.js             # Main application logic
│   │   ├── api.js             # API calls to backend
│   │   ├── utils.js           # Utility functions
│   │   └── components/        # UI components
│   └── images/                # Icons and logos
├── templates/
│   └── index.html             # Main HTML template
├── data/                      # JSON data files
│   ├── config.json
│   ├── drivers.json
│   ├── vehicles.json
│   ├── clients.json
│   ├── orders.json
│   ├── advances.json
│   ├── payroll_runs.json
│   ├── payroll_items.json
│   ├── maintenance_schedules.json
│   ├── maintenance_logs.json
│   └── commission_rules.json
├── utils/
│   ├── __init__.py
│   ├── json_store.py          # JSON file operations with locking
│   ├── payroll.py             # Payroll calculations
│   ├── commissions.py         # Commission calculations
│   └── auth.py                # Authentication logic
├── exports/                   # Generated reports folder
└── README.md                  # Setup instructions in Arabic

```

## Key Implementation Requirements

### 1. Flask Backend (app.py)

```python
# Essential imports and setup
from flask import Flask, render_template, jsonify, request, session
from flask_cors import CORS
import json
import uuid
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
CORS(app)

# Arabic configuration
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_MIMETYPE'] = "application/json; charset=utf-8"
```

### 2. HTML Template Requirements (index.html)

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>شركة إعمار لتوصيل الطلبات</title>
    <!-- Bootstrap 5 RTL -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Arabic Font -->
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
```

### 3. CSS Requirements (style.css)

```css
/* Arabic RTL Styling */
* {
    font-family: 'Tajawal', sans-serif;
}

body {
    direction: rtl;
    text-align: right;
}

/* Dashboard cards */
.dashboard-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* Sidebar navigation */
.sidebar {
    background: #2c3e50;
    min-height: 100vh;
    padding: 20px 0;
}

.sidebar a {
    color: #ecf0f1;
    text-decoration: none;
    padding: 15px 20px;
    display: block;
    transition: all 0.3s;
}

.sidebar a:hover {
    background: #34495e;
    border-right: 4px solid #3498db;
}

.sidebar a.active {
    background: #34495e;
    border-right: 4px solid #e74c3c;
}
```

### 4. JavaScript Structure (app.js)

```javascript
// Single Page Application Structure
const App = {
    currentUser: null,
    currentPage: 'dashboard',
    
    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboard();
    },
    
    pages: {
        dashboard: 'لوحة التحكم',
        drivers: 'السائقون',
        vehicles: 'السيارات',
        clients: 'العملاء',
        orders: 'الطلبات',
        advances: 'السُلف والمديونيات',
        payroll: 'الرواتب',
        maintenance: 'الصيانة',
        reports: 'التقارير',
        settings: 'الإعدادات'
    }
};
```

### 5. API Endpoints to Implement

```python
# Authentication
@app.route('/api/login', methods=['POST'])
def login():
    # Check against config.json admin credentials
    pass

# Drivers CRUD
@app.route('/api/drivers', methods=['GET', 'POST'])
@app.route('/api/drivers/<id>', methods=['GET', 'PUT', 'DELETE'])

# Vehicles CRUD
@app.route('/api/vehicles', methods=['GET', 'POST'])
@app.route('/api/vehicles/<id>', methods=['GET', 'PUT', 'DELETE'])

# Clients CRUD
@app.route('/api/clients', methods=['GET', 'POST'])
@app.route('/api/clients/<id>', methods=['GET', 'PUT', 'DELETE'])

# Orders CRUD with commission calculation
@app.route('/api/orders', methods=['GET', 'POST'])
@app.route('/api/orders/<id>', methods=['GET', 'PUT', 'DELETE'])

# Advances management
@app.route('/api/advances', methods=['GET', 'POST'])
@app.route('/api/advances/<id>', methods=['GET', 'PUT', 'DELETE'])

# Payroll operations
@app.route('/api/payroll/run', methods=['POST'])
@app.route('/api/payroll/approve/<id>', methods=['POST'])
@app.route('/api/payroll/close/<id>', methods=['POST'])

# Maintenance
@app.route('/api/maintenance/schedules', methods=['GET', 'POST'])
@app.route('/api/maintenance/logs', methods=['GET', 'POST'])

# Reports
@app.route('/api/reports/driver-statement', methods=['GET'])
@app.route('/api/reports/export', methods=['POST'])

# Dashboard stats
@app.route('/api/dashboard/stats', methods=['GET'])
```

### 6. UI Components to Create

#### Login Page
```html
<div class="login-container">
    <div class="login-card">
        <h2>شركة إعمار لتوصيل الطلبات</h2>
        <form id="loginForm">
            <div class="mb-3">
                <label>اسم المستخدم</label>
                <input type="text" class="form-control" id="username">
            </div>
            <div class="mb-3">
                <label>كلمة المرور</label>
                <input type="password" class="form-control" id="password">
            </div>
            <button type="submit" class="btn btn-primary w-100">دخول</button>
        </form>
    </div>
</div>
```

#### Dashboard Layout
```html
<div class="container-fluid">
    <div class="row">
        <!-- Sidebar -->
        <div class="col-md-2 sidebar">
            <h4 class="text-white mb-4">إعمار للتوصيل</h4>
            <nav id="sidebarNav">
                <!-- Dynamic navigation items -->
            </nav>
        </div>
        
        <!-- Main Content -->
        <div class="col-md-10">
            <div id="mainContent">
                <!-- Dynamic content based on selected page -->
            </div>
        </div>
    </div>
</div>
```

#### Dashboard KPI Cards
```html
<div class="row" id="kpiCards">
    <div class="col-md-3">
        <div class="dashboard-card">
            <i class="fas fa-shopping-cart fa-2x mb-3"></i>
            <h5>الطلبات هذا الشهر</h5>
            <h2 id="monthlyOrders">0</h2>
        </div>
    </div>
    <div class="col-md-3">
        <div class="dashboard-card">
            <i class="fas fa-money-bill-wave fa-2x mb-3"></i>
            <h5>صافي الرواتب المتوقع</h5>
            <h2 id="expectedSalaries">0 KWD</h2>
        </div>
    </div>
    <div class="col-md-3">
        <div class="dashboard-card">
            <i class="fas fa-hand-holding-usd fa-2x mb-3"></i>
            <h5>السُلف غير المسددة</h5>
            <h2 id="outstandingAdvances">0 KWD</h2>
        </div>
    </div>
    <div class="col-md-3">
        <div class="dashboard-card">
            <i class="fas fa-wrench fa-2x mb-3"></i>
            <h5>صيانات مستحقة</h5>
            <h2 id="dueMaintenance">0</h2>
        </div>
    </div>
</div>
```

### 7. Data Tables Structure

```javascript
// Generic table component
function createDataTable(containerId, columns, data, actions) {
    const html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <h5>${getPageTitle()}</h5>
                <button class="btn btn-success" onclick="openAddModal()">
                    <i class="fas fa-plus"></i> إضافة جديد
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover" id="${containerId}">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col.label}</th>`).join('')}
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTableRows(data, columns, actions)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    return html;
}
```

### 8. Form Modals

```javascript
// Generic form modal
function createFormModal(title, fields, onSave) {
    const modal = `
        <div class="modal fade" id="formModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="dataForm">
                            ${renderFormFields(fields)}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" onclick="saveData()">حفظ</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    return modal;
}
```

### 9. Commission Calculation Logic

```javascript
// Calculate commission for order
async function calculateOrderCommission(driverId, clientId, orderDate) {
    const response = await fetch('/api/calculate-commission', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            driver_id: driverId,
            client_id: clientId,
            date: orderDate
        })
    });
    const data = await response.json();
    return data.commission;
}
```

### 10. Payroll Processing Interface

```javascript
// Payroll run interface
function createPayrollInterface() {
    return `
        <div class="card">
            <div class="card-header">
                <h5>تشغيل الرواتب</h5>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label>الشهر</label>
                        <select class="form-select" id="payrollMonth">
                            <option value="1">يناير</option>
                            <option value="2">فبراير</option>
                            <!-- etc -->
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>السنة</label>
                        <input type="number" class="form-control" id="payrollYear" value="2025">
                    </div>
                    <div class="col-md-3 d-flex align-items-end">
                        <button class="btn btn-primary" onclick="runPayroll()">
                            <i class="fas fa-play"></i> تشغيل الرواتب
                        </button>
                    </div>
                </div>
                <div id="payrollResults"></div>
            </div>
        </div>
    `;
}
```

## Initial Data Files

### config.json
```json
{
  "app_name": "شركة إعمار لتوصيل الطلبات",
  "currency": "KWD",
  "global_commission_per_order": 0.250,
  "admin": {
    "username": "admin",
    "password": "@Xx123456789xX@"
  }
}
```

### Sample drivers.json
```json
[
  {
    "id": "d1",
    "full_name": "أحمد محمد علي",
    "phone": "+96599887766",
    "national_id": "285010112345",
    "employment_type": "commission",
    "car_ownership": "private",
    "base_salary": 0,
    "default_commission_per_order": 0.300,
    "max_advance_limit": 500,
    "advance_deduction_mode": "fixed_amount",
    "advance_deduction_value": 50,
    "primary_client_id": null,
    "secondary_client_id": null,
    "is_active": true,
    "hire_date": "2024-01-15"
  }
]
```

## Features to Implement in Order

1. **Phase 1: Core Setup**
   - Flask server with JSON storage
   - Login page with Arabic UI
   - Main layout with sidebar navigation
   - Dashboard with KPI cards

2. **Phase 2: Basic CRUD**
   - Drivers management
   - Vehicles management
   - Clients management
   - Basic data tables with add/edit/delete

3. **Phase 3: Orders & Commission**
   - Orders management
   - Automatic commission calculation
   - Order status tracking

4. **Phase 4: Financial**
   - Advances management
   - Payroll processing
   - Automatic advance deduction

5. **Phase 5: Maintenance & Reports**
   - Vehicle maintenance scheduling
   - Maintenance logs
   - Basic reports
   - CSV/Excel export

## Testing Checklist

- [ ] Login works with admin credentials
- [ ] All pages load correctly in Arabic RTL
- [ ] CRUD operations work for all entities
- [ ] Commission calculates correctly based on priority rules
- [ ] Payroll processes correctly with advance deductions
- [ ] Maintenance alerts show for due vehicles
- [ ] Reports export to CSV/Excel
- [ ] Data persists in JSON files
- [ ] Responsive design works on mobile

## Important Notes for Augment

1. **Use Arabic text** for all UI elements
2. **Maintain RTL layout** throughout
3. **Use Bootstrap 5 RTL** for styling
4. **Store all data in JSON files** as specified
5. **Implement file locking** for concurrent access
6. **Add proper validation** for all forms
7. **Include error handling** for all operations
8. **Use modern JavaScript** (ES6+) features
9. **Make it fully responsive** for mobile devices
10. **Add loading indicators** for async operations

## Color Scheme

- Primary: #3498db (Blue)
- Success: #27ae60 (Green)
- Warning: #f39c12 (Orange)
- Danger: #e74c3c (Red)
- Dark: #2c3e50 (Dark Blue)
- Light: #ecf0f1 (Light Gray)

## Libraries to Use

- **Frontend:**
  - Bootstrap 5 RTL
  - Font Awesome 6
  - Chart.js (for dashboard charts)
  - DataTables (for advanced tables)
  - SweetAlert2 (for beautiful alerts)
  - Flatpickr (for date pickers)

- **Backend:**
  - Flask
  - Flask-CORS
  - python-dateutil
  - openpyxl (for Excel export)

## Final Implementation Tips

1. Start with a working login system
2. Build the navigation structure
3. Implement one CRUD module completely before moving to others
4. Test JSON file operations thoroughly
5. Add Arabic number formatting (١٢٣ or 123)
6. Implement proper session management
7. Add breadcrumbs for navigation
8. Include search and filter capabilities
9. Add print-friendly views for reports
10. Implement auto-save for forms

This guide should help Augment IDE create the complete Arabic application based on the PRD specifications.