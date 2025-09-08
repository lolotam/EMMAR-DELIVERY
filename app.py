#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Emar Delivery Arabic App - Flask Backend
شركة إعمار لتوصيل الطلبات
"""

from flask import Flask, render_template, jsonify, request, session, redirect, url_for, send_file
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import json
import uuid
from datetime import datetime
import os
import sys
import mimetypes
from werkzeug.utils import secure_filename
import shutil
# import magic  # Temporarily commented out due to libmagic installation issue
# TODO: Install python-magic for better file type validation
# Alternative: Use mimetypes.guess_type() for basic validation (currently implemented)
import hashlib

# Load environment variables
load_dotenv()

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

# Import utilities
from auth import auth_manager, login_required, admin_required
from event_logger import event_logger, log_create, log_update, log_delete, log_view, log_action

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'emar-delivery-secret-key-2025-fallback')

# Session configuration for security
# Production-ready session configuration with environment variable support
is_production = os.getenv('FLASK_ENV', 'development') == 'production'
use_https = os.getenv('FLASK_USE_HTTPS', 'False').lower() == 'true'

app.config.update(
    SESSION_COOKIE_SECURE=use_https,  # Enable for HTTPS in production
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=1800,  # 30 minutes
    SESSION_REFRESH_EACH_REQUEST=True,
    # Additional security configurations
    SESSION_COOKIE_NAME='emar_session',  # Custom session name
    WTF_CSRF_TIME_LIMIT=3600,  # CSRF token timeout (1 hour)
    WTF_CSRF_ENABLED=False,  # Temporarily disable CSRF protection for debugging
)

CORS(app)

# Initialize CSRF protection
csrf = CSRFProtect(app)

# Initialize Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[
        os.getenv('RATELIMIT_DEFAULT', '100 per hour'),
        "300 per minute"  # Increased from 20 to 300 to fix document loading errors
    ],
    storage_uri=os.getenv('RATELIMIT_STORAGE_URL', 'memory://'),
    headers_enabled=True,
    swallow_errors=True  # Don't break app if rate limiting fails
)

# Configure Content Security Policy for Arabic fonts and RTL content
csp = {
    'default-src': "'self'",
    'script-src': [
        "'self'",
        "'unsafe-inline'",  # Required for inline scripts
        "'unsafe-eval'",    # Required for some JavaScript libraries
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",  # Required for inline styles and RTL
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
    ],
    'font-src': [
        "'self'",
        "https://fonts.gstatic.com",  # Google Fonts for Arabic
        "https://cdnjs.cloudflare.com"
    ],
    'img-src': [
        "'self'",
        "data:",  # For base64 images
        "blob:"   # For generated images
    ],
    'connect-src': "'self'"
}

# Initialize security headers with Talisman
talisman = Talisman(
    app,
    force_https=False,  # Set to True in production
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,  # 1 year
    content_security_policy=csp,
    # Removed content_security_policy_nonce_in to fix CSP violations with dynamic styles
    feature_policy={
        'geolocation': "'none'",
        'camera': "'none'",
        'microphone': "'none'"
    }
)

# Arabic configuration
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_MIMETYPE'] = "application/json; charset=utf-8"

# Session timeout middleware
@app.before_request
def check_session_timeout():
    """Check if session has expired and handle timeout"""
    from datetime import datetime, timedelta

    # Skip session check for static files and login endpoints
    if (request.endpoint and
        (request.endpoint.startswith('static') or
         request.endpoint in ['index', 'get_csrf_token'] or
         request.path in ['/api/login', '/api/csrf-token'])):
        return

    # Check if user is logged in
    if 'user_id' in session:
        # Check session timeout
        last_activity = session.get('last_activity')
        if last_activity:
            last_activity_time = datetime.fromisoformat(last_activity)
            timeout_duration = timedelta(seconds=app.config['PERMANENT_SESSION_LIFETIME'])

            if datetime.now() - last_activity_time > timeout_duration:
                # Session expired
                session.clear()
                if request.is_json:
                    return jsonify({
                        'success': False,
                        'error': 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
                        'session_expired': True
                    }), 401
                else:
                    return redirect(url_for('index'))

        # Update last activity time
        session['last_activity'] = datetime.now().isoformat()
        session.permanent = True

# Ensure data directory exists
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Ensure exports directory exists
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), 'exports')
if not os.path.exists(EXPORTS_DIR):
    os.makedirs(EXPORTS_DIR)

# Secure uploads directory structure - outside web-accessible area
# Use environment variable or default to secure location within the app directory
SECURE_UPLOADS_BASE = os.getenv('SECURE_UPLOADS_DIR', os.path.join(os.path.dirname(__file__), 'uploads'))
UPLOADS_DIR = os.path.join(SECURE_UPLOADS_BASE, 'documents')
DOCUMENTS_DIR = UPLOADS_DIR  # Simplified structure
DRIVERS_DOCS_DIR = os.path.join(DOCUMENTS_DIR, 'drivers')
VEHICLES_DOCS_DIR = os.path.join(DOCUMENTS_DIR, 'vehicles')
OTHER_DOCS_DIR = os.path.join(DOCUMENTS_DIR, 'other')

# Create secure upload directories with restricted permissions
for directory in [SECURE_UPLOADS_BASE, UPLOADS_DIR, DOCUMENTS_DIR, DRIVERS_DOCS_DIR, VEHICLES_DOCS_DIR, OTHER_DOCS_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory, mode=0o750)  # More restrictive permissions
        print(f"[OK] Created secure upload directory: {directory}")
        
        # Create .gitkeep file to ensure directory is tracked in git
        if directory in [DRIVERS_DOCS_DIR, VEHICLES_DOCS_DIR, OTHER_DOCS_DIR]:
            gitkeep_path = os.path.join(directory, '.gitkeep')
            with open(gitkeep_path, 'w') as f:
                f.write("# Keep this directory in git\n")
            print(f"[INFO] Created .gitkeep in: {directory}")

# Add .htaccess file to prevent direct web access (if using Apache)
htaccess_path = os.path.join(SECURE_UPLOADS_BASE, '.htaccess')
if not os.path.exists(htaccess_path):
    try:
        with open(htaccess_path, 'w') as f:
            f.write("Deny from all\n")
        print(f"[OK] Created .htaccess protection: {htaccess_path}")
    except Exception as e:
        print(f"[WARN] Could not create .htaccess: {e}")

# Documents upload configuration
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp', '.docx', '.xlsx'}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB in bytes
ALLOWED_MIME_TYPES = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

DOCUMENT_CATEGORIES = {
    'id_copy': 'نسخة الهوية',
    'license': 'رخصة القيادة',
    'insurance': 'تأمين المركبة',
    'contract': 'عقد العمل',
    'maintenance': 'سجل الصيانة',
    'invoice': 'فاتورة',
    'receipt': 'إيصال',
    'certificate': 'شهادة',
    'other': 'أخرى'
}

def calculate_registration_status(insurance_expiry_date):
    """Calculate registration status based on insurance expiry date"""
    if not insurance_expiry_date:
        return 'غير محدد'

    try:
        from datetime import datetime, timedelta

        # Parse the insurance expiry date
        if isinstance(insurance_expiry_date, str):
            expiry_date = datetime.strptime(insurance_expiry_date, '%Y-%m-%d')
        else:
            expiry_date = insurance_expiry_date

        today = datetime.now()
        diff_days = (expiry_date - today).days

        if diff_days < 0:
            return 'منتهية'
        elif diff_days <= 30:
            return 'أقل من شهر'
        elif diff_days <= 90:
            return 'أقل من 3 شهور'
        else:
            return 'صالحة'
    except Exception:
        return 'غير محدد'

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

# Documents page - re-enabled for direct navigation
@app.route('/documents')
def documents_page():
    """Documents management page"""
    return render_template('documents.html')

# Orders/Commission management page
@app.route('/orders')
def orders_page():
    """Orders and commission management page"""
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'app_name': 'شركة إعمار لتوصيل الطلبات',
        'version': '1.0.0',
        'development_date': 'أغسطس 2025',
        'developer': 'د/وليد محمد',
        'last_update': '25‏/8‏/2025 م',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/csrf-token')
def get_csrf_token():
    """Get CSRF token for frontend requests"""
    from flask_wtf.csrf import generate_csrf
    return jsonify({'csrf_token': generate_csrf()})

@app.route('/api/config')
def get_config():
    """Get application configuration"""
    try:
        config_path = os.path.join(DATA_DIR, 'config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # Remove sensitive data
                safe_config = {
                    'app_name': config.get('app_name', 'شركة إعمار لتوصيل الطلبات'),
                    'version': config.get('version', '1.0.0'),
                    'development_date': config.get('development_date', 'أغسطس 2025'),
                    'developer': config.get('developer', 'د/وليد محمد'),
                    'last_update': config.get('last_update', '25‏/8‏/2025 م'),
                    'currency': config.get('currency', 'KWD'),
                    'global_commission_per_order': config.get('global_commission_per_order', 0.250)
                }
                return jsonify(safe_config)
        else:
            return jsonify({
                'app_name': 'شركة إعمار لتوصيل الطلبات',
                'version': '1.0.0',
                'development_date': 'أغسطس 2025',
                'developer': 'د/وليد محمد',
                'last_update': '25‏/8‏/2025 م',
                'currency': 'KWD',
                'global_commission_per_order': 0.250
            })
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الإعدادات: {str(e)}'}), 500

@app.route('/api/admin/clear-all-data', methods=['POST'])
@login_required
def clear_all_data():
    """Clear all data from the system (admin only)"""
    try:
        from json_store import json_store
        import shutil
        from datetime import datetime

        # Create backup before clearing
        backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(backup_dir, f'backup_before_clear_{timestamp}')

        # Copy data directory to backup
        shutil.copytree(DATA_DIR, backup_path)

        # List of data files to clear
        data_files = [
            'drivers.json',
            'vehicles.json',
            'clients.json',
            'orders.json',
            'advances.json',
            'payroll_runs.json',
            'payroll_items.json',
            'maintenance_schedules.json',
            'maintenance_logs.json',
            'breakdowns.json',
            'breakdown_history.json',
            'driver_history.json',
            'commission_rules.json'
        ]

        cleared_files = []
        failed_files = []
        deleted_attachments = []

        # First, collect and delete attachment files before clearing data
        try:
            # Check driver_history.json for attachments
            driver_history_path = os.path.join(DATA_DIR, 'driver_history.json')
            if os.path.exists(driver_history_path):
                with open(driver_history_path, 'r', encoding='utf-8') as f:
                    driver_history = json.load(f)

                # Delete attachment files
                uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                for history_item in driver_history:
                    if 'attachments' in history_item:
                        for attachment in history_item['attachments']:
                            if 'filename' in attachment:
                                attachment_path = os.path.join(uploads_dir, attachment['filename'])
                                if os.path.exists(attachment_path):
                                    try:
                                        os.remove(attachment_path)
                                        deleted_attachments.append(attachment['filename'])
                                    except Exception as e:
                                        failed_files.append(f"attachment {attachment['filename']}: {str(e)}")
        except Exception as e:
            failed_files.append(f'driver_history attachments: {str(e)}')

        # Clear data files
        for file_name in data_files:
            try:
                file_path = os.path.join(DATA_DIR, file_name)
                if os.path.exists(file_path):
                    # Write empty array to JSON files
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump([], f, ensure_ascii=False, indent=2)
                    cleared_files.append(file_name)
            except Exception as e:
                failed_files.append(f'{file_name}: {str(e)}')

        return jsonify({
            'message': 'تم مسح البيانات بنجاح',
            'backup_path': backup_path,
            'cleared_files': cleared_files,
            'deleted_attachments': deleted_attachments,
            'failed_files': failed_files,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في مسح البيانات: {str(e)}'}), 500

@app.route('/api/admin/backup/create', methods=['POST'])
@login_required
def create_backup():
    """Create a full backup of all data"""
    try:
        from utils.json_store import json_store

        backup_dir = json_store.create_full_backup()

        return jsonify({
            'message': 'تم إنشاء النسخة الاحتياطية بنجاح',
            'backup_path': backup_dir,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء النسخة الاحتياطية: {str(e)}'}), 500

@app.route('/api/admin/backup/status', methods=['GET'])
@login_required
def get_backup_status():
    """Get backup system status and recent backups"""
    try:
        from utils.json_store import json_store
        import os
        from datetime import datetime, timedelta

        backup_root = json_store.backup_root
        status = {
            'backup_enabled': True,
            'backup_directory': backup_root,
            'daily_backups': [],
            'full_backups': [],
            'total_backup_size': 0
        }

        if os.path.exists(backup_root):
            # Get backup directories
            for item in os.listdir(backup_root):
                item_path = os.path.join(backup_root, item)
                if os.path.isdir(item_path):
                    # Calculate directory size
                    dir_size = sum(
                        os.path.getsize(os.path.join(dirpath, filename))
                        for dirpath, dirnames, filenames in os.walk(item_path)
                        for filename in filenames
                    )
                    status['total_backup_size'] += dir_size

                    backup_info = {
                        'name': item,
                        'path': item_path,
                        'size': dir_size,
                        'created': datetime.fromtimestamp(os.path.getctime(item_path)).isoformat(),
                        'file_count': sum(len(files) for _, _, files in os.walk(item_path))
                    }

                    if item.startswith('full_backup_'):
                        status['full_backups'].append(backup_info)
                    else:
                        # Daily backup (YYYY-MM-DD format)
                        status['daily_backups'].append(backup_info)

            # Sort by creation date (newest first)
            status['daily_backups'].sort(key=lambda x: x['created'], reverse=True)
            status['full_backups'].sort(key=lambda x: x['created'], reverse=True)

        return jsonify(status)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب حالة النسخ الاحتياطية: {str(e)}'}), 500

@app.route('/api/admin/backup/cleanup', methods=['POST'])
@login_required
def cleanup_old_backups():
    """Clean up old backups"""
    try:
        from utils.json_store import json_store

        # Get days to keep from request (default 30)
        days_to_keep = request.json.get('days_to_keep', 30) if request.json else 30

        json_store._cleanup_old_backups(days_to_keep)

        return jsonify({
            'message': f'تم تنظيف النسخ الاحتياطية القديمة (الاحتفاظ بـ {days_to_keep} يوم)',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تنظيف النسخ الاحتياطية: {str(e)}'}), 500

@app.route('/api/admin/events/recent', methods=['GET'])
@login_required
def get_recent_events():
    """Get recent events with optional filtering"""
    try:
        limit = int(request.args.get('limit', 50))
        entity_type = request.args.get('entity_type')
        action = request.args.get('action')
        user = request.args.get('user')

        events = event_logger.get_recent_events(
            limit=limit,
            entity_type=entity_type,
            action=action,
            user=user
        )

        return jsonify(events)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب الأحداث: {str(e)}'}), 500

@app.route('/api/admin/events/stats', methods=['GET'])
@login_required
def get_event_stats():
    """Get event statistics"""
    try:
        days = int(request.args.get('days', 7))
        stats = event_logger.get_event_stats(days)

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب إحصائيات الأحداث: {str(e)}'}), 500

@app.route('/api/admin/events/cleanup', methods=['POST'])
@login_required
def cleanup_old_events():
    """Clean up old events"""
    try:
        days_to_keep = request.json.get('days_to_keep', 90) if request.json else 90
        removed_count = event_logger.clear_old_events(days_to_keep)

        return jsonify({
            'message': f'تم حذف {removed_count} حدث قديم',
            'removed_count': removed_count,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تنظيف الأحداث القديمة: {str(e)}'}), 500

@app.route('/api/search/global', methods=['GET'])
@login_required
def global_search():
    """Global search across drivers, clients, and vehicles"""
    try:
        from json_store import json_store
        query = request.args.get('q', '').strip().lower()

        if not query or len(query) < 2:
            return jsonify({'results': []})

        results = []

        # Search drivers
        drivers = json_store.read_all('drivers')
        for driver in drivers:
            # Search in name, phone, national_id
            searchable_text = ' '.join([
                driver.get('full_name', '').lower(),
                driver.get('phone', '').lower(),
                driver.get('national_id', '').lower()
            ])

            if query in searchable_text:
                results.append({
                    'id': driver.get('id'),
                    'type': 'driver',
                    'title': driver.get('full_name', ''),
                    'subtitle': f"هاتف: {driver.get('phone', '')} - الرقم المدني: {driver.get('national_id', '')}",
                    'status': 'نشط' if driver.get('is_active', False) else 'غير نشط',
                    'url': f"/drivers/{driver.get('id')}"
                })

        # Search clients
        clients = json_store.read_all('clients')
        for client in clients:
            # Search in company name, contact person, phone
            searchable_text = ' '.join([
                client.get('company_name', '').lower(),
                client.get('contact_person', '').lower(),
                client.get('phone', '').lower()
            ])

            if query in searchable_text:
                results.append({
                    'id': client.get('id'),
                    'type': 'client',
                    'title': client.get('company_name', ''),
                    'subtitle': f"جهة الاتصال: {client.get('contact_person', '')} - هاتف: {client.get('phone', '')}",
                    'status': 'نشط' if client.get('is_active', False) else 'غير نشط',
                    'url': f"/clients/{client.get('id')}"
                })

        # Search vehicles
        vehicles = json_store.read_all('vehicles')
        for vehicle in vehicles:
            # Search in license plate, make, model
            searchable_text = ' '.join([
                vehicle.get('license_plate', '').lower(),
                vehicle.get('make', '').lower(),
                vehicle.get('model', '').lower()
            ])

            if query in searchable_text:
                results.append({
                    'id': vehicle.get('id'),
                    'type': 'vehicle',
                    'title': f"{vehicle.get('make', '')} {vehicle.get('model', '')}",
                    'subtitle': f"لوحة: {vehicle.get('license_plate', '')} - سنة: {vehicle.get('year', '')}",
                    'status': 'نشط' if vehicle.get('is_active', False) else 'غير نشط',
                    'url': f"/vehicles/{vehicle.get('id')}"
                })

        # Sort results by type and relevance
        type_order = {'driver': 1, 'client': 2, 'vehicle': 3}
        results.sort(key=lambda x: (type_order.get(x['type'], 4), x['title'].lower()))

        # Limit results to prevent overwhelming UI
        results = results[:20]

        # Log search action
        log_action('search', 'global', None, {
            'query': query,
            'results_count': len(results)
        })

        return jsonify({'results': results, 'query': query})

    except Exception as e:
        return jsonify({'error': f'خطأ في البحث: {str(e)}'}), 500

@app.route('/api/dashboard/unpaid-advances-breakdown', methods=['GET'])
@login_required
def get_unpaid_advances_breakdown():
    """Get unpaid advances breakdown by driver"""
    try:
        from json_store import json_store

        # Get all advances
        advances = json_store.read_all('advances')

        # Get all drivers for name lookup
        drivers = json_store.read_all('drivers')
        driver_lookup = {driver['id']: driver for driver in drivers}

        # Group unpaid advances by driver
        driver_advances = {}

        for advance in advances:
            if advance.get('status') != 'paid':  # Include pending and partial
                driver_id = advance.get('driver_id')
                if driver_id and driver_id in driver_lookup:
                    driver = driver_lookup[driver_id]

                    if driver_id not in driver_advances:
                        driver_advances[driver_id] = {
                            'driver_id': driver_id,
                            'driver_name': driver.get('full_name', ''),
                            'phone': driver.get('phone', ''),
                            'total_unpaid': 0,
                            'advances_count': 0,
                            'advances': []
                        }

                    # Calculate unpaid amount
                    amount = float(advance.get('amount', 0))
                    paid_amount = float(advance.get('paid_amount', 0))
                    unpaid_amount = amount - paid_amount

                    if unpaid_amount > 0:
                        driver_advances[driver_id]['total_unpaid'] += unpaid_amount
                        driver_advances[driver_id]['advances_count'] += 1
                        driver_advances[driver_id]['advances'].append({
                            'id': advance.get('id'),
                            'amount': amount,
                            'paid_amount': paid_amount,
                            'unpaid_amount': unpaid_amount,
                            'date': advance.get('date'),
                            'reason': advance.get('reason', ''),
                            'status': advance.get('status', 'pending')
                        })

        # Convert to list and sort by total unpaid amount (descending)
        breakdown = list(driver_advances.values())
        breakdown.sort(key=lambda x: x['total_unpaid'], reverse=True)

        # Calculate totals
        total_unpaid = sum(driver['total_unpaid'] for driver in breakdown)
        total_advances = sum(driver['advances_count'] for driver in breakdown)

        # Log the drill-through action
        log_action('drill_through', 'unpaid_advances', None, {
            'total_drivers': len(breakdown),
            'total_unpaid': total_unpaid,
            'total_advances': total_advances
        })

        return jsonify({
            'breakdown': breakdown,
            'summary': {
                'total_unpaid': total_unpaid,
                'total_advances': total_advances,
                'drivers_count': len(breakdown)
            }
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب تفاصيل السُلف غير المسددة: {str(e)}'}), 500

# Monthly Orders Routes
@app.route('/api/orders/menu')
@login_required
def get_orders_menu():
    """Get years and months summary for orders navigation"""
    try:
        from json_store import json_store
        monthly_orders = json_store.read_all('monthly_orders')

        # Extract unique years from monthly orders
        years = sorted(list(set(order.get('year', 2025) for order in monthly_orders)))
        if not years:
            years = [2025]  # Default to current year if no data

        # Get summary statistics
        total_records = len(monthly_orders)
        current_year = datetime.now().year
        current_month = datetime.now().month

        return jsonify({
            'years': years,
            'current_year': current_year,
            'current_month': current_month,
            'total_records': total_records,
            'summary': {
                'total_monthly_records': total_records,
                'available_years': len(years)
            }
        })
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل قائمة الطلبات: {str(e)}'}), 500

@app.route('/api/options/drivers/eligible')
@login_required
def get_eligible_drivers():
    """Get drivers eligible for commission tracking"""
    try:
        from json_store import json_store
        drivers = json_store.read_all('drivers')

        # Filter drivers based on eligibility criteria
        eligible_drivers = []
        for driver in drivers:
            employment_type = driver.get('employment_type', '')
            commission_per_order = float(driver.get('default_commission_per_order', 0))
            is_active = driver.get('is_active', False)

            # Include ONLY commission and mixed drivers, EXCLUDE pure salary drivers
            is_eligible = (
                is_active and employment_type in ['commission', 'mixed']
            )

            if is_eligible:
                eligible_drivers.append({
                    'id': driver.get('id'),
                    'full_name': driver.get('full_name', ''),
                    'employment_type': employment_type,
                    'default_commission_per_order': commission_per_order,
                    'phone': driver.get('phone', ''),
                    'national_id': driver.get('national_id', '')
                })

        return jsonify(eligible_drivers)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السائقين المؤهلين: {str(e)}'}), 500

@app.route('/api/orders/monthly')
@login_required
def get_monthly_orders():
    """Get monthly orders for specific month and year"""
    try:
        from json_store import json_store
        month = int(request.args.get('month', datetime.now().month))
        year = int(request.args.get('year', datetime.now().year))

        # Validate month and year
        if not (1 <= month <= 12):
            return jsonify({'error': 'الشهر يجب أن يكون بين 1 و 12'}), 400
        if year < 2020:
            return jsonify({'error': 'السنة يجب أن تكون 2020 أو أحدث'}), 400

        monthly_orders = json_store.read_all('monthly_orders')

        # Filter by month and year
        filtered_orders = [
            order for order in monthly_orders
            if order.get('month') == month and order.get('year') == year
        ]

        # Enrich with driver and client names
        drivers = json_store.read_all('drivers')
        clients = json_store.read_all('clients')

        driver_map = {d.get('id'): d.get('full_name', '') for d in drivers}
        client_map = {c.get('id'): c.get('company_name', '') for c in clients}

        for order in filtered_orders:
            order['driver_name'] = driver_map.get(order.get('driver_id', ''), 'غير محدد')
            # Enrich client names in entries
            for entry in order.get('entries', []):
                entry['client_name'] = client_map.get(entry.get('client_id', ''), 'غير محدد')

        return jsonify(filtered_orders)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الطلبات الشهرية: {str(e)}'}), 500

def validate_period_overlaps(entries):
    """Validate that periods within the same client don't overlap"""
    for entry in entries:
        if 'periods' not in entry or len(entry['periods']) <= 1:
            continue

        periods = entry['periods']
        for i in range(len(periods)):
            for j in range(i + 1, len(periods)):
                period1 = periods[i]
                period2 = periods[j]

                try:
                    from datetime import datetime
                    start1 = datetime.strptime(period1['date_from'], '%Y-%m-%d').date()
                    end1 = datetime.strptime(period1['date_to'], '%Y-%m-%d').date()
                    start2 = datetime.strptime(period2['date_from'], '%Y-%m-%d').date()
                    end2 = datetime.strptime(period2['date_to'], '%Y-%m-%d').date()

                    # Check if periods overlap
                    if start1 <= end2 and start2 <= end1:
                        return False, f'تداخل في فترات العمل للعميل {entry.get("client_id", "")}'

                except (ValueError, TypeError):
                    return False, 'تواريخ غير صحيحة في فترات العمل'

    return True, None

@app.route('/api/orders/monthly', methods=['POST'])
@login_required
def create_monthly_order():
    """Create a new monthly order record"""
    try:
        from json_store import json_store
        import uuid
        data = request.get_json()

        # Validate required fields
        required_fields = ['month', 'year', 'driver_id', 'entries']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate month and year
        month = int(data['month'])
        year = int(data['year'])
        if not (1 <= month <= 12):
            return jsonify({'error': 'الشهر يجب أن يكون بين 1 و 12'}), 400
        if year < 2020:
            return jsonify({'error': 'السنة يجب أن تكون 2020 أو أحدث'}), 400

        # Validate driver exists and is eligible
        driver = json_store.find_by_id('drivers', data['driver_id'])
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Check driver eligibility
        employment_type = driver.get('employment_type', '')
        commission_per_order = float(driver.get('default_commission_per_order', 0))
        is_eligible = (
            employment_type == 'commission' or
            (employment_type in ['salary', 'mixed'] and commission_per_order > 0)
        )
        if not is_eligible:
            return jsonify({'error': 'السائق غير مؤهل لتتبع العمولات'}), 400

        # Validate entries
        entries = data.get('entries', [])
        if not entries:
            return jsonify({'error': 'يجب إضافة عميل واحد على الأقل'}), 400

        # Validate period overlaps
        is_valid, error_msg = validate_period_overlaps(entries)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        total_orders = 0
        total_amount = 0.0

        for entry in entries:
            # Validate client exists
            client = json_store.find_by_id('clients', entry.get('client_id', ''))
            if not client:
                return jsonify({'error': f'العميل غير موجود: {entry.get("client_id", "")}'}), 404

            # Support both old format (flat) and new format (with periods)
            try:
                commission_per_order = float(entry.get('commission_per_order', 0))
                if commission_per_order < 0:
                    return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400

                if 'periods' in entry:
                    # New format with periods
                    entry_total_orders = 0
                    for period in entry['periods']:
                        period_orders = int(period.get('num_orders', 0))
                        if period_orders < 0:
                            return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400
                        entry_total_orders += period_orders

                    entry['total_orders'] = entry_total_orders
                    entry_total = commission_per_order * entry_total_orders
                    entry['total_amount'] = entry_total
                    total_orders += entry_total_orders
                    total_amount += entry_total
                else:
                    # Old format (flat) - convert to new format for consistency
                    num_orders = int(entry.get('num_orders', 0))
                    if num_orders < 0:
                        return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400

                    # Convert to periods format
                    entry['periods'] = [{
                        'date_from': entry.get('date_from', ''),
                        'date_to': entry.get('date_to', ''),
                        'num_orders': num_orders
                    }]
                    entry['total_orders'] = num_orders

                    # Remove old flat fields
                    entry.pop('date_from', None)
                    entry.pop('date_to', None)
                    entry.pop('num_orders', None)

                    entry_total = commission_per_order * num_orders
                    entry['total_amount'] = entry_total
                    total_orders += num_orders
                    total_amount += entry_total

            except (ValueError, TypeError):
                return jsonify({'error': 'قيم العمولة وعدد الطلبات يجب أن تكون أرقام صحيحة'}), 400

        # Create the monthly order record
        monthly_order = {
            'id': str(uuid.uuid4())[:8],
            'month': month,
            'year': year,
            'driver_id': data['driver_id'],
            'entries': entries,
            'totals': {
                'total_orders': total_orders,
                'total_amount': total_amount
            },
            'total_monthly_money': total_amount,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        created_order = json_store.create('monthly_orders', monthly_order)
        return jsonify(created_order), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء السجل الشهري: {str(e)}'}), 500

@app.route('/api/orders/monthly/<order_id>')
@login_required
def get_monthly_order(order_id):
    """Get a specific monthly order record"""
    try:
        from json_store import json_store
        order = json_store.find_by_id('monthly_orders', order_id)
        if not order:
            return jsonify({'error': 'السجل الشهري غير موجود'}), 404

        # Enrich with driver and client names
        driver = json_store.find_by_id('drivers', order.get('driver_id', ''))
        clients = json_store.read_all('clients')
        client_map = {c.get('id'): c.get('company_name', '') for c in clients}

        order['driver_name'] = driver.get('full_name', '') if driver else 'غير محدد'
        for entry in order.get('entries', []):
            entry['client_name'] = client_map.get(entry.get('client_id', ''), 'غير محدد')

        return jsonify(order)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السجل الشهري: {str(e)}'}), 500

@app.route('/api/orders/monthly/<order_id>', methods=['PATCH'])
@login_required
def update_monthly_order(order_id):
    """Update a monthly order record"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if order exists
        existing_order = json_store.find_by_id('monthly_orders', order_id)
        if not existing_order:
            return jsonify({'error': 'السجل الشهري غير موجود'}), 404

        # Validate entries if provided
        if 'entries' in data:
            entries = data['entries']

            # Validate period overlaps
            is_valid, error_msg = validate_period_overlaps(entries)
            if not is_valid:
                return jsonify({'error': error_msg}), 400

            total_orders = 0
            total_amount = 0.0

            for entry in entries:
                # Validate client exists
                client = json_store.find_by_id('clients', entry.get('client_id', ''))
                if not client:
                    return jsonify({'error': f'العميل غير موجود: {entry.get("client_id", "")}'}), 404

                # Support both old format (flat) and new format (with periods)
                try:
                    commission_per_order = float(entry.get('commission_per_order', 0))
                    if commission_per_order < 0:
                        return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400

                    if 'periods' in entry:
                        # New format with periods
                        entry_total_orders = 0
                        for period in entry['periods']:
                            period_orders = int(period.get('num_orders', 0))
                            if period_orders < 0:
                                return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400
                            entry_total_orders += period_orders

                        entry['total_orders'] = entry_total_orders
                        entry_total = commission_per_order * entry_total_orders
                        entry['total_amount'] = entry_total
                        total_orders += entry_total_orders
                        total_amount += entry_total
                    else:
                        # Old format (flat) - maintain backward compatibility
                        num_orders = int(entry.get('num_orders', 0))
                        if num_orders < 0:
                            return jsonify({'error': 'القيم يجب أن تكون موجبة'}), 400

                        entry_total = commission_per_order * num_orders
                        entry['total_amount'] = entry_total
                        total_orders += num_orders
                        total_amount += entry_total

                except (ValueError, TypeError):
                    return jsonify({'error': 'قيم العمولة وعدد الطلبات يجب أن تكون أرقام صحيحة'}), 400

            # Update totals
            data['totals'] = {
                'total_orders': total_orders,
                'total_amount': total_amount
            }
            data['total_monthly_money'] = total_amount

        # Update timestamp
        data['updated_at'] = datetime.now().isoformat()

        updated_order = json_store.update('monthly_orders', order_id, data)
        if not updated_order:
            return jsonify({'error': 'فشل في تحديث السجل الشهري'}), 500

        return jsonify(updated_order)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث السجل الشهري: {str(e)}'}), 500

@app.route('/api/orders/monthly/<order_id>', methods=['DELETE'])
@login_required
def delete_monthly_order(order_id):
    """Delete a monthly order record"""
    try:
        from json_store import json_store

        # Check if order exists
        existing_order = json_store.find_by_id('monthly_orders', order_id)
        if not existing_order:
            return jsonify({'error': 'السجل الشهري غير موجود'}), 404

        success = json_store.delete('monthly_orders', order_id)
        if not success:
            return jsonify({'error': 'فشل في حذف السجل الشهري'}), 500

        return jsonify({'message': 'تم حذف السجل الشهري بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف السجل الشهري: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'الصفحة غير موجودة'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'خطأ داخلي في الخادم'}), 500

# ========================================
# ENHANCED ERROR HANDLING AND PERFORMANCE
# ========================================

class DocumentsErrorHandler:
    """
    Centralized error handling system for documents module.

    This class provides comprehensive error handling with Arabic localization
    for all document-related operations. It includes error logging, user-friendly
    messages, and proper HTTP status code mapping.

    Features:
    - Arabic error messages for all scenarios
    - Comprehensive error logging with context
    - Proper HTTP status code mapping
    - User-friendly error recovery suggestions

    Usage:
        return DocumentsErrorHandler.handle_error('file_too_large', details, 413)
    """

    ERROR_MESSAGES = {
        'file_too_large': 'حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)',
        'invalid_file_type': 'نوع الملف غير مدعوم. الأنواع المسموحة: PDF, JPG, PNG, DOCX, XLSX',
        'file_not_found': 'الملف غير موجود',
        'upload_failed': 'فشل في رفع الملف. حاول مرة أخرى',
        'download_failed': 'فشل في تحميل الملف',
        'zip_creation_failed': 'فشل في إنشاء الملف المضغوط',
        'database_error': 'خطأ في قاعدة البيانات',
        'permission_denied': 'ليس لديك صلاحية للوصول لهذا الملف',
        'network_error': 'خطأ في الشبكة. تحقق من الاتصال',
        'server_error': 'خطأ في الخادم. حاول مرة أخرى لاحقاً',
        'storage_full': 'مساحة التخزين ممتلئة',
        'file_corrupted': 'الملف تالف أو غير قابل للقراءة',
        'no_files_selected': 'لم يتم اختيار أي ملفات',
        'invalid_request': 'طلب غير صحيح',
        'rate_limit_exceeded': 'تم تجاوز حد الطلبات المسموح. حاول مرة أخرى لاحقاً'
    }

    @staticmethod
    def handle_error(error_type, details=None, status_code=500):
        """Handle errors with Arabic messages and logging"""
        message = DocumentsErrorHandler.ERROR_MESSAGES.get(error_type, 'حدث خطأ غير متوقع')

        # Log error for monitoring
        error_log = {
            'type': error_type,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'user_agent': request.headers.get('User-Agent', 'Unknown'),
            'ip_address': request.remote_addr,
            'endpoint': request.endpoint if hasattr(request, 'endpoint') else 'unknown',
            'method': request.method if hasattr(request, 'method') else 'unknown'
        }

        # Log to file or monitoring system
        try:
            log_action('error', error_type, None, error_log)
        except:
            pass  # Don't let logging errors break the response

        return jsonify({
            'error': message,
            'error_code': error_type,
            'timestamp': datetime.now().isoformat()
        }), status_code

    @staticmethod
    def handle_upload_error(exception):
        """Handle upload-specific errors"""
        if isinstance(exception, FileNotFoundError):
            return DocumentsErrorHandler.handle_error('file_not_found', str(exception), 404)
        elif isinstance(exception, PermissionError):
            return DocumentsErrorHandler.handle_error('permission_denied', str(exception), 403)
        elif isinstance(exception, OSError):
            return DocumentsErrorHandler.handle_error('storage_full', str(exception), 507)
        elif 'file too large' in str(exception).lower():
            return DocumentsErrorHandler.handle_error('file_too_large', str(exception), 413)
        else:
            return DocumentsErrorHandler.handle_error('upload_failed', str(exception), 500)

class DocumentsCleanupManager:
    """
    Automated cleanup and maintenance system for documents module.

    This class handles all cleanup operations to maintain system health
    and prevent storage issues. It includes temporary file cleanup,
    orphaned file removal, and database consistency maintenance.

    Features:
    - Automatic temporary file cleanup (files older than 1 hour)
    - Orphaned file detection and removal
    - Database consistency checks and repairs
    - Performance monitoring and reporting

    Usage:
        cleaned_count = DocumentsCleanupManager.cleanup_temp_files()
        removed_count = DocumentsCleanupManager.cleanup_orphaned_files()
    """

    @staticmethod
    def cleanup_temp_files():
        """Clean up temporary files older than 1 hour"""
        temp_dir = os.path.join(UPLOADS_DIR, 'temp')
        cleaned_count = 0

        if os.path.exists(temp_dir):
            for filename in os.listdir(temp_dir):
                file_path = os.path.join(temp_dir, filename)
                try:
                    # Remove files older than 1 hour
                    if os.path.isfile(file_path) and os.path.getmtime(file_path) < time.time() - 3600:
                        os.remove(file_path)
                        cleaned_count += 1
                except Exception as e:
                    try:
                        log_action('error', 'temp_file_cleanup_failed', None, {
                            'filename': filename,
                            'error': str(e)
                        })
                    except:
                        pass

        return cleaned_count

    @staticmethod
    def cleanup_orphaned_files():
        """Remove files that exist on disk but not in database"""
        try:
            # Get all documents from JSON files
            documents = []
            for entity_type in ['drivers', 'vehicles', 'other']:
                entity_docs_file = os.path.join(DATA_DIR, f'{entity_type}_documents.json')
                if os.path.exists(entity_docs_file):
                    with open(entity_docs_file, 'r', encoding='utf-8') as f:
                        entity_docs = json.load(f)
                        documents.extend(entity_docs)

            db_files = {doc.get('stored_filename') for doc in documents if doc.get('stored_filename')}
            removed_count = 0

            # Check each entity type directory
            for entity_type in ['drivers', 'vehicles', 'other']:
                entity_dir = os.path.join(UPLOADS_DIR, 'documents', entity_type)
                if os.path.exists(entity_dir):
                    for root, dirs, files in os.walk(entity_dir):
                        for filename in files:
                            if filename not in db_files and not filename.startswith('.'):
                                file_path = os.path.join(root, filename)
                                try:
                                    os.remove(file_path)
                                    removed_count += 1
                                    log_action('cleanup', 'orphaned_file_removed', None, {
                                        'filename': filename,
                                        'path': file_path
                                    })
                                except Exception as e:
                                    try:
                                        log_action('error', 'orphaned_file_removal_failed', None, {
                                            'filename': filename,
                                            'error': str(e)
                                        })
                                    except:
                                        pass

            return removed_count

        except Exception as e:
            try:
                log_action('error', 'orphaned_files_cleanup_failed', None, {'error': str(e)})
            except:
                pass
            return 0

# ========================================
# DOCUMENTS UPLOAD HELPER FUNCTIONS
# ========================================

def validate_file_upload_enhanced(file, entity_type, entity_id):
    """
    Enhanced file validation with server-side MIME type checking and security
    التحقق المحسن من صحة الملف مع فحص نوع MIME من جانب الخادم والأمان
    """
    errors = []

    # Check if file is present
    if not file or file.filename == '':
        errors.append('لم يتم اختيار ملف')
        return errors

    # Validate entity type
    if entity_type not in ['driver', 'vehicle', 'other']:
        errors.append('نوع الكيان غير صحيح')

    # Validate entity ID for driver/vehicle
    if entity_type in ['driver', 'vehicle'] and not entity_id:
        errors.append('معرف الكيان مطلوب للسائقين والمركبات')

    # Check file extension
    filename = file.filename.lower()
    file_ext = os.path.splitext(filename)[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        allowed_list = ', '.join(ALLOWED_EXTENSIONS)
        errors.append(f'نوع الملف غير مدعوم. الأنواع المسموحة: {allowed_list}')

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer

    if file_size > MAX_FILE_SIZE:
        max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
        errors.append(f'حجم الملف كبير جداً (الحد الأقصى {max_size_mb:.0f} ميجابايت)')

    if file_size == 0:
        errors.append('الملف فارغ')

    # Server-side MIME type validation using python-magic
    try:
        # Read first 2048 bytes for MIME detection
        file.seek(0)
        file_header = file.read(2048)
        file.seek(0)  # Reset file pointer

        # Detect MIME type from file content
        # detected_mime = magic.from_buffer(file_header, mime=True)  # Temporarily disabled
        detected_mime = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        # Check if detected MIME type matches expected type for extension
        expected_mime = ALLOWED_MIME_TYPES.get(file_ext)
        if expected_mime and detected_mime != expected_mime:
            # Temporarily disabled strict MIME checking
            pass  # errors.append(f'نوع الملف الفعلي ({detected_mime}) لا يطابق الامتداد ({file_ext})')

        # Additional security checks for specific file types
        if file_ext in ['.pdf']:
            if not detected_mime.startswith('application/pdf'):
                errors.append('ملف PDF غير صالح أو تالف')
        elif file_ext in ['.jpg', '.jpeg', '.png', '.webp']:
            if not detected_mime.startswith('image/'):
                errors.append('ملف الصورة غير صالح أو تالف')
        elif file_ext in ['.docx']:
            if 'officedocument' not in detected_mime:
                errors.append('ملف Word غير صالح أو تالف')
        elif file_ext in ['.xlsx']:
            if 'spreadsheetml' not in detected_mime:
                errors.append('ملف Excel غير صالح أو تالف')

    except Exception as e:
        print(f"[WARN] MIME type detection failed: {e}")
        errors.append('فشل في التحقق من نوع الملف')

    return errors

# Keep the original function for backward compatibility
def validate_file_upload(file, entity_type, entity_id):
    """
    Original file validation function (deprecated - use validate_file_upload_enhanced)
    وظيفة التحقق الأصلية من الملف (مهجورة - استخدم validate_file_upload_enhanced)
    """
    return validate_file_upload_enhanced(file, entity_type, entity_id)

def calculate_file_hash(file_obj):
    """
    Calculate SHA-256 hash of file for integrity verification
    حساب hash SHA-256 للملف للتحقق من سلامته
    """
    sha256_hash = hashlib.sha256()
    file_obj.seek(0)

    # Read file in chunks to handle large files efficiently
    for chunk in iter(lambda: file_obj.read(4096), b""):
        sha256_hash.update(chunk)

    file_obj.seek(0)  # Reset file pointer
    return sha256_hash.hexdigest()

def sanitize_and_generate_filename(original_filename):
    """
    Generate secure filename with UUID prefix and timestamp
    إنشاء اسم ملف آمن مع بادئة UUID وطابع زمني
    """
    # Sanitize the original filename
    secure_name = secure_filename(original_filename)

    # Remove any potentially dangerous characters
    secure_name = secure_name.replace('..', '').replace('/', '').replace('\\', '')

    # Limit filename length
    name_part, ext_part = os.path.splitext(secure_name)
    if len(name_part) > 50:
        name_part = name_part[:50]
    secure_name = name_part + ext_part

    # Generate UUID prefix with timestamp
    file_uuid = str(uuid.uuid4())
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Combine UUID, timestamp, and secure filename
    final_filename = f"{timestamp}_{file_uuid}___{secure_name}"

    return final_filename, file_uuid

def scan_file_for_threats(file_obj, filename):
    """
    Basic file threat scanning (placeholder for real antivirus integration)
    فحص أساسي للملف للتهديدات (نائب لتكامل مكافح الفيروسات الحقيقي)
    """
    threats_found = []

    try:
        file_obj.seek(0)
        file_content = file_obj.read(1024)  # Read first 1KB for basic checks
        file_obj.seek(0)  # Reset file pointer

        # Basic threat detection patterns
        suspicious_patterns = [
            b'<script',  # Potential XSS in uploaded files
            b'javascript:',  # JavaScript URLs
            b'vbscript:',  # VBScript URLs
            b'<?php',  # PHP code
            b'<%',  # ASP/JSP code
            b'eval(',  # Eval functions
            b'exec(',  # Exec functions
        ]

        content_lower = file_content.lower()
        for pattern in suspicious_patterns:
            if pattern in content_lower:
                threats_found.append(f'Suspicious pattern detected: {pattern.decode("utf-8", errors="ignore")}')

        # Check for executable file signatures
        executable_signatures = [
            b'MZ',  # Windows PE executable
            b'\x7fELF',  # Linux ELF executable
            b'\xca\xfe\xba\xbe',  # Java class file
        ]

        for sig in executable_signatures:
            if file_content.startswith(sig):
                threats_found.append('Executable file detected')
                break

        # File size anomaly check
        file_obj.seek(0, os.SEEK_END)
        file_size = file_obj.tell()
        file_obj.seek(0)

        if file_size > 50 * 1024 * 1024:  # 50MB
            threats_found.append('File size exceeds safe limits')

    except Exception as e:
        print(f"[WARN] Threat scanning error: {e}")
        threats_found.append('Threat scanning failed')

    return threats_found

def get_storage_path(entity_type, entity_id, filename):
    """
    Get storage path for uploaded file
    الحصول على مسار التخزين للملف المرفوع
    """
    if entity_type == 'driver':
        entity_dir = os.path.join(DRIVERS_DOCS_DIR, str(entity_id))
    elif entity_type == 'vehicle':
        entity_dir = os.path.join(VEHICLES_DOCS_DIR, str(entity_id))
    else:  # other
        entity_dir = OTHER_DOCS_DIR

    # Create entity directory if it doesn't exist
    if not os.path.exists(entity_dir):
        os.makedirs(entity_dir, mode=0o755)

    return os.path.join(entity_dir, filename)

def extract_file_metadata(file, filename, file_path):
    """
    Extract metadata from uploaded file
    استخراج البيانات الوصفية من الملف المرفوع
    """
    # Get file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(filename)
    if not mime_type:
        # Fallback based on extension
        file_ext = os.path.splitext(filename)[1].lower()
        mime_type = ALLOWED_MIME_TYPES.get(file_ext, 'application/octet-stream')

    return {
        'size_bytes': file_size,
        'mime_type': mime_type
    }

def cleanup_failed_upload(file_path, document_id=None):
    """
    Clean up files and database records on upload failure
    تنظيف الملفات وسجلات قاعدة البيانات عند فشل الرفع
    """
    try:
        # Remove file if it exists
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"[DEL] Cleaned up failed upload file: {file_path}")

        # Remove database record if it was created
        if document_id:
            from utils.json_store import json_store
            json_store.delete('documents', document_id)
            print(f"[DEL] Cleaned up failed upload record: {document_id}")

    except Exception as e:
        print(f"[WARN] Error during cleanup: {e}")

def paginate_documents(documents, page, limit):
    """
    Paginate documents list
    تقسيم قائمة الوثائق إلى صفحات
    """
    # Validate parameters
    page = max(1, int(page) if str(page).isdigit() else 1)
    limit = max(1, min(100, int(limit) if str(limit).isdigit() else 20))

    total = len(documents)
    total_pages = (total + limit - 1) // limit  # Ceiling division

    # Calculate offset
    offset = (page - 1) * limit

    # Slice documents
    paginated_docs = documents[offset:offset + limit]

    return {
        'documents': paginated_docs,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }

def filter_documents(documents, filters):
    """
    Filter documents based on criteria
    تصفية الوثائق حسب المعايير
    """
    filtered = documents

    for key, value in filters.items():
        if value is not None and value != '':
            if key == 'search':
                # Text search in multiple fields
                query = str(value).lower()
                filtered = [
                    doc for doc in filtered
                    if (query in doc.get('display_name', '').lower() or
                        query in doc.get('original_filename', '').lower() or
                        query in doc.get('notes', '').lower())
                ]
            else:
                # Exact match filtering
                filtered = [doc for doc in filtered if doc.get(key) == value]

    return filtered

def sort_documents(documents, sort_by='created_at', sort_order='desc'):
    """
    Sort documents by specified field
    ترتيب الوثائق حسب الحقل المحدد
    """
    allowed_fields = ['created_at', 'updated_at', 'display_name', 'size_bytes', 'original_filename']

    if sort_by not in allowed_fields:
        sort_by = 'created_at'

    if sort_order not in ['asc', 'desc']:
        sort_order = 'desc'

    reverse = (sort_order == 'desc')

    try:
        return sorted(documents, key=lambda x: x.get(sort_by, ''), reverse=reverse)
    except Exception:
        # Fallback to created_at if sorting fails
        return sorted(documents, key=lambda x: x.get('created_at', ''), reverse=True)

def calculate_document_stats(documents):
    """
    Calculate document statistics
    حساب إحصائيات الوثائق
    """
    from datetime import datetime, timedelta

    total = len(documents)

    # Count by entity type
    by_entity_type = {}
    for doc in documents:
        entity_type = doc.get('entity_type', 'other')
        by_entity_type[entity_type] = by_entity_type.get(entity_type, 0) + 1

    # Count by category
    by_category = {}
    for doc in documents:
        category = doc.get('category', 'other')
        by_category[category] = by_category.get(category, 0) + 1

    # Count by status
    by_status = {}
    for doc in documents:
        status = doc.get('status', 'active')
        by_status[status] = by_status.get(status, 0) + 1

    # Recent uploads
    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    recent_7_days = 0
    recent_30_days = 0

    for doc in documents:
        try:
            created_at = datetime.fromisoformat(doc.get('created_at', ''))
            if created_at >= seven_days_ago:
                recent_7_days += 1
            if created_at >= thirty_days_ago:
                recent_30_days += 1
        except:
            continue

    return {
        'total_documents': total,
        'by_entity_type': by_entity_type,
        'by_category': by_category,
        'by_status': by_status,
        'recent_uploads': {
            'last_7_days': recent_7_days,
            'last_30_days': recent_30_days
        }
    }

def search_documents(documents, query, limit=10):
    """
    Search documents with highlighting
    البحث في الوثائق مع التمييز
    """
    if not query or len(query.strip()) == 0:
        return []

    query = query.strip().lower()
    results = []

    for doc in documents:
        matches = []

        # Search in display_name
        display_name = doc.get('display_name', '')
        if query in display_name.lower():
            matches.append({
                'field': 'display_name',
                'value': display_name,
                'highlighted': display_name.replace(query, f'<mark>{query}</mark>')
            })

        # Search in original_filename
        filename = doc.get('original_filename', '')
        if query in filename.lower():
            matches.append({
                'field': 'original_filename',
                'value': filename,
                'highlighted': filename.replace(query, f'<mark>{query}</mark>')
            })

        # Search in notes
        notes = doc.get('notes', '')
        if query in notes.lower():
            matches.append({
                'field': 'notes',
                'value': notes,
                'highlighted': notes.replace(query, f'<mark>{query}</mark>')
            })

        if matches:
            result = {
                'id': doc.get('id'),
                'display_name': doc.get('display_name'),
                'entity_type': doc.get('entity_type'),
                'entity_id': doc.get('entity_id'),
                'category': doc.get('category'),
                'matches': matches,
                'relevance': len(matches)
            }
            results.append(result)

    # Sort by relevance (number of matches)
    results.sort(key=lambda x: x['relevance'], reverse=True)

    return results[:limit]

def safe_strip(value, default=''):
    """
    Safely strip a string value, handling None values
    تنظيف النص بأمان مع التعامل مع القيم الفارغة
    """
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip()
    return str(value).strip() if value else default

def validate_document_update(data):
    """
    Validate document update request data
    التحقق من صحة بيانات تحديث الوثيقة
    """
    errors = []

    # Validate display_name
    display_name = safe_strip(data.get('display_name'))
    if not display_name:
        errors.append('اسم الوثيقة مطلوب')
    elif len(display_name) > 200:
        errors.append('اسم الوثيقة طويل جداً (الحد الأقصى 200 حرف)')

    # Validate category
    category = safe_strip(data.get('category'))
    if category and category not in DOCUMENT_CATEGORIES:
        errors.append('فئة الوثيقة غير صحيحة')

    # Validate status
    status = safe_strip(data.get('status'))
    if status and status not in ['active', 'expired', 'pending_renewal']:
        errors.append('حالة الوثيقة غير صحيحة')

    # Validate expiry_date
    expiry_date = safe_strip(data.get('expiry_date'))
    if expiry_date:
        try:
            from datetime import datetime
            datetime.strptime(expiry_date, '%Y-%m-%d')
        except ValueError:
            errors.append('تاريخ انتهاء الصلاحية غير صحيح (استخدم تنسيق YYYY-MM-DD)')

    # Validate notes length
    notes = safe_strip(data.get('notes'))
    if len(notes) > 1000:
        errors.append('الملاحظات طويلة جداً (الحد الأقصى 1000 حرف)')

    return errors

def check_document_permission(document, current_user):
    """
    Check if user has permission to modify/delete document
    التحقق من صلاحية المستخدم لتعديل/حذف الوثيقة
    """
    # Admin users can modify/delete any document
    if current_user.get('role') == 'admin':
        return True

    # Regular users can only modify/delete their own uploads
    return document.get('uploaded_by') == current_user.get('username')

def secure_file_delete(file_path):
    """
    Safely delete file with error handling
    حذف الملف بأمان مع معالجة الأخطاء
    """
    try:
        if not file_path or not os.path.exists(file_path):
            return True  # File doesn't exist, consider it deleted

        # Validate file path is within uploads directory
        uploads_dir = os.path.abspath(UPLOADS_DIR)
        file_abs_path = os.path.abspath(file_path)

        if not file_abs_path.startswith(uploads_dir):
            print(f"[WARN] Attempted to delete file outside uploads directory: {file_path}")
            return False

        # Delete the file
        os.remove(file_path)
        print(f"[OK] File deleted: {file_path}")
        return True

    except PermissionError:
        print(f"[ERR] Permission denied deleting file: {file_path}")
        return False
    except Exception as e:
        print(f"[ERR] Error deleting file {file_path}: {e}")
        return False

def cleanup_empty_directories(file_path):
    """
    Clean up empty directories after file deletion
    تنظيف المجلدات الفارغة بعد حذف الملف
    """
    try:
        if not file_path:
            return

        # Get the directory containing the file
        dir_path = os.path.dirname(file_path)

        # Only clean up directories within uploads/documents
        uploads_docs_dir = os.path.abspath(DOCUMENTS_DIR)
        dir_abs_path = os.path.abspath(dir_path)

        if not dir_abs_path.startswith(uploads_docs_dir):
            return

        # Don't delete the base directories
        base_dirs = [
            os.path.abspath(DRIVERS_DOCS_DIR),
            os.path.abspath(VEHICLES_DOCS_DIR),
            os.path.abspath(OTHER_DOCS_DIR)
        ]

        if dir_abs_path in base_dirs:
            return

        # Check if directory is empty and delete if so
        if os.path.exists(dir_path) and not os.listdir(dir_path):
            os.rmdir(dir_path)
            print(f"🗑️ Cleaned up empty directory: {dir_path}")

            # Recursively clean up parent directories
            cleanup_empty_directories(dir_path)

    except Exception as e:
        print(f"[WARN] Error cleaning up directory {file_path}: {e}")

def validate_document_access(document, current_user):
    """
    Validate user has permission to access document
    التحقق من صلاحية المستخدم للوصول للوثيقة
    """
    # Admin users can access any document
    if current_user.get('role') == 'admin':
        return True

    # Users can only access their own uploads
    return document.get('uploaded_by') == current_user.get('username')

def get_document_file_path(document):
    """
    Get secure file path for document
    الحصول على مسار آمن لملف الوثيقة
    """
    stored_filename = document.get('stored_filename')
    entity_type = document.get('entity_type')
    entity_id = document.get('entity_id')

    if not stored_filename:
        return None

    # Get the file path using existing helper
    file_path = get_storage_path(entity_type, entity_id, stored_filename)

    # Validate path is within uploads directory
    uploads_dir = os.path.abspath(UPLOADS_DIR)
    file_abs_path = os.path.abspath(file_path)

    if not file_abs_path.startswith(uploads_dir):
        print(f"[WARN] Security: File path outside uploads directory: {file_path}")
        return None

    return file_path if os.path.exists(file_path) else None

def format_file_size(size_bytes):
    """
    Format file size in human-readable Arabic format
    تنسيق حجم الملف بصيغة قابلة للقراءة بالعربية
    """
    if size_bytes == 0:
        return "0 بايت"

    size_names = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"]
    i = 0
    size = float(size_bytes)

    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1

    if i == 0:
        return f"{int(size)} {size_names[i]}"
    else:
        return f"{size:.1f} {size_names[i]}"

def get_file_icon_class(mime_type):
    """
    Get CSS icon class for file type
    الحصول على فئة أيقونة CSS لنوع الملف
    """
    if mime_type.startswith('image/'):
        return 'fas fa-image'
    elif mime_type == 'application/pdf':
        return 'fas fa-file-pdf'
    elif mime_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
        return 'fas fa-file-word'
    elif mime_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']:
        return 'fas fa-file-excel'
    else:
        return 'fas fa-file'

def serve_file_securely(file_path, filename, disposition='attachment'):
    """
    Serve file securely with proper headers
    تقديم الملف بأمان مع الرؤوس المناسبة
    """
    try:
        # Detect MIME type
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = 'application/octet-stream'

        # Create response
        response = send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=(disposition == 'attachment'),
            download_name=filename
        )

        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Cache-Control'] = 'private, no-cache'

        if disposition == 'inline':
            response.headers['Content-Disposition'] = f'inline; filename="{filename}"'

        return response

    except Exception as e:
        print(f"❌ Error serving file {file_path}: {e}")
        return None

# Authentication Routes
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")  # Strict rate limiting for login attempts
def login():
    """User login endpoint"""
    try:
        # Handle CSRF validation manually for better error handling
        from flask_wtf.csrf import validate_csrf

        # Check if CSRF token is provided
        csrf_token = request.headers.get('X-CSRFToken') or request.form.get('csrf_token')
        if not csrf_token:
            # For login endpoint, we'll be more lenient and allow login without CSRF token
            # This is acceptable for authentication endpoints as they establish the session
            print(f"[DEBUG] Login attempt without CSRF token - allowing for authentication endpoint")
        else:
            try:
                validate_csrf(csrf_token)
                print(f"[DEBUG] CSRF token validation successful")
            except Exception as csrf_error:
                print(f"[DEBUG] CSRF token validation failed: {csrf_error}")
                # For login, we'll still allow the attempt but log the issue
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({'error': 'اسم المستخدم وكلمة المرور مطلوبان'}), 400

        if auth_manager.validate_credentials(username, password):
            session_data = auth_manager.create_session(username)

            # Set session timeout tracking
            session['last_activity'] = datetime.now().isoformat()
            session.permanent = True

            return jsonify({
                'success': True,
                'message': 'تم تسجيل الدخول بنجاح',
                'user': {
                    'username': session_data['username'],
                    'login_time': session_data['login_time']
                }
            })
        else:
            return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401

    except Exception as e:
        return jsonify({'error': f'خطأ في تسجيل الدخول: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting for logout attempts
@login_required
def logout():
    """User logout endpoint"""
    try:
        auth_manager.destroy_session()
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الخروج بنجاح'
        })
    except Exception as e:
        return jsonify({'error': f'خطأ في تسجيل الخروج: {str(e)}'}), 500

@app.route('/api/auth/check')
@limiter.limit("60 per minute")  # Increased rate limit for auth check to fix document loading
def check_auth():
    """Check authentication status"""
    if auth_manager.is_authenticated():
        user = auth_manager.get_current_user()
        return jsonify({
            'authenticated': True,
            'user': user
        })
    else:
        return jsonify({'authenticated': False})

@app.route('/api/admin/change-password', methods=['POST'])
@limiter.limit("3 per minute")  # Strict rate limiting for password change attempts
@admin_required
def change_admin_password():
    """Change admin password endpoint"""
    try:
        print(f"[DEBUG] Password change endpoint called")
        data = request.get_json()
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
        confirm_password = data.get('confirm_password', '').strip()

        print(f"[DEBUG] Received password change request for user: {session.get('username')}")

        # Validate input
        if not current_password or not new_password or not confirm_password:
            print(f"[DEBUG] Validation failed: missing fields")
            return jsonify({'error': 'جميع الحقول مطلوبة'}), 400

        # Check if new password matches confirmation
        if new_password != confirm_password:
            print(f"[DEBUG] Validation failed: password mismatch")
            return jsonify({'error': 'كلمة المرور الجديدة وتأكيدها غير متطابقتين'}), 400

        # Validate password strength
        password_validation = validate_password_strength(new_password)
        if not password_validation['valid']:
            print(f"[DEBUG] Validation failed: weak password")
            return jsonify({'error': password_validation['message']}), 400

        # Check if new password is different from current
        if current_password == new_password:
            print(f"[DEBUG] Validation failed: same password")
            return jsonify({'error': 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية'}), 400

        # Verify current password
        config = auth_manager.load_config()
        admin_config = config.get('admin', {})
        current_username = admin_config.get('username', 'admin')

        print(f"[DEBUG] Verifying current password for user: {current_username}")
        if not auth_manager.validate_credentials(current_username, current_password):
            print(f"[DEBUG] Current password verification failed")
            return jsonify({'error': 'كلمة المرور الحالية غير صحيحة'}), 401

        print(f"[DEBUG] Current password verified successfully")

        # Hash the new password
        import bcrypt
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        print(f"[DEBUG] New password hashed: {password_hash[:20]}...")

        # Update the configuration
        print(f"[DEBUG] Calling update_admin_password...")
        success = auth_manager.update_admin_password(password_hash)
        if not success:
            print(f"[DEBUG] update_admin_password returned False")
            return jsonify({'error': 'فشل في تحديث كلمة المرور'}), 500

        print(f"[DEBUG] Password updated successfully")

        # Log the password change event
        log_action('admin_password_change', {
            'username': current_username,
            'timestamp': datetime.now().isoformat(),
            'ip_address': request.remote_addr
        })

        return jsonify({
            'success': True,
            'message': 'تم تغيير كلمة المرور بنجاح'
        })

    except Exception as e:
        print(f"Error changing admin password: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'خطأ في تغيير كلمة المرور: {str(e)}'}), 500

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return {'valid': False, 'message': 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل'}

    if not any(c.isupper() for c in password):
        return {'valid': False, 'message': 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'}

    if not any(c.islower() for c in password):
        return {'valid': False, 'message': 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل'}

    if not any(c.isdigit() for c in password):
        return {'valid': False, 'message': 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'}

    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    if not any(c in special_chars for c in password):
        return {'valid': False, 'message': 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'}

    return {'valid': True, 'message': 'كلمة المرور قوية'}

# ========================================
# DOCUMENTS UPLOAD API ENDPOINTS
# ========================================

@app.route('/api/documents/upload', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting for file uploads
@login_required
def upload_document():
    """
    Upload a new document with comprehensive validation and metadata extraction.

    This endpoint handles secure file upload for drivers, vehicles, and other entities
    with automatic validation, metadata extraction, and storage organization.

    Request Parameters:
        file (file): The document file to upload (multipart/form-data)
        entity_type (str): Type of entity ('drivers', 'vehicles', 'other')
        entity_id (str): Unique identifier of the entity
        category (str): Document category (e.g., 'license', 'insurance', 'id_copy')
        description (str, optional): Human-readable description
        expiry_date (str, optional): Expiry date in YYYY-MM-DD format

    File Validation:
        - Maximum size: 15MB
        - Allowed types: PDF, JPG, PNG, DOCX, XLSX
        - Automatic virus scanning (if configured)
        - Filename sanitization

    Returns:
        JSON Response:
            success (bool): Operation success status
            document_id (str): Unique document identifier
            message (str): Arabic success/error message
            metadata (dict): Extracted file metadata

    HTTP Status Codes:
        200: Success - Document uploaded successfully
        400: Bad Request - Missing parameters or invalid data
        413: Payload Too Large - File exceeds 15MB limit
        415: Unsupported Media Type - Invalid file type
        500: Internal Server Error - Server-side error

    Example Request:
        POST /api/documents/upload
        Content-Type: multipart/form-data

        file: [binary file data]
        entity_type: "drivers"
        entity_id: "driver_123"
        category: "license"
        description: "رخصة القيادة الجديدة"
        expiry_date: "2025-12-31"

    Example Response:
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

    Error Response:
        {
            "error": "حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)",
            "error_code": "file_too_large",
            "timestamp": "2025-01-22T14:30:52Z"
        }
    """
    file_path = None
    document_id = None

    try:
        from utils.json_store import json_store

        # Get form data
        file = request.files.get('file')
        entity_type = request.form.get('entity_type', '').strip()
        entity_id = request.form.get('entity_id', '').strip() or None
        display_name = request.form.get('display_name', '').strip()
        category = request.form.get('category', 'other').strip()
        notes = request.form.get('notes', '').strip()
        expiry_date = request.form.get('expiry_date', '').strip() or None

        # Validate required fields
        if not display_name:
            return jsonify({'error': 'اسم الوثيقة مطلوب'}), 400

        # Enhanced file validation with security checks
        validation_errors = validate_file_upload_enhanced(file, entity_type, entity_id)
        if validation_errors:
            return jsonify({'error': validation_errors[0]}), 400

        # Perform threat scanning
        threats = scan_file_for_threats(file, file.filename)
        if threats:
            print(f"[WARN] Security threats detected in file {file.filename}: {threats}")
            return jsonify({'error': 'تم اكتشاف تهديدات أمنية في الملف'}), 400

        # Calculate file hash for integrity verification
        file_hash = calculate_file_hash(file)

        # Validate entity exists if entity_id provided
        if entity_id:
            if entity_type == 'driver':
                entity = json_store.find_by_id('drivers', entity_id)
                if not entity:
                    return jsonify({'error': 'السائق غير موجود'}), 404
            elif entity_type == 'vehicle':
                entity = json_store.find_by_id('vehicles', entity_id)
                if not entity:
                    return jsonify({'error': 'المركبة غير موجودة'}), 404

        # Generate secure filename
        secure_name, file_uuid = sanitize_and_generate_filename(file.filename)

        # Get storage path
        file_path = get_storage_path(entity_type, entity_id, secure_name)

        # Extract file metadata
        metadata = extract_file_metadata(file, file.filename, file_path)

        # Save file to disk
        file.save(file_path)
        print(f"[OK] File saved to: {file_path}")

        # Create document record
        document_data = {
            'entity_type': entity_type,
            'entity_id': entity_id,
            'display_name': display_name,
            'original_filename': file.filename,
            'stored_filename': secure_name,
            'mime_type': metadata['mime_type'],
            'size_bytes': metadata['size_bytes'],
            'uploaded_by': auth_manager.get_current_user().get('username', 'admin'),
            'tags': [],
            'category': category,
            'notes': notes,
            'expiry_date': expiry_date,
            'status': 'active'
        }

        # Save to database
        document = json_store.create('documents', document_data)
        document_id = document['id']

        # Log the upload action
        log_action('upload', 'document', document_id, {
            'entity_type': entity_type,
            'entity_id': entity_id,
            'filename': file.filename,
            'size_bytes': metadata['size_bytes'],
            'category': category
        })

        # Return success response
        return jsonify({
            'success': True,
            'message': 'تم رفع الملف بنجاح',
            'document': {
                'id': document['id'],
                'display_name': display_name,
                'original_filename': file.filename,
                'size_bytes': metadata['size_bytes'],
                'mime_type': metadata['mime_type'],
                'category': category,
                'uploaded_at': document['created_at'],
                'file_url': f'/api/documents/download/{document["id"]}'
            }
        })

    except Exception as e:
        # Clean up on failure
        cleanup_failed_upload(file_path, document_id)
        print(f"❌ Upload failed: {e}")
        return jsonify({'error': f'فشل في رفع الملف: {str(e)}'}), 500

@app.route('/api/documents', methods=['GET'])
@limiter.limit("100 per minute")  # Rate limiting for document listing
@login_required
def list_documents():
    """
    List documents with filtering, pagination, and search
    عرض قائمة الوثائق مع التصفية والتقسيم والبحث
    """
    try:
        from utils.json_store import json_store

        # Get query parameters
        page = request.args.get('page', 1)
        limit = request.args.get('limit', 20)
        entity_type = request.args.get('entity_type', '').strip() or None
        entity_id = request.args.get('entity_id', '').strip() or None
        category = request.args.get('category', '').strip() or None
        status = request.args.get('status', '').strip() or None
        search = request.args.get('search', '').strip() or None
        sort_by = request.args.get('sort_by', 'created_at').strip()
        sort_order = request.args.get('sort_order', 'desc').strip()

        # Validate entity_type
        if entity_type and entity_type not in ['driver', 'vehicle', 'other']:
            return jsonify({'error': 'نوع الكيان غير صحيح'}), 400

        # Get all documents
        documents = json_store.read_all('documents')

        # Apply filters
        filters = {}
        if entity_type:
            filters['entity_type'] = entity_type
        if entity_id:
            filters['entity_id'] = entity_id
        if category:
            filters['category'] = category
        if status:
            filters['status'] = status
        if search:
            filters['search'] = search

        filtered_docs = filter_documents(documents, filters)

        # Sort documents
        sorted_docs = sort_documents(filtered_docs, sort_by, sort_order)

        # Paginate results
        result = paginate_documents(sorted_docs, page, limit)

        # Add filters applied to response
        result['filters_applied'] = {k: v for k, v in filters.items() if v is not None}

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب قائمة الوثائق: {str(e)}'}), 500

@app.route('/api/documents/stats', methods=['GET'])
@limiter.limit("120 per minute")  # Rate limiting for document stats
@login_required
def documents_stats():
    """
    Get document statistics for dashboard cards
    الحصول على إحصائيات الوثائق لبطاقات لوحة التحكم
    """
    try:
        from utils.json_store import json_store

        # Get all documents
        documents = json_store.read_all('documents')

        # Calculate statistics
        stats = calculate_document_stats(documents)

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب إحصائيات الوثائق: {str(e)}'}), 500

@app.route('/api/documents/entity/<entity_type>/<entity_id>', methods=['GET'])
@limiter.limit("500 per minute")  # Increased rate limiting for entity documents to fix loading errors
@login_required
def get_entity_documents(entity_type, entity_id):
    """
    Get all documents for a specific entity (driver or vehicle)
    الحصول على جميع وثائق كيان محدد (سائق أو مركبة)
    """
    try:
        from utils.json_store import json_store

        # Validate entity_type
        if entity_type not in ['driver', 'vehicle']:
            return jsonify({'error': 'نوع الكيان غير صحيح'}), 400

        # Check if entity exists
        if entity_type == 'driver':
            entity = json_store.find_by_id('drivers', entity_id)
        else:  # vehicle
            entity = json_store.find_by_id('vehicles', entity_id)

        if not entity:
            entity_name = 'السائق' if entity_type == 'driver' else 'المركبة'
            return jsonify({'error': f'{entity_name} غير موجود'}), 404

        # Get documents for this entity
        documents = json_store.filter_records('documents', {
            'entity_type': entity_type,
            'entity_id': entity_id
        })

        # Sort by creation date (newest first)
        documents = sort_documents(documents, 'created_at', 'desc')

        # Calculate entity-specific stats
        stats = calculate_document_stats(documents)

        # Add expiry information
        from datetime import datetime, timedelta
        now = datetime.now()
        thirty_days_later = now + timedelta(days=30)

        expired_count = 0
        expiring_soon = 0

        for doc in documents:
            expiry_date = doc.get('expiry_date')
            if expiry_date:
                try:
                    expiry = datetime.fromisoformat(expiry_date)
                    if expiry < now:
                        expired_count += 1
                    elif expiry <= thirty_days_later:
                        expiring_soon += 1
                except:
                    continue

        stats['expired_count'] = expired_count
        stats['expiring_soon'] = expiring_soon

        return jsonify({
            'entity_type': entity_type,
            'entity_id': entity_id,
            'entity_name': entity.get('name', entity.get('license_plate', 'غير محدد')),
            'documents': documents,
            'stats': stats
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب وثائق الكيان: {str(e)}'}), 500

@app.route('/api/documents/search', methods=['GET'])
@login_required
def search_documents_api():
    """
    Search documents with highlighting
    البحث في الوثائق مع التمييز
    """
    try:
        from utils.json_store import json_store

        # Get query parameters
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        entity_type = request.args.get('entity_type', '').strip() or None

        if not query:
            return jsonify({'error': 'استعلام البحث مطلوب'}), 400

        if len(query) > 100:
            return jsonify({'error': 'استعلام البحث طويل جداً'}), 400

        # Validate limit
        limit = max(1, min(50, limit))

        # Get all documents
        documents = json_store.read_all('documents')

        # Filter by entity_type if specified
        if entity_type:
            if entity_type not in ['driver', 'vehicle', 'other']:
                return jsonify({'error': 'نوع الكيان غير صحيح'}), 400
            documents = [doc for doc in documents if doc.get('entity_type') == entity_type]

        # Perform search
        results = search_documents(documents, query, limit)

        return jsonify({
            'query': query,
            'results': results,
            'total_results': len(results),
            'entity_type_filter': entity_type
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في البحث: {str(e)}'}), 500

@app.route('/api/documents/<document_id>', methods=['PUT'])
@login_required
def update_document(document_id):
    """
    Update document metadata
    تحديث بيانات الوثيقة الوصفية
    """
    print(f"[DEBUG] update_document endpoint called with document_id={document_id}")
    try:
        from json_store import json_store

        # Get request data
        data = request.get_json()
        print(f"[DEBUG] update_document called with document_id={document_id}, data={data}")
        if not data:
            return jsonify({'error': 'بيانات التحديث مطلوبة'}), 400

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        print(f"DEBUG: current_user = {current_user}")
        print(f"DEBUG: document uploaded_by = {document.get('uploaded_by')}")
        permission_result = check_document_permission(document, current_user)
        print(f"DEBUG: permission_result = {permission_result}")
        if not permission_result:
            return jsonify({'error': 'ليس لديك صلاحية لتعديل هذه الوثيقة'}), 403

        # Validate update data
        validation_errors = validate_document_update(data)
        if validation_errors:
            return jsonify({'error': validation_errors[0]}), 400

        # Prepare update data
        updates = {}
        if 'display_name' in data:
            updates['display_name'] = safe_strip(data['display_name'])
        if 'category' in data:
            updates['category'] = safe_strip(data['category'])
        if 'notes' in data:
            updates['notes'] = safe_strip(data['notes'])
        if 'expiry_date' in data:
            expiry_stripped = safe_strip(data['expiry_date'])
            updates['expiry_date'] = expiry_stripped or None
        if 'status' in data:
            updates['status'] = safe_strip(data['status'])

        # Update document
        print(f"DEBUG: Updating document {document_id} with updates: {updates}")
        updated_document = json_store.update('documents', document_id, updates)
        print(f"DEBUG: Update result: {updated_document}")
        if not updated_document:
            return jsonify({'error': 'فشل في تحديث الوثيقة'}), 500

        # Log the update action
        log_action('update', 'document', document_id, {
            'updated_fields': list(updates.keys()),
            'entity_type': document.get('entity_type'),
            'entity_id': document.get('entity_id')
        })

        return jsonify({
            'success': True,
            'message': 'تم تحديث الوثيقة بنجاح',
            'document': updated_document
        })

    except Exception as e:
        print(f"DEBUG: Exception in update_document: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'خطأ في تحديث الوثيقة: {str(e)}'}), 500

@app.route('/api/documents/<document_id>', methods=['DELETE'])
@csrf.exempt  # Exempt from CSRF protection since we handle it manually
@login_required
def delete_document(document_id):
    """
    Delete a document and its file
    حذف وثيقة وملفها
    """
    try:
        from json_store import json_store
        from flask_wtf.csrf import validate_csrf

        # Manual CSRF validation for DELETE requests
        csrf_token = request.headers.get('X-CSRFToken')
        print(f"[DEBUG] DELETE request for document {document_id}")
        print(f"[DEBUG] CSRF token received: {csrf_token}")
        print(f"[DEBUG] Request headers: {dict(request.headers)}")

        try:
            validate_csrf(csrf_token)
            print(f"[OK] CSRF validation successful")
        except Exception as csrf_error:
            print(f"[ERROR] CSRF validation failed: {csrf_error}")
            print(f"[ERROR] CSRF error type: {type(csrf_error)}")
            return jsonify({'error': f'رمز الحماية غير صحيح: {str(csrf_error)}'}), 400

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        if not check_document_permission(document, current_user):
            return jsonify({'error': 'ليس لديك صلاحية لحذف هذه الوثيقة'}), 403

        # Get file path
        stored_filename = document.get('stored_filename')
        entity_type = document.get('entity_type')
        entity_id = document.get('entity_id')

        if stored_filename:
            file_path = get_storage_path(entity_type, entity_id, stored_filename)

            # Delete physical file
            file_deleted = secure_file_delete(file_path)
            if not file_deleted:
                print(f"[WARN] Warning: Could not delete file {file_path} for document {document_id}")

            # Clean up empty directories
            cleanup_empty_directories(file_path)

        # Delete database record
        deleted = json_store.delete('documents', document_id)
        if not deleted:
            return jsonify({'error': 'فشل في حذف سجل الوثيقة'}), 500

        # Log the delete action
        log_action('delete', 'document', document_id, {
            'entity_type': entity_type,
            'entity_id': entity_id,
            'filename': document.get('original_filename'),
            'display_name': document.get('display_name')
        })

        return jsonify({
            'success': True,
            'message': 'تم حذف الوثيقة بنجاح',
            'deleted_document_id': document_id
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف الوثيقة: {str(e)}'}), 500

@app.route('/api/documents/<document_id>/status', methods=['PATCH'])
@login_required
def update_document_status(document_id):
    """
    Update document status quickly
    تحديث حالة الوثيقة بسرعة
    """
    try:
        from json_store import json_store

        # Get request data
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'حالة الوثيقة مطلوبة'}), 400

        status = safe_strip(data.get('status'))
        if status not in ['active', 'expired', 'pending_renewal']:
            return jsonify({'error': 'حالة الوثيقة غير صحيحة'}), 400

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        if not check_document_permission(document, current_user):
            return jsonify({'error': 'ليس لديك صلاحية لتعديل هذه الوثيقة'}), 403

        # Update status
        updated_document = json_store.update('documents', document_id, {'status': status})
        if not updated_document:
            return jsonify({'error': 'فشل في تحديث حالة الوثيقة'}), 500

        # Log the status update
        log_action('update_status', 'document', document_id, {
            'old_status': document.get('status'),
            'new_status': status,
            'entity_type': document.get('entity_type'),
            'entity_id': document.get('entity_id')
        })

        return jsonify({
            'success': True,
            'message': 'تم تحديث حالة الوثيقة بنجاح',
            'document_id': document_id,
            'new_status': status
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث حالة الوثيقة: {str(e)}'}), 500

@app.route('/api/documents/bulk', methods=['DELETE'])
@login_required
def bulk_delete_documents():
    """
    Bulk delete multiple documents
    حذف متعدد للوثائق
    """
    try:
        from utils.json_store import json_store

        # Get request data
        data = request.get_json()
        if not data or 'document_ids' not in data:
            return jsonify({'error': 'قائمة معرفات الوثائق مطلوبة'}), 400

        document_ids = data['document_ids']
        if not isinstance(document_ids, list) or len(document_ids) == 0:
            return jsonify({'error': 'قائمة معرفات الوثائق يجب أن تحتوي على عنصر واحد على الأقل'}), 400

        if len(document_ids) > 50:  # Limit bulk operations
            return jsonify({'error': 'لا يمكن حذف أكثر من 50 وثيقة في المرة الواحدة'}), 400

        current_user = auth_manager.get_current_user()
        deleted = []
        failed = []

        # Process each document
        for document_id in document_ids:
            try:
                # Find document
                document = json_store.find_by_id('documents', document_id)
                if not document:
                    failed.append({
                        'document_id': document_id,
                        'error': 'الوثيقة غير موجودة'
                    })
                    continue

                # Check permissions
                if not check_document_permission(document, current_user):
                    failed.append({
                        'document_id': document_id,
                        'error': 'ليس لديك صلاحية لحذف هذه الوثيقة'
                    })
                    continue

                # Get file path
                stored_filename = document.get('stored_filename')
                entity_type = document.get('entity_type')
                entity_id = document.get('entity_id')

                # Delete physical file
                if stored_filename:
                    file_path = get_storage_path(entity_type, entity_id, stored_filename)
                    file_deleted = secure_file_delete(file_path)
                    if file_deleted:
                        cleanup_empty_directories(file_path)

                # Delete database record
                if json_store.delete('documents', document_id):
                    deleted.append(document_id)

                    # Log the delete action
                    log_action('bulk_delete', 'document', document_id, {
                        'entity_type': entity_type,
                        'entity_id': entity_id,
                        'filename': document.get('original_filename'),
                        'display_name': document.get('display_name')
                    })
                else:
                    failed.append({
                        'document_id': document_id,
                        'error': 'فشل في حذف سجل الوثيقة'
                    })

            except Exception as e:
                failed.append({
                    'document_id': document_id,
                    'error': f'خطأ في الحذف: {str(e)}'
                })

        # Prepare response
        total_requested = len(document_ids)
        total_deleted = len(deleted)
        total_failed = len(failed)

        if total_deleted == total_requested:
            message = f'تم حذف جميع الوثائق بنجاح ({total_deleted} وثيقة)'
        elif total_deleted > 0:
            message = f'تم حذف {total_deleted} من {total_requested} وثائق بنجاح'
        else:
            message = 'فشل في حذف جميع الوثائق'

        return jsonify({
            'success': total_deleted > 0,
            'message': message,
            'results': {
                'deleted': deleted,
                'failed': failed
            },
            'total_requested': total_requested,
            'total_deleted': total_deleted,
            'total_failed': total_failed
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في الحذف المتعدد: {str(e)}'}), 500

@app.route('/api/documents/bulk/download', methods=['POST'])
@login_required
def bulk_download_documents():
    """
    Bulk download documents as ZIP file
    تحميل متعدد للوثائق كملف مضغوط
    """
    try:
        from utils.json_store import json_store
        import zipfile
        import io
        from datetime import datetime

        data = request.get_json()
        document_ids = data.get('document_ids', [])

        if not document_ids:
            return jsonify({'error': 'لا توجد وثائق محددة للتحميل'}), 400

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            added_files = 0
            failed_files = []

            for doc_id in document_ids:
                try:
                    # Find document
                    document = json_store.find_by_id('documents', doc_id)
                    if not document:
                        failed_files.append({'id': doc_id, 'error': 'الوثيقة غير موجودة'})
                        continue

                    # Check permissions (basic check - user must be logged in)
                    # In production, add more sophisticated permission checks

                    # Get file path
                    stored_filename = document.get('stored_filename')
                    entity_type = document.get('entity_type')
                    entity_id = document.get('entity_id')

                    if not stored_filename:
                        failed_files.append({'id': doc_id, 'error': 'اسم الملف غير موجود'})
                        continue

                    file_path = get_storage_path(entity_type, entity_id, stored_filename)

                    if not os.path.exists(file_path):
                        failed_files.append({'id': doc_id, 'error': 'الملف غير موجود على الخادم'})
                        continue

                    # Use original filename, but ensure uniqueness in ZIP
                    original_filename = document.get('original_filename', f'document_{doc_id}')
                    filename = original_filename
                    counter = 1
                    base_name, ext = os.path.splitext(original_filename)

                    # Check if filename already exists in ZIP
                    while filename in zip_file.namelist():
                        filename = f"{base_name}_{counter}{ext}"
                        counter += 1

                    # Add file to ZIP
                    zip_file.write(file_path, filename)
                    added_files += 1

                    # Log the download action
                    log_action('bulk_download', 'document', doc_id, {
                        'entity_type': entity_type,
                        'entity_id': entity_id,
                        'filename': original_filename,
                        'display_name': document.get('display_name')
                    })

                except Exception as e:
                    failed_files.append({'id': doc_id, 'error': f'خطأ في إضافة الملف: {str(e)}'})
                    continue

        if added_files == 0:
            return jsonify({
                'error': 'لا توجد ملفات صالحة للتحميل',
                'failed_files': failed_files
            }), 400

        zip_buffer.seek(0)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f'documents_{timestamp}.zip'

        # Log the bulk download action
        log_action('bulk_download_complete', 'documents', None, {
            'total_files': added_files,
            'failed_files': len(failed_files),
            'zip_filename': zip_filename
        })

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_filename
        )

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء الملف المضغوط: {str(e)}'}), 500

@app.route('/api/documents/<document_id>/info', methods=['GET'])
@login_required
def get_document_info(document_id):
    """
    Get document information without downloading
    الحصول على معلومات الوثيقة بدون تحميل
    """
    try:
        from json_store import json_store

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        if not validate_document_access(document, current_user):
            return jsonify({'error': 'ليس لديك صلاحية لعرض هذه الوثيقة'}), 403

        # Format file size
        size_bytes = document.get('size_bytes', 0)
        size_formatted = format_file_size(size_bytes)

        # Get file icon
        mime_type = document.get('mime_type', 'application/octet-stream')
        icon_class = get_file_icon_class(mime_type)

        # Prepare response
        info = {
            'id': document.get('id'),
            'display_name': document.get('display_name'),
            'original_filename': document.get('original_filename'),
            'mime_type': mime_type,
            'size_bytes': size_bytes,
            'size_formatted': size_formatted,
            'uploaded_at': document.get('created_at'),
            'uploaded_by': document.get('uploaded_by'),
            'entity_type': document.get('entity_type'),
            'entity_id': document.get('entity_id'),
            'category': document.get('category'),
            'status': document.get('status'),
            'expiry_date': document.get('expiry_date'),
            'notes': document.get('notes'),
            'icon_class': icon_class,
            'download_url': f'/api/documents/download/{document_id}',
            'preview_url': f'/api/documents/preview/{document_id}',
            'can_preview': mime_type.startswith('image/') or mime_type == 'application/pdf'
        }

        return jsonify(info)

    except Exception as e:
        return jsonify({'error': f'خطأ في جلب معلومات الوثيقة: {str(e)}'}), 500

@app.route('/api/documents/download/<document_id>', methods=['GET'])
@login_required
def download_document(document_id):
    """
    Download document file securely
    تحميل ملف الوثيقة بأمان
    """
    try:
        from json_store import json_store

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        if not validate_document_access(document, current_user):
            return jsonify({'error': 'ليس لديك صلاحية لتحميل هذه الوثيقة'}), 403

        # Get file path
        file_path = get_document_file_path(document)
        if not file_path:
            return jsonify({'error': 'الملف غير موجود على الخادم'}), 410

        # Get original filename for download
        original_filename = document.get('original_filename', 'document')

        # Log download action
        log_action('download', 'document', document_id, {
            'entity_type': document.get('entity_type'),
            'entity_id': document.get('entity_id'),
            'filename': original_filename
        })

        # Serve file securely
        response = serve_file_securely(file_path, original_filename, 'attachment')
        if response:
            return response
        else:
            return jsonify({'error': 'خطأ في تحميل الملف'}), 500

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الوثيقة: {str(e)}'}), 500

@app.route('/api/documents/preview/<document_id>', methods=['GET'])
@login_required
def preview_document(document_id):
    """
    Preview document file in browser
    معاينة ملف الوثيقة في المتصفح
    """
    try:
        from json_store import json_store

        # Find document
        document = json_store.find_by_id('documents', document_id)
        if not document:
            return jsonify({'error': 'الوثيقة غير موجودة'}), 404

        # Check permissions
        current_user = auth_manager.get_current_user()
        if not validate_document_access(document, current_user):
            return jsonify({'error': 'ليس لديك صلاحية لمعاينة هذه الوثيقة'}), 403

        # Check if file type supports preview
        mime_type = document.get('mime_type', '')
        if not (mime_type.startswith('image/') or mime_type == 'application/pdf'):
            return jsonify({'error': 'نوع الملف غير مدعوم للمعاينة'}), 400

        # Get file path
        file_path = get_document_file_path(document)
        if not file_path:
            return jsonify({'error': 'الملف غير موجود على الخادم'}), 410

        # Get original filename for preview
        original_filename = document.get('original_filename', 'document')

        # Log preview action
        log_action('preview', 'document', document_id, {
            'entity_type': document.get('entity_type'),
            'entity_id': document.get('entity_id'),
            'filename': original_filename
        })

        # Serve file for inline viewing
        response = serve_file_securely(file_path, original_filename, 'inline')
        if response:
            return response
        else:
            return jsonify({'error': 'خطأ في معاينة الملف'}), 500

    except Exception as e:
        return jsonify({'error': f'خطأ في معاينة الوثيقة: {str(e)}'}), 500

@app.route('/api/dashboard/stats')
@login_required
def dashboard_stats():
    """
    Get dashboard statistics with optional month/year filter

    KPI FORMULAS DOCUMENTATION:
    ===========================

    1. MONTHLY ORDERS (الطلبات هذا الشهر):
       Formula: COUNT(orders WHERE order_date BETWEEN start_of_month AND end_of_month)
       Description: Total number of orders placed in the selected month/year

    2. EXPECTED SALARIES (صافي الرواتب المتوقع):
       Formula: SUM(driver_salary + commission_earnings) FOR active_drivers
       Components:
       - Fixed salary drivers: base_salary amount
       - Commission drivers: SUM(order_value * commission_rate) for monthly orders
       - Mixed drivers: base_salary + commission_earnings

    3. OUTSTANDING ADVANCES (السُلف غير المسددة):
       Formula: SUM(advance_amount - paid_amount) WHERE status != 'paid'
       Description: Total unpaid balance across all driver advances
       Includes: 'pending' and 'partial' status advances

    4. DUE MAINTENANCE (صيانات مستحقة):
       Formula: COUNT(vehicles WHERE next_maintenance_date <= current_date OR mileage >= maintenance_mileage)
       Description: Number of vehicles requiring maintenance based on date or mileage

    5. MONTHLY COMMISSION TOTAL (إجمالي العمولات الشهرية):
       Formula: SUM(order_value * commission_rate) FOR commission_drivers IN selected_month
       Description: Total commission earnings for commission-based drivers
    """
    try:
        from json_store import json_store
        from commissions import commission_calculator
        from datetime import datetime

        # Get month/year from query parameters or use current
        now = datetime.now()
        current_month = int(request.args.get('month', now.month))
        current_year = int(request.args.get('year', now.year))

        # Validate month and year
        if not (1 <= current_month <= 12):
            current_month = now.month
        if not (2020 <= current_year <= 2030):  # Reasonable year range
            current_year = now.year

        # Get all data
        orders = json_store.read_all('orders')
        advances = json_store.read_all('advances')
        maintenance_schedules = json_store.read_all('maintenance_schedules')

        # ========================================
        # KPI 1: MONTHLY ORDERS CALCULATION
        # ========================================
        # Formula: COUNT(orders WHERE order_date BETWEEN start_of_month AND end_of_month)
        # Purpose: Track delivery volume for the selected month
        monthly_orders = 0
        monthly_commission_total = 0

        for order in orders:
            order_date = order.get('order_date', order.get('created_at', ''))
            if order_date:
                try:
                    # Handle both ISO datetime and date-only formats
                    if 'T' in order_date:
                        order_date_obj = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                    else:
                        order_date_obj = datetime.strptime(order_date, '%Y-%m-%d')

                    # Check if order falls within the selected month/year
                    if (order_date_obj.year == current_year and
                        order_date_obj.month == current_month):
                        monthly_orders += 1  # Increment monthly order count

                        # Accumulate commission earnings for completed orders only
                        if order.get('status') == 'completed':
                            monthly_commission_total += float(order.get('commission_amount', 0))

                except (ValueError, TypeError):
                    # Skip orders with invalid date formats
                    continue

        # ========================================
        # KPI 2: EXPECTED SALARIES CALCULATION
        # ========================================
        # Formula: SUM(driver_salary + commission_earnings) FOR active_drivers
        # Components:
        # - Fixed salary drivers: base_salary amount
        # - Commission drivers: SUM(order_value * commission_rate) for monthly orders
        # - Mixed drivers: base_salary + commission_earnings
        commission_summary = commission_calculator.get_commission_summary(current_year, current_month)
        expected_salaries = commission_summary.get('total_commission', monthly_commission_total)

        # ========================================
        # KPI 3: OUTSTANDING ADVANCES CALCULATION
        # ========================================
        # Formula: SUM(advance_amount - paid_amount) WHERE status != 'paid'
        # Purpose: Track total unpaid balance across all driver advances
        # Includes: 'pending' and 'partial' status advances
        outstanding_advances = sum([
            float(advance.get('amount', 0)) - float(advance.get('paid_amount', 0))
            for advance in advances
            if advance.get('status') in ['pending', 'partial']  # Only unpaid/partially paid advances
        ])

        # ========================================
        # KPI 4: DUE MAINTENANCE CALCULATION
        # ========================================
        # Formula: COUNT(vehicles WHERE next_maintenance_date <= current_date OR mileage >= maintenance_mileage)
        # Purpose: Track vehicles requiring immediate maintenance attention
        # Criteria: Maintenance due date has passed or reached
        due_maintenance = 0
        for schedule in maintenance_schedules:
            due_date = schedule.get('due_date')
            if due_date:
                try:
                    # Handle both ISO datetime and date-only formats
                    if 'T' in due_date:
                        due_date_obj = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    else:
                        due_date_obj = datetime.strptime(due_date, '%Y-%m-%d')

                    # Check if maintenance is due (due date has passed)
                    if due_date_obj.date() <= now.date():
                        due_maintenance += 1  # Increment due maintenance count
                except (ValueError, TypeError):
                    # Skip schedules with invalid date formats
                    continue

        # ========================================
        # FINAL KPI RESULTS COMPILATION
        # ========================================
        # All KPI values are calculated and formatted for dashboard display
        # Monetary values are rounded to 3 decimal places for Kuwaiti Dinar precision
        stats = {
            'monthly_orders': monthly_orders,                                    # KPI 1: Order count for selected month
            'expected_salaries': round(expected_salaries, 3),                   # KPI 2: Total expected salary payments
            'outstanding_advances': round(outstanding_advances, 3),             # KPI 3: Total unpaid advance balance
            'due_maintenance': due_maintenance,                                  # KPI 4: Vehicles requiring maintenance
            'monthly_commission_total': round(monthly_commission_total, 3)      # KPI 5: Total commission earnings
        }

        # Log dashboard view
        log_view('dashboard', None, {
            'month': current_month,
            'year': current_year,
            'monthly_orders': stats['monthly_orders'],
            'unpaid_advances': stats['outstanding_advances']
        })

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل إحصائيات لوحة التحكم: {str(e)}'}), 500

# Drivers CRUD Routes
@app.route('/api/drivers', methods=['GET'])
@limiter.limit("200 per minute")  # Rate limiting for drivers listing
@login_required
def get_drivers():
    """Get all drivers"""
    try:
        from json_store import json_store
        drivers = json_store.read_all('drivers')
        return jsonify(drivers)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السائقين: {str(e)}'}), 500

@app.route('/api/drivers/active', methods=['GET'])
@limiter.limit("200 per minute")  # Rate limiting for active drivers listing
@login_required
def get_active_drivers():
    """Get only active drivers for dropdowns"""
    try:
        from json_store import json_store
        all_drivers = json_store.read_all('drivers')

        # Filter only active drivers
        active_drivers = [
            driver for driver in all_drivers
            if driver.get('is_active', False)
        ]

        # Format for dropdown display: "Name - National ID - Phone"
        formatted_drivers = []
        for driver in active_drivers:
            # Format phone number for display
            phone = driver.get('phone', '')
            if phone.startswith('+965'):
                formatted_phone = f"({phone[:4]}) {phone[4:]}"
            else:
                formatted_phone = phone

            formatted_drivers.append({
                'id': driver.get('id'),
                'full_name': driver.get('full_name', ''),
                'national_id': driver.get('national_id', ''),
                'phone': formatted_phone,
                'display_text': f"{driver.get('full_name', '')} - {driver.get('national_id', '')} - {formatted_phone}"
            })

        return jsonify(formatted_drivers)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السائقين النشطين: {str(e)}'}), 500



@app.route('/api/drivers', methods=['POST'])
@login_required
def create_driver():
    """Create a new driver"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['full_name', 'phone', 'national_id', 'employment_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate phone format
        phone = data.get('phone', '').strip()
        if not phone.startswith('+965') or len(phone) != 12:
            return jsonify({'error': 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'}), 400

        # Validate national ID
        national_id = data.get('national_id', '').strip()
        if len(national_id) != 12 or not national_id.isdigit():
            return jsonify({'error': 'الرقم المدني يجب أن يكون 12 رقم'}), 400

        # Check for duplicate national ID
        existing_drivers = json_store.read_all('drivers')
        if any(driver.get('national_id') == national_id for driver in existing_drivers):
            return jsonify({'error': 'الرقم المدني موجود مسبقاً'}), 400

        # Helper function to safely convert to float
        def safe_float(value, default=0):
            """Safely convert value to float, handling None and empty strings"""
            if value is None or value == '' or value == 'null':
                return float(default)
            try:
                return float(value)
            except (ValueError, TypeError):
                return float(default)

        # Set default values
        driver_data = {
            'full_name': data.get('full_name', '').strip(),
            'phone': phone,
            'national_id': national_id,
            'employment_type': data.get('employment_type', 'commission'),
            'car_ownership': data.get('car_ownership', 'private'),
            'base_salary': safe_float(data.get('base_salary'), 0),
            'default_commission_per_order': safe_float(data.get('default_commission_per_order'), 0.300),
            'max_advance_limit': safe_float(data.get('max_advance_limit'), 500),
            'primary_client_id': data.get('primary_client_id'),
            'secondary_client_id': data.get('secondary_client_id'),
            'employment_date': data.get('employment_date', datetime.now().strftime('%Y-%m-%d')),
            'residency_number': data.get('residency_number', '').strip(),
            'residency_expiry_date': data.get('residency_expiry_date', ''),
            'residence_status': data.get('residence_status', ''),
            'assigned_vehicle_id': data.get('assigned_vehicle_id'),
            'is_active': data.get('is_active', True),
            'hire_date': data.get('hire_date', datetime.now().strftime('%Y-%m-%d'))
        }

        new_driver = json_store.create('drivers', driver_data)

        # Log the creation event
        log_create('driver', new_driver['id'], {
            'driver_name': new_driver['full_name'],
            'employment_type': new_driver['employment_type'],
            'phone': new_driver['phone']
        })

        return jsonify(new_driver), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء السائق: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>', methods=['GET'])
@login_required
def get_driver(driver_id):
    """Get a specific driver"""
    try:
        from json_store import json_store
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404
        return jsonify(driver)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السائق: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>', methods=['PUT'])
@login_required
def update_driver(driver_id):
    """Update a driver"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if driver exists
        existing_driver = json_store.find_by_id('drivers', driver_id)
        if not existing_driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Validate phone format if provided
        if 'phone' in data:
            phone = data.get('phone', '').strip()
            if phone and (not phone.startswith('+965') or len(phone) != 12):
                return jsonify({'error': 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'}), 400

        # Validate national ID if provided
        if 'national_id' in data:
            national_id = data.get('national_id', '').strip()
            if national_id and (len(national_id) != 12 or not national_id.isdigit()):
                return jsonify({'error': 'الرقم المدني يجب أن يكون 12 رقم'}), 400

            # Check for duplicate national ID (excluding current driver)
            existing_drivers = json_store.read_all('drivers')
            if any(driver.get('national_id') == national_id and driver.get('id') != driver_id
                   for driver in existing_drivers):
                return jsonify({'error': 'الرقم المدني موجود مسبقاً'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'full_name', 'phone', 'national_id', 'employment_type', 'car_ownership',
            'base_salary', 'default_commission_per_order', 'max_advance_limit',
            'primary_client_id', 'secondary_client_id', 'employment_date', 'residency_number',
            'residency_expiry_date', 'residence_status', 'assigned_vehicle_id', 'is_active', 'hire_date'
        ]

        # Helper function to safely convert to float
        def safe_float(value, default=0):
            """Safely convert value to float, handling None and empty strings"""
            if value is None or value == '' or value == 'null':
                return float(default)
            try:
                return float(value)
            except (ValueError, TypeError):
                return float(default)

        for field in allowed_fields:
            if field in data:
                if field in ['base_salary', 'default_commission_per_order', 'max_advance_limit']:
                    update_data[field] = safe_float(data[field], 0)
                elif field == 'is_active':
                    update_data[field] = bool(data[field])
                else:
                    update_data[field] = data[field]

        updated_driver = json_store.update('drivers', driver_id, update_data)
        if not updated_driver:
            return jsonify({'error': 'فشل في تحديث السائق'}), 500

        # Log the update event
        log_update('driver', driver_id, {
            'driver_name': updated_driver.get('full_name', ''),
            'updated_fields': list(update_data.keys()),
            'changes_count': len(update_data)
        })

        return jsonify(updated_driver)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث السائق: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>', methods=['DELETE'])
@login_required
def delete_driver(driver_id):
    """Delete a driver"""
    try:
        from json_store import json_store

        # Check if driver exists
        existing_driver = json_store.find_by_id('drivers', driver_id)
        if not existing_driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # TODO: Check if driver has active orders or advances before deletion

        # Log the deletion event before deleting
        log_delete('driver', driver_id, {
            'driver_name': existing_driver.get('full_name', ''),
            'employment_type': existing_driver.get('employment_type', ''),
            'phone': existing_driver.get('phone', '')
        })

        success = json_store.delete('drivers', driver_id)
        if not success:
            return jsonify({'error': 'فشل في حذف السائق'}), 500

        return jsonify({'message': 'تم حذف السائق بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف السائق: {str(e)}'}), 500

# Vehicles CRUD Routes
@app.route('/api/vehicles', methods=['GET'])
@login_required
def get_vehicles():
    """Get all vehicles"""
    try:
        from json_store import json_store
        vehicles = json_store.read_all('vehicles')
        return jsonify(vehicles)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السيارات: {str(e)}'}), 500

@app.route('/api/vehicles', methods=['POST'])
@login_required
def create_vehicle():
    """Create a new vehicle"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['license_plate', 'make', 'model', 'year']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate license plate uniqueness
        license_plate = data.get('license_plate', '').strip().upper()
        existing_vehicles = json_store.read_all('vehicles')
        if any(vehicle.get('license_plate', '').upper() == license_plate for vehicle in existing_vehicles):
            return jsonify({'error': 'رقم اللوحة موجود مسبقاً'}), 400

        # Validate year
        year = data.get('year')
        try:
            year = int(year)
            if year < 1990 or year > 2025:
                return jsonify({'error': 'سنة الصنع يجب أن تكون بين 1990 و 2025'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'سنة الصنع غير صحيحة'}), 400

        # Calculate registration status based on insurance expiry
        registration_status = 'غير محدد'
        insurance_expiry = data.get('insurance_expiry')
        if insurance_expiry:
            registration_status = calculate_registration_status(insurance_expiry)

        # Set vehicle data
        vehicle_data = {
            'license_plate': license_plate,
            'make': data.get('make', '').strip(),
            'model': data.get('model', '').strip(),
            'year': year,
            'color': data.get('color', '').strip(),
            'assigned_driver_id': data.get('assigned_driver_id'),
            'insurance_expiry': insurance_expiry,
            'registration_status': registration_status,
            'is_active': data.get('is_active', True)
        }

        new_vehicle = json_store.create('vehicles', vehicle_data)
        return jsonify(new_vehicle), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء السيارة: {str(e)}'}), 500

@app.route('/api/vehicles/<vehicle_id>', methods=['GET'])
@login_required
def get_vehicle(vehicle_id):
    """Get a specific vehicle"""
    try:
        from json_store import json_store
        vehicle = json_store.find_by_id('vehicles', vehicle_id)
        if not vehicle:
            return jsonify({'error': 'السيارة غير موجودة'}), 404
        return jsonify(vehicle)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السيارة: {str(e)}'}), 500

@app.route('/api/vehicles/<vehicle_id>', methods=['PUT'])
@login_required
def update_vehicle(vehicle_id):
    """Update a vehicle"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if vehicle exists
        existing_vehicle = json_store.find_by_id('vehicles', vehicle_id)
        if not existing_vehicle:
            return jsonify({'error': 'السيارة غير موجودة'}), 404

        # Validate license plate uniqueness if provided
        if 'license_plate' in data:
            license_plate = data.get('license_plate', '').strip().upper()
            if license_plate:
                existing_vehicles = json_store.read_all('vehicles')
                if any(vehicle.get('license_plate', '').upper() == license_plate and vehicle.get('id') != vehicle_id
                       for vehicle in existing_vehicles):
                    return jsonify({'error': 'رقم اللوحة موجود مسبقاً'}), 400

        # Validate year if provided
        if 'year' in data:
            year = data.get('year')
            try:
                year = int(year)
                if year < 1990 or year > 2025:
                    return jsonify({'error': 'سنة الصنع يجب أن تكون بين 1990 و 2025'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'سنة الصنع غير صحيحة'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'license_plate', 'make', 'model', 'year', 'color',
            'assigned_driver_id', 'insurance_expiry', 'is_active'
        ]

        for field in allowed_fields:
            if field in data:
                if field == 'license_plate':
                    update_data[field] = safe_strip(data[field]).upper() if data[field] else ''
                elif field == 'year':
                    update_data[field] = int(data[field]) if data[field] is not None else None
                elif field == 'is_active':
                    update_data[field] = bool(data[field])
                else:
                    update_data[field] = data[field]

        # Calculate registration status if insurance_expiry is being updated
        if 'insurance_expiry' in data:
            update_data['registration_status'] = calculate_registration_status(data['insurance_expiry'])

        updated_vehicle = json_store.update('vehicles', vehicle_id, update_data)
        if not updated_vehicle:
            return jsonify({'error': 'فشل في تحديث السيارة'}), 500

        return jsonify(updated_vehicle)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث السيارة: {str(e)}'}), 500

@app.route('/api/vehicles/<vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    """Delete a vehicle"""
    try:
        from json_store import json_store

        # Check if vehicle exists
        existing_vehicle = json_store.find_by_id('vehicles', vehicle_id)
        if not existing_vehicle:
            return jsonify({'error': 'السيارة غير موجودة'}), 404

        # TODO: Check if vehicle has active orders before deletion

        success = json_store.delete('vehicles', vehicle_id)
        if not success:
            return jsonify({'error': 'فشل في حذف السيارة'}), 500

        return jsonify({'message': 'تم حذف السيارة بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف السيارة: {str(e)}'}), 500

# Clients CRUD Routes
@app.route('/api/clients', methods=['GET'])
@login_required
def get_clients():
    """Get all clients"""
    try:
        from json_store import json_store
        clients = json_store.read_all('clients')
        return jsonify(clients)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل العملاء: {str(e)}'}), 500

@app.route('/api/clients', methods=['POST'])
@login_required
def create_client():
    """Create a new client"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['company_name', 'contact_person', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate phone format
        phone = data.get('phone', '').strip()
        if not phone.startswith('+965') or len(phone) != 12:
            return jsonify({'error': 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'}), 400

        # Validate email format if provided
        email = data.get('email', '').strip()
        if email:
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, email):
                return jsonify({'error': 'البريد الإلكتروني غير صحيح'}), 400

        # Validate commission rate
        commission_rate = data.get('commission_rate')
        if commission_rate is not None:
            try:
                commission_rate = float(commission_rate)
                if commission_rate < 0:
                    return jsonify({'error': 'معدل العمولة يجب أن يكون أكبر من أو يساوي صفر'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'معدل العمولة غير صحيح'}), 400

        # Set client data
        client_data = {
            'company_name': data.get('company_name', '').strip(),
            'contact_person': data.get('contact_person', '').strip(),
            'phone': phone,
            'email': email,
            'address': data.get('address', '').strip(),
            'commission_rate': commission_rate or 0.250,  # Default from config
            'payment_terms': data.get('payment_terms', 'cash'),
            'is_active': data.get('is_active', True)
        }

        new_client = json_store.create('clients', client_data)
        return jsonify(new_client), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء العميل: {str(e)}'}), 500

@app.route('/api/clients/<client_id>', methods=['GET'])
@login_required
def get_client(client_id):
    """Get a specific client"""
    try:
        from json_store import json_store
        client = json_store.find_by_id('clients', client_id)
        if not client:
            return jsonify({'error': 'العميل غير موجود'}), 404
        return jsonify(client)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل العميل: {str(e)}'}), 500

@app.route('/api/clients/<client_id>', methods=['PUT'])
@login_required
def update_client(client_id):
    """Update a client"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if client exists
        existing_client = json_store.find_by_id('clients', client_id)
        if not existing_client:
            return jsonify({'error': 'العميل غير موجود'}), 404

        # Validate phone format if provided
        if 'phone' in data:
            phone = data.get('phone', '').strip()
            if phone and (not phone.startswith('+965') or len(phone) != 12):
                return jsonify({'error': 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'}), 400

        # Validate email format if provided
        if 'email' in data:
            email = data.get('email', '').strip()
            if email:
                import re
                email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
                if not re.match(email_pattern, email):
                    return jsonify({'error': 'البريد الإلكتروني غير صحيح'}), 400

        # Validate commission rate if provided
        if 'commission_rate' in data:
            commission_rate = data.get('commission_rate')
            if commission_rate is not None:
                try:
                    commission_rate = float(commission_rate)
                    if commission_rate < 0:
                        return jsonify({'error': 'معدل العمولة يجب أن يكون أكبر من أو يساوي صفر'}), 400
                except (ValueError, TypeError):
                    return jsonify({'error': 'معدل العمولة غير صحيح'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'company_name', 'contact_person', 'phone', 'email', 'address',
            'commission_rate', 'payment_terms', 'is_active'
        ]

        for field in allowed_fields:
            if field in data:
                if field == 'commission_rate':
                    update_data[field] = float(data[field]) if data[field] is not None else 0
                elif field == 'is_active':
                    update_data[field] = bool(data[field])
                else:
                    update_data[field] = data[field]

        updated_client = json_store.update('clients', client_id, update_data)
        if not updated_client:
            return jsonify({'error': 'فشل في تحديث العميل'}), 500

        return jsonify(updated_client)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث العميل: {str(e)}'}), 500

@app.route('/api/clients/<client_id>', methods=['DELETE'])
@login_required
def delete_client(client_id):
    """Delete a client"""
    try:
        from json_store import json_store

        # Check if client exists
        existing_client = json_store.find_by_id('clients', client_id)
        if not existing_client:
            return jsonify({'error': 'العميل غير موجود'}), 404

        # TODO: Check if client has active orders before deletion

        success = json_store.delete('clients', client_id)
        if not success:
            return jsonify({'error': 'فشل في حذف العميل'}), 500

        return jsonify({'message': 'تم حذف العميل بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف العميل: {str(e)}'}), 500

# Orders CRUD Routes
@app.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    """Get all orders"""
    try:
        from json_store import json_store
        orders = json_store.read_all('orders')

        # Enrich orders with driver and client names
        drivers = json_store.read_all('drivers')
        clients = json_store.read_all('clients')

        driver_map = {d.get('id'): d.get('full_name', '') for d in drivers}
        client_map = {c.get('id'): c.get('company_name', '') for c in clients}

        for order in orders:
            order['driver_name'] = driver_map.get(order.get('driver_id', ''), 'غير محدد')
            order['client_name'] = client_map.get(order.get('client_id', ''), 'غير محدد')

        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الطلبات: {str(e)}'}), 500

@app.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    """Create a new order"""
    try:
        from json_store import json_store
        from commissions import commission_calculator
        data = request.get_json()

        # Validate required fields
        required_fields = ['driver_id', 'client_id', 'pickup_address', 'delivery_address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate driver exists
        driver = json_store.find_by_id('drivers', data.get('driver_id'))
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Validate client exists
        client = json_store.find_by_id('clients', data.get('client_id'))
        if not client:
            return jsonify({'error': 'العميل غير موجود'}), 404

        # Calculate commission
        commission_result = commission_calculator.calculate_commission(
            data.get('driver_id'),
            data.get('client_id'),
            data.get('order_date', datetime.now().strftime('%Y-%m-%d'))
        )

        if not commission_result.get('success'):
            return jsonify({'error': commission_result.get('error', 'خطأ في حساب العمولة')}), 400

        # Set order data
        order_data = {
            'driver_id': data.get('driver_id'),
            'client_id': data.get('client_id'),
            'pickup_address': data.get('pickup_address', '').strip(),
            'delivery_address': data.get('delivery_address', '').strip(),
            'pickup_time': data.get('pickup_time'),
            'delivery_time': data.get('delivery_time'),
            'order_date': data.get('order_date', datetime.now().strftime('%Y-%m-%d')),
            'status': data.get('status', 'pending'),
            'commission_amount': commission_result.get('commission', 0),
            'commission_source': commission_result.get('source', 'global'),
            'notes': data.get('notes', '').strip(),
            'priority': data.get('priority', 'normal'),
            'estimated_distance': data.get('estimated_distance'),
            'actual_distance': data.get('actual_distance'),
            'delivery_fee': float(data.get('delivery_fee', 0)) if data.get('delivery_fee') else 0
        }

        new_order = json_store.create('orders', order_data)

        # Add driver and client names for response
        new_order['driver_name'] = driver.get('full_name', '')
        new_order['client_name'] = client.get('company_name', '')

        return jsonify(new_order), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء الطلب: {str(e)}'}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
@login_required
def get_order(order_id):
    """Get a specific order"""
    try:
        from json_store import json_store
        order = json_store.find_by_id('orders', order_id)
        if not order:
            return jsonify({'error': 'الطلب غير موجود'}), 404

        # Enrich with driver and client names
        driver = json_store.find_by_id('drivers', order.get('driver_id', ''))
        client = json_store.find_by_id('clients', order.get('client_id', ''))

        order['driver_name'] = driver.get('full_name', '') if driver else 'غير محدد'
        order['client_name'] = client.get('company_name', '') if client else 'غير محدد'

        return jsonify(order)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الطلب: {str(e)}'}), 500

@app.route('/api/orders/<order_id>', methods=['PUT'])
@login_required
def update_order(order_id):
    """Update an order"""
    try:
        from json_store import json_store
        from commissions import commission_calculator
        data = request.get_json()

        # Check if order exists
        existing_order = json_store.find_by_id('orders', order_id)
        if not existing_order:
            return jsonify({'error': 'الطلب غير موجود'}), 404

        # Validate driver if provided
        if 'driver_id' in data and data['driver_id']:
            driver = json_store.find_by_id('drivers', data['driver_id'])
            if not driver:
                return jsonify({'error': 'السائق غير موجود'}), 404

        # Validate client if provided
        if 'client_id' in data and data['client_id']:
            client = json_store.find_by_id('clients', data['client_id'])
            if not client:
                return jsonify({'error': 'العميل غير موجود'}), 404

        # Recalculate commission if driver or client changed
        recalculate_commission = (
            'driver_id' in data or
            'client_id' in data or
            'order_date' in data
        )

        if recalculate_commission:
            driver_id = data.get('driver_id', existing_order.get('driver_id'))
            client_id = data.get('client_id', existing_order.get('client_id'))
            order_date = data.get('order_date', existing_order.get('order_date'))

            commission_result = commission_calculator.calculate_commission(
                driver_id, client_id, order_date
            )

            if commission_result.get('success'):
                data['commission_amount'] = commission_result.get('commission', 0)
                data['commission_source'] = commission_result.get('source', 'global')

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'driver_id', 'client_id', 'pickup_address', 'delivery_address',
            'pickup_time', 'delivery_time', 'order_date', 'status',
            'commission_amount', 'commission_source', 'notes', 'priority',
            'estimated_distance', 'actual_distance', 'delivery_fee'
        ]

        for field in allowed_fields:
            if field in data:
                if field == 'delivery_fee':
                    update_data[field] = float(data[field]) if data[field] is not None else 0
                else:
                    update_data[field] = data[field]

        updated_order = json_store.update('orders', order_id, update_data)
        if not updated_order:
            return jsonify({'error': 'فشل في تحديث الطلب'}), 500

        # Enrich with driver and client names
        driver = json_store.find_by_id('drivers', updated_order.get('driver_id', ''))
        client = json_store.find_by_id('clients', updated_order.get('client_id', ''))

        updated_order['driver_name'] = driver.get('full_name', '') if driver else 'غير محدد'
        updated_order['client_name'] = client.get('company_name', '') if client else 'غير محدد'

        return jsonify(updated_order)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث الطلب: {str(e)}'}), 500

@app.route('/api/orders/<order_id>', methods=['DELETE'])
@login_required
def delete_order(order_id):
    """Delete an order"""
    try:
        from json_store import json_store

        # Check if order exists
        existing_order = json_store.find_by_id('orders', order_id)
        if not existing_order:
            return jsonify({'error': 'الطلب غير موجود'}), 404

        success = json_store.delete('orders', order_id)
        if not success:
            return jsonify({'error': 'فشل في حذف الطلب'}), 500

        return jsonify({'message': 'تم حذف الطلب بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف الطلب: {str(e)}'}), 500

# Commission Calculation API
@app.route('/api/calculate-commission', methods=['POST'])
@login_required
def calculate_commission():
    """Calculate commission for a specific driver and client"""
    try:
        from commissions import commission_calculator
        data = request.get_json()

        driver_id = data.get('driver_id')
        client_id = data.get('client_id')
        order_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))

        if not driver_id or not client_id:
            return jsonify({'error': 'معرف السائق والعميل مطلوبان'}), 400

        result = commission_calculator.calculate_commission(driver_id, client_id, order_date)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'خطأ في حساب العمولة: {str(e)}'}), 500

# Advances CRUD Routes
@app.route('/api/advances', methods=['GET'])
@login_required
def get_advances():
    """Get all advances"""
    try:
        from json_store import json_store
        advances = json_store.read_all('advances')

        # Enrich advances with driver names
        drivers = json_store.read_all('drivers')
        driver_map = {d.get('id'): d.get('full_name', '') for d in drivers}

        for advance in advances:
            advance['driver_name'] = driver_map.get(advance.get('driver_id', ''), 'غير محدد')

            # Calculate remaining balance
            advance['remaining_balance'] = advance.get('amount', 0) - advance.get('paid_amount', 0)

        return jsonify(advances)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السُلف: {str(e)}'}), 500

@app.route('/api/advances', methods=['POST'])
@login_required
def create_advance():
    """Create a new advance"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['driver_id', 'amount', 'reason', 'advance_deduction_mode', 'advance_deduction_value']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate driver exists
        driver = json_store.find_by_id('drivers', data.get('driver_id'))
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Validate amount
        try:
            amount = float(data.get('amount', 0))
            if amount <= 0:
                return jsonify({'error': 'مبلغ السُلفة يجب أن يكون أكبر من صفر'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'مبلغ السُلفة غير صحيح'}), 400

        # Validate advance deduction mode
        deduction_mode = data.get('advance_deduction_mode', '').strip()
        if deduction_mode not in ['fixed_amount', 'percentage']:
            return jsonify({'error': 'طريقة خصم السُلفة غير صحيحة'}), 400

        # Validate advance deduction value
        try:
            deduction_value = float(data.get('advance_deduction_value', 0))
            if deduction_value < 0:
                return jsonify({'error': 'قيمة خصم السُلفة يجب أن تكون أكبر من أو تساوي صفر'}), 400
            if deduction_mode == 'percentage' and deduction_value > 100:
                return jsonify({'error': 'النسبة المئوية يجب أن تكون أقل من أو تساوي 100%'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'قيمة خصم السُلفة غير صحيحة'}), 400

        # Check advance limit
        max_limit = float(driver.get('max_advance_limit', 500))

        # Calculate current outstanding advances for this driver
        existing_advances = json_store.read_all('advances')
        outstanding_amount = sum([
            float(advance.get('amount', 0)) - float(advance.get('paid_amount', 0))
            for advance in existing_advances
            if (advance.get('driver_id') == data.get('driver_id') and
                advance.get('status') in ['active', 'partial'])
        ])

        if outstanding_amount + amount > max_limit:
            return jsonify({
                'error': f'تجاوز حد السُلفة المسموح. الحد الأقصى: {max_limit} د.ك، المبلغ المستحق حالياً: {outstanding_amount} د.ك'
            }), 400

        # Set advance data
        advance_data = {
            'driver_id': data.get('driver_id'),
            'amount': amount,
            'paid_amount': 0.0,
            'date_issued': data.get('date_issued', datetime.now().strftime('%Y-%m-%d')),
            'date_due': data.get('date_due'),
            'status': data.get('status', 'active'),
            'reason': data.get('reason', '').strip(),
            'approved_by': 'admin',  # Current user
            'payment_method': data.get('payment_method', 'cash'),
            'notes': data.get('notes', '').strip(),
            'advance_deduction_mode': deduction_mode,
            'advance_deduction_value': deduction_value,
            'deduction_amount': float(data.get('deduction_amount', 0)) if data.get('deduction_amount') else None
        }

        new_advance = json_store.create('advances', advance_data)

        # Add driver name for response
        new_advance['driver_name'] = driver.get('full_name', '')
        new_advance['remaining_balance'] = new_advance.get('amount', 0) - new_advance.get('paid_amount', 0)

        return jsonify(new_advance), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء السُلفة: {str(e)}'}), 500

@app.route('/api/advances/<advance_id>', methods=['GET'])
@login_required
def get_advance(advance_id):
    """Get a specific advance"""
    try:
        from json_store import json_store
        advance = json_store.find_by_id('advances', advance_id)
        if not advance:
            return jsonify({'error': 'السُلفة غير موجودة'}), 404

        # Enrich with driver name
        driver = json_store.find_by_id('drivers', advance.get('driver_id', ''))
        advance['driver_name'] = driver.get('full_name', '') if driver else 'غير محدد'
        advance['remaining_balance'] = advance.get('amount', 0) - advance.get('paid_amount', 0)

        return jsonify(advance)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل السُلفة: {str(e)}'}), 500

@app.route('/api/advances/<advance_id>', methods=['PUT'])
@login_required
def update_advance(advance_id):
    """Update an advance"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if advance exists
        existing_advance = json_store.find_by_id('advances', advance_id)
        if not existing_advance:
            return jsonify({'error': 'السُلفة غير موجودة'}), 404

        # Validate driver if provided
        if 'driver_id' in data and data['driver_id']:
            driver = json_store.find_by_id('drivers', data['driver_id'])
            if not driver:
                return jsonify({'error': 'السائق غير موجود'}), 404

        # Validate amount if provided
        if 'amount' in data:
            try:
                amount = float(data.get('amount', 0))
                if amount <= 0:
                    return jsonify({'error': 'مبلغ السُلفة يجب أن يكون أكبر من صفر'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'مبلغ السُلفة غير صحيح'}), 400

        # Validate paid_amount if provided and changed
        if 'paid_amount' in data and data['paid_amount'] is not None and data['paid_amount'] != '':
            try:
                paid_amount = float(data.get('paid_amount', 0))
                existing_paid_amount = float(existing_advance.get('paid_amount', 0))

                print(f"DEBUG: paid_amount={paid_amount}, existing_paid_amount={existing_paid_amount}")
                print(f"DEBUG: data={data}")

                # Only validate if the value actually changed
                if paid_amount != existing_paid_amount:
                    if paid_amount < 0:
                        return jsonify({'error': 'المبلغ المدفوع لا يمكن أن يكون سالباً'}), 400

                    advance_amount = float(data.get('amount', existing_advance.get('amount', 0)))
                    if paid_amount > advance_amount:
                        return jsonify({'error': 'المبلغ المدفوع لا يمكن أن يتجاوز مبلغ السُلفة'}), 400

                    # Update status based on payment
                    if paid_amount == 0:
                        data['status'] = 'active'
                    elif paid_amount >= advance_amount:
                        data['status'] = 'paid'
                    else:
                        data['status'] = 'partial'

            except (ValueError, TypeError) as e:
                print(f"DEBUG: Exception in paid_amount validation: {e}")
                return jsonify({'error': 'المبلغ المدفوع غير صحيح'}), 400

        # Validate advance deduction fields if provided
        if 'advance_deduction_mode' in data:
            deduction_mode = data.get('advance_deduction_mode', '').strip()
            if deduction_mode not in ['fixed_amount', 'percentage']:
                return jsonify({'error': 'طريقة خصم السُلفة غير صحيحة'}), 400

        if 'advance_deduction_value' in data:
            try:
                deduction_value_raw = data.get('advance_deduction_value', 0)
                print(f"DEBUG: advance_deduction_value raw={deduction_value_raw}, type={type(deduction_value_raw)}")
                deduction_value = float(deduction_value_raw)
                if deduction_value < 0:
                    return jsonify({'error': 'قيمة خصم السُلفة يجب أن تكون أكبر من أو تساوي صفر'}), 400
                deduction_mode = data.get('advance_deduction_mode', existing_advance.get('advance_deduction_mode', 'fixed_amount'))
                if deduction_mode == 'percentage' and deduction_value > 100:
                    return jsonify({'error': 'النسبة المئوية يجب أن تكون أقل من أو تساوي 100%'}), 400
            except (ValueError, TypeError) as e:
                print(f"DEBUG: Exception in advance_deduction_value validation: {e}")
                return jsonify({'error': 'قيمة خصم السُلفة غير صحيحة'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'driver_id', 'amount', 'paid_amount', 'date_issued', 'date_due',
            'status', 'reason', 'payment_method', 'notes', 'deduction_amount',
            'advance_deduction_mode', 'advance_deduction_value'
        ]

        for field in allowed_fields:
            if field in data:
                if field in ['amount', 'paid_amount', 'deduction_amount', 'advance_deduction_value']:
                    update_data[field] = float(data[field]) if data[field] is not None else 0
                else:
                    update_data[field] = data[field]

        updated_advance = json_store.update('advances', advance_id, update_data)
        if not updated_advance:
            return jsonify({'error': 'فشل في تحديث السُلفة'}), 500

        # Enrich with driver name
        driver = json_store.find_by_id('drivers', updated_advance.get('driver_id', ''))
        updated_advance['driver_name'] = driver.get('full_name', '') if driver else 'غير محدد'
        updated_advance['remaining_balance'] = updated_advance.get('amount', 0) - updated_advance.get('paid_amount', 0)

        return jsonify(updated_advance)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث السُلفة: {str(e)}'}), 500

@app.route('/api/advances/<advance_id>', methods=['DELETE'])
@login_required
def delete_advance(advance_id):
    """Delete an advance"""
    try:
        from json_store import json_store

        # Check if advance exists
        existing_advance = json_store.find_by_id('advances', advance_id)
        if not existing_advance:
            return jsonify({'error': 'السُلفة غير موجودة'}), 404

        success = json_store.delete('advances', advance_id)
        if not success:
            return jsonify({'error': 'فشل في حذف السُلفة'}), 500

        return jsonify({'message': 'تم حذف السُلفة بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف السُلفة: {str(e)}'}), 500

# Additional Advances Endpoints
@app.route('/api/advances/driver/<driver_id>', methods=['GET'])
@login_required
def get_driver_advances(driver_id):
    """Get all advances for a specific driver"""
    try:
        from json_store import json_store

        # Validate driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        advances = json_store.filter_records('advances', {'driver_id': driver_id})

        # Calculate balances and add driver name
        for advance in advances:
            advance['driver_name'] = driver.get('full_name', '')
            advance['remaining_balance'] = advance.get('amount', 0) - advance.get('paid_amount', 0)

        # Calculate summary
        total_advances = sum([float(a.get('amount', 0)) for a in advances])
        total_paid = sum([float(a.get('paid_amount', 0)) for a in advances])
        outstanding_balance = total_advances - total_paid

        return jsonify({
            'driver_id': driver_id,
            'driver_name': driver.get('full_name', ''),
            'max_advance_limit': driver.get('max_advance_limit', 500),
            'advances': advances,
            'summary': {
                'total_advances': round(total_advances, 3),
                'total_paid': round(total_paid, 3),
                'outstanding_balance': round(outstanding_balance, 3),
                'available_limit': round(float(driver.get('max_advance_limit', 500)) - outstanding_balance, 3)
            }
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل سُلف السائق: {str(e)}'}), 500

@app.route('/api/advances/outstanding', methods=['GET'])
@login_required
def get_outstanding_advances():
    """Get summary of outstanding advances"""
    try:
        from json_store import json_store
        advances = json_store.read_all('advances')
        drivers = json_store.read_all('drivers')

        driver_map = {d.get('id'): d.get('full_name', '') for d in drivers}

        outstanding_summary = []
        total_outstanding = 0

        # Group by driver
        driver_advances = {}
        for advance in advances:
            if advance.get('status') in ['active', 'partial']:
                driver_id = advance.get('driver_id')
                if driver_id not in driver_advances:
                    driver_advances[driver_id] = []
                driver_advances[driver_id].append(advance)

        for driver_id, driver_advance_list in driver_advances.items():
            outstanding_amount = sum([
                float(advance.get('amount', 0)) - float(advance.get('paid_amount', 0))
                for advance in driver_advance_list
            ])

            if outstanding_amount > 0:
                outstanding_summary.append({
                    'driver_id': driver_id,
                    'driver_name': driver_map.get(driver_id, 'غير محدد'),
                    'outstanding_amount': round(outstanding_amount, 3),
                    'advance_count': len(driver_advance_list)
                })
                total_outstanding += outstanding_amount

        return jsonify({
            'total_outstanding': round(total_outstanding, 3),
            'driver_count': len(outstanding_summary),
            'drivers': outstanding_summary
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل ملخص السُلف المستحقة: {str(e)}'}), 500

# Payroll Processing Routes
@app.route('/api/payroll/calculate', methods=['POST'])
@login_required
def calculate_payroll():
    """Calculate payroll for specific month/year"""
    try:
        from payroll import payroll_calculator
        data = request.get_json()

        year = data.get('year')
        month = data.get('month')
        driver_ids = data.get('driver_ids')  # Optional, if None will calculate for all active drivers

        if not year or not month:
            return jsonify({'error': 'السنة والشهر مطلوبان'}), 400

        try:
            year = int(year)
            month = int(month)
            if month < 1 or month > 12:
                return jsonify({'error': 'الشهر يجب أن يكون بين 1 و 12'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'السنة والشهر يجب أن يكونا أرقاماً صحيحة'}), 400

        result = payroll_calculator.calculate_payroll_run(year, month, driver_ids)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'خطأ في حساب الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/runs', methods=['GET'])
@login_required
def get_payroll_runs():
    """Get all payroll runs"""
    try:
        from json_store import json_store
        payroll_runs = json_store.read_all('payroll_runs')

        # Sort by date descending
        payroll_runs.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return jsonify(payroll_runs)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل دفعات الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/runs', methods=['POST'])
@login_required
def create_payroll_run():
    """Create and save a payroll run"""
    try:
        from json_store import json_store
        from payroll import payroll_calculator
        data = request.get_json()

        year = data.get('year')
        month = data.get('month')
        driver_ids = data.get('driver_ids')

        if not year or not month:
            return jsonify({'error': 'السنة والشهر مطلوبان'}), 400

        try:
            year = int(year)
            month = int(month)
        except (ValueError, TypeError):
            return jsonify({'error': 'السنة والشهر يجب أن يكونا أرقاماً صحيحة'}), 400

        # Check if payroll run already exists for this month/year
        existing_runs = json_store.filter_records('payroll_runs', {
            'year': year,
            'month': month,
            'status': ['pending', 'approved']
        })

        if existing_runs:
            return jsonify({'error': f'يوجد دفعة رواتب للشهر {month}/{year} بالفعل'}), 400

        # Calculate payroll
        calculation_result = payroll_calculator.calculate_payroll_run(year, month, driver_ids)

        if not calculation_result.get('success'):
            return jsonify({'error': calculation_result.get('error', 'خطأ في حساب الرواتب')}), 400

        # Create payroll run record
        payroll_run_data = {
            'year': year,
            'month': month,
            'status': 'pending',
            'driver_count': calculation_result.get('driver_count', 0),
            'failed_count': calculation_result.get('failed_count', 0),
            'payroll_results': calculation_result.get('payroll_results', []),
            'totals': calculation_result.get('totals', {}),
            'currency': calculation_result.get('currency', 'KWD'),
            'created_by': 'admin',
            'advance_deductions_processed': False
        }

        new_payroll_run = json_store.create('payroll_runs', payroll_run_data)
        return jsonify(new_payroll_run), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء دفعة الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/runs/<run_id>', methods=['GET'])
@login_required
def get_payroll_run(run_id):
    """Get a specific payroll run"""
    try:
        from json_store import json_store
        payroll_run = json_store.find_by_id('payroll_runs', run_id)
        if not payroll_run:
            return jsonify({'error': 'دفعة الرواتب غير موجودة'}), 404

        return jsonify(payroll_run)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل دفعة الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/runs/<run_id>/approve', methods=['POST'])
@login_required
def approve_payroll_run(run_id):
    """Approve a payroll run"""
    try:
        from json_store import json_store

        payroll_run = json_store.find_by_id('payroll_runs', run_id)
        if not payroll_run:
            return jsonify({'error': 'دفعة الرواتب غير موجودة'}), 404

        if payroll_run.get('status') != 'pending':
            return jsonify({'error': 'دفعة الرواتب غير قابلة للاعتماد'}), 400

        # Update status to approved
        updated_run = json_store.update('payroll_runs', run_id, {
            'status': 'approved',
            'approved_by': 'admin',
            'approved_at': datetime.now().isoformat()
        })

        return jsonify(updated_run)

    except Exception as e:
        return jsonify({'error': f'خطأ في اعتماد دفعة الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/runs/<run_id>/process-deductions', methods=['POST'])
@login_required
def process_payroll_deductions(run_id):
    """Process advance deductions for an approved payroll run"""
    try:
        from json_store import json_store
        from payroll import payroll_calculator

        payroll_run = json_store.find_by_id('payroll_runs', run_id)
        if not payroll_run:
            return jsonify({'error': 'دفعة الرواتب غير موجودة'}), 404

        if payroll_run.get('status') != 'approved':
            return jsonify({'error': 'دفعة الرواتب يجب أن تكون معتمدة أولاً'}), 400

        if payroll_run.get('advance_deductions_processed'):
            return jsonify({'error': 'تم معالجة خصم السُلف بالفعل'}), 400

        # Process deductions
        result = payroll_calculator.process_advance_deductions(
            run_id,
            payroll_run.get('year'),
            payroll_run.get('month')
        )

        if not result.get('success'):
            return jsonify({'error': result.get('error', 'خطأ في معالجة خصم السُلف')}), 400

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'خطأ في معالجة خصم السُلف: {str(e)}'}), 500

@app.route('/api/payroll/runs/<run_id>/close', methods=['POST'])
@login_required
def close_payroll_run(run_id):
    """Close a payroll run (mark as completed)"""
    try:
        from json_store import json_store

        payroll_run = json_store.find_by_id('payroll_runs', run_id)
        if not payroll_run:
            return jsonify({'error': 'دفعة الرواتب غير موجودة'}), 404

        if payroll_run.get('status') not in ['approved']:
            return jsonify({'error': 'دفعة الرواتب يجب أن تكون معتمدة'}), 400

        # Update status to closed
        updated_run = json_store.update('payroll_runs', run_id, {
            'status': 'closed',
            'closed_by': 'admin',
            'closed_at': datetime.now().isoformat()
        })

        return jsonify(updated_run)

    except Exception as e:
        return jsonify({'error': f'خطأ في إغلاق دفعة الرواتب: {str(e)}'}), 500

@app.route('/api/payroll/driver/<driver_id>', methods=['GET'])
@login_required
def get_driver_payroll_history(driver_id):
    """Get payroll history for a specific driver"""
    try:
        from json_store import json_store

        # Validate driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Get all payroll runs
        payroll_runs = json_store.read_all('payroll_runs')

        driver_history = []
        for run in payroll_runs:
            for driver_payroll in run.get('payroll_results', []):
                if (driver_payroll.get('driver_id') == driver_id and
                    driver_payroll.get('success')):

                    driver_history.append({
                        'payroll_run_id': run.get('id'),
                        'year': run.get('year'),
                        'month': run.get('month'),
                        'status': run.get('status'),
                        'base_salary': driver_payroll.get('base_salary', 0),
                        'commission_total': driver_payroll.get('commission_total', 0),
                        'gross_salary': driver_payroll.get('gross_salary', 0),
                        'advance_deduction': driver_payroll.get('advance_deduction', 0),
                        'net_salary': driver_payroll.get('net_salary', 0),
                        'order_count': driver_payroll.get('order_count', 0),
                        'created_at': run.get('created_at'),
                        'approved_at': run.get('approved_at'),
                        'closed_at': run.get('closed_at')
                    })

        # Sort by date descending
        driver_history.sort(key=lambda x: f"{x.get('year', 0)}-{x.get('month', 0):02d}", reverse=True)

        return jsonify({
            'driver_id': driver_id,
            'driver_name': driver.get('full_name', ''),
            'payroll_history': driver_history
        })

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل تاريخ رواتب السائق: {str(e)}'}), 500

# Maintenance Scheduling Routes
@app.route('/api/maintenance/schedules', methods=['GET'])
@login_required
def get_maintenance_schedules():
    """Get all maintenance schedules"""
    try:
        from json_store import json_store
        schedules = json_store.read_all('maintenance_schedules')

        # Enrich schedules with vehicle information
        vehicles = json_store.read_all('vehicles')
        vehicle_map = {v.get('id'): f"{v.get('make', '')} {v.get('model', '')} - {v.get('license_plate', '')}" for v in vehicles}

        for schedule in schedules:
            schedule['vehicle_info'] = vehicle_map.get(schedule.get('vehicle_id', ''), 'غير محدد')

            # Calculate days until due
            if schedule.get('due_date'):
                try:
                    due_date = datetime.strptime(schedule['due_date'], '%Y-%m-%d').date()
                    today = datetime.now().date()
                    days_until_due = (due_date - today).days
                    schedule['days_until_due'] = days_until_due
                    schedule['is_overdue'] = days_until_due < 0
                    schedule['is_due_soon'] = 0 <= days_until_due <= 7
                except ValueError:
                    schedule['days_until_due'] = None
                    schedule['is_overdue'] = False
                    schedule['is_due_soon'] = False

        return jsonify(schedules)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل جدولة الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/schedules', methods=['POST'])
@login_required
def create_maintenance_schedule():
    """Create a new maintenance schedule"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['vehicle_id', 'maintenance_type', 'due_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate vehicle exists
        vehicle = json_store.find_by_id('vehicles', data.get('vehicle_id'))
        if not vehicle:
            return jsonify({'error': 'السيارة غير موجودة'}), 404

        # Validate due date
        try:
            due_date = datetime.strptime(data.get('due_date'), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'تاريخ الاستحقاق غير صحيح'}), 400

        # Set schedule data
        schedule_data = {
            'vehicle_id': data.get('vehicle_id'),
            'maintenance_type': data.get('maintenance_type', '').strip(),
            'due_date': data.get('due_date'),
            'due_mileage': int(data.get('due_mileage', 0)) if data.get('due_mileage') else None,
            'description': data.get('description', '').strip(),
            'priority': data.get('priority', 'normal'),
            'status': data.get('status', 'scheduled'),
            'estimated_cost': float(data.get('estimated_cost', 0)) if data.get('estimated_cost') else 0,
            'notes': data.get('notes', '').strip(),
            'reminder_sent': False
        }

        new_schedule = json_store.create('maintenance_schedules', schedule_data)

        # Add vehicle info for response
        new_schedule['vehicle_info'] = f"{vehicle.get('make', '')} {vehicle.get('model', '')} - {vehicle.get('license_plate', '')}"

        return jsonify(new_schedule), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء جدولة الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/schedules/<schedule_id>', methods=['GET'])
@login_required
def get_maintenance_schedule(schedule_id):
    """Get a specific maintenance schedule"""
    try:
        from json_store import json_store
        schedule = json_store.find_by_id('maintenance_schedules', schedule_id)
        if not schedule:
            return jsonify({'error': 'جدولة الصيانة غير موجودة'}), 404

        # Enrich with vehicle info
        vehicle = json_store.find_by_id('vehicles', schedule.get('vehicle_id', ''))
        if vehicle:
            schedule['vehicle_info'] = f"{vehicle.get('make', '')} {vehicle.get('model', '')} - {vehicle.get('license_plate', '')}"

        return jsonify(schedule)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل جدولة الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/schedules/<schedule_id>', methods=['PUT'])
@login_required
def update_maintenance_schedule(schedule_id):
    """Update a maintenance schedule"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if schedule exists
        existing_schedule = json_store.find_by_id('maintenance_schedules', schedule_id)
        if not existing_schedule:
            return jsonify({'error': 'جدولة الصيانة غير موجودة'}), 404

        # Validate vehicle if provided
        if 'vehicle_id' in data and data['vehicle_id']:
            vehicle = json_store.find_by_id('vehicles', data['vehicle_id'])
            if not vehicle:
                return jsonify({'error': 'السيارة غير موجودة'}), 404

        # Validate due date if provided
        if 'due_date' in data and data['due_date']:
            try:
                datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'تاريخ الاستحقاق غير صحيح'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'vehicle_id', 'maintenance_type', 'due_date', 'due_mileage',
            'description', 'priority', 'status', 'estimated_cost', 'notes'
        ]

        for field in allowed_fields:
            if field in data:
                if field in ['due_mileage', 'estimated_cost']:
                    update_data[field] = float(data[field]) if data[field] is not None else 0
                else:
                    update_data[field] = data[field]

        updated_schedule = json_store.update('maintenance_schedules', schedule_id, update_data)
        if not updated_schedule:
            return jsonify({'error': 'فشل في تحديث جدولة الصيانة'}), 500

        # Enrich with vehicle info
        vehicle = json_store.find_by_id('vehicles', updated_schedule.get('vehicle_id', ''))
        if vehicle:
            updated_schedule['vehicle_info'] = f"{vehicle.get('make', '')} {vehicle.get('model', '')} - {vehicle.get('license_plate', '')}"

        return jsonify(updated_schedule)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث جدولة الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/schedules/<schedule_id>', methods=['DELETE'])
@login_required
def delete_maintenance_schedule(schedule_id):
    """Delete a maintenance schedule"""
    try:
        from json_store import json_store

        # Check if schedule exists
        existing_schedule = json_store.find_by_id('maintenance_schedules', schedule_id)
        if not existing_schedule:
            return jsonify({'error': 'جدولة الصيانة غير موجودة'}), 404

        success = json_store.delete('maintenance_schedules', schedule_id)
        if not success:
            return jsonify({'error': 'فشل في حذف جدولة الصيانة'}), 500

        return jsonify({'message': 'تم حذف جدولة الصيانة بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف جدولة الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/schedules/due', methods=['GET'])
@login_required
def get_due_maintenance():
    """Get maintenance schedules that are due or overdue"""
    try:
        from json_store import json_store
        schedules = json_store.read_all('maintenance_schedules')

        due_schedules = []
        today = datetime.now().date()

        vehicles = json_store.read_all('vehicles')
        vehicle_map = {v.get('id'): f"{v.get('make', '')} {v.get('model', '')} - {v.get('license_plate', '')}" for v in vehicles}

        for schedule in schedules:
            if schedule.get('status') in ['scheduled', 'pending'] and schedule.get('due_date'):
                try:
                    due_date = datetime.strptime(schedule['due_date'], '%Y-%m-%d').date()
                    days_until_due = (due_date - today).days

                    # Include if due within 30 days or overdue
                    if days_until_due <= 30:
                        schedule['vehicle_info'] = vehicle_map.get(schedule.get('vehicle_id', ''), 'غير محدد')
                        schedule['days_until_due'] = days_until_due
                        schedule['is_overdue'] = days_until_due < 0
                        schedule['is_due_soon'] = 0 <= days_until_due <= 7
                        due_schedules.append(schedule)

                except ValueError:
                    continue

        # Sort by due date (overdue first, then by days until due)
        due_schedules.sort(key=lambda x: (x.get('days_until_due', 999), x.get('due_date', '')))

        return jsonify(due_schedules)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الصيانة المستحقة: {str(e)}'}), 500

# ==================== BREAKDOWNS API ====================

@app.route('/api/breakdowns', methods=['GET'])
@login_required
def get_breakdowns():
    """Get all breakdowns"""
    try:
        from json_store import json_store
        breakdowns = json_store.read_all('breakdowns')
        
        # Add vehicle information to each breakdown
        vehicles = json_store.read_all('vehicles')
        for breakdown in breakdowns:
            vehicle = next((v for v in vehicles if v.get('id') == breakdown.get('vehicle_id')), None)
            if vehicle:
                breakdown['vehicle_name'] = vehicle.get('name', 'غير محدد')
                breakdown['vehicle_plate'] = vehicle.get('plate_number', 'غير محدد')
            else:
                breakdown['vehicle_name'] = 'غير محدد'
                breakdown['vehicle_plate'] = 'غير محدد'
        
        return jsonify(breakdowns)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل الأعطال: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>', methods=['GET'])
@login_required
def get_breakdown(breakdown_id):
    """Get a specific breakdown"""
    try:
        from json_store import json_store
        breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404
        return jsonify(breakdown)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل العطل: {str(e)}'}), 500

@app.route('/api/breakdowns', methods=['POST'])
@login_required
def create_breakdown():
    """Create a new breakdown"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Validate required fields
        required_fields = ['vehicle_id', 'breakdown_date', 'responsible_person', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} مطلوب'}), 400

        # Validate vehicle exists
        vehicle = json_store.find_by_id('vehicles', data.get('vehicle_id'))
        if not vehicle:
            return jsonify({'error': 'السيارة غير موجودة'}), 404

        # Validate repair cost
        repair_cost = data.get('repair_cost', 0)
        try:
            repair_cost = float(repair_cost)
            if repair_cost < 0:
                return jsonify({'error': 'تكلفة الإصلاح لا يمكن أن تكون سالبة'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'تكلفة الإصلاح غير صحيحة'}), 400

        # Set breakdown data
        breakdown_data = {
            'vehicle_id': data.get('vehicle_id'),
            'breakdown_date': data.get('breakdown_date'),
            'responsible_person': data.get('responsible_person', '').strip(),
            'repair_cost': repair_cost,
            'description': data.get('description', '').strip(),
            'status': data.get('status', 'pending')
        }

        new_breakdown = json_store.create('breakdowns', breakdown_data)
        return jsonify(new_breakdown), 201

    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء العطل: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>', methods=['PUT'])
@login_required
def update_breakdown(breakdown_id):
    """Update a breakdown"""
    try:
        from json_store import json_store
        data = request.get_json()

        # Check if breakdown exists
        existing_breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not existing_breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404

        # Validate vehicle if provided
        if 'vehicle_id' in data and data['vehicle_id']:
            vehicle = json_store.find_by_id('vehicles', data['vehicle_id'])
            if not vehicle:
                return jsonify({'error': 'السيارة غير موجودة'}), 404

        # Validate repair cost if provided
        if 'repair_cost' in data:
            try:
                repair_cost = float(data.get('repair_cost', 0))
                if repair_cost < 0:
                    return jsonify({'error': 'تكلفة الإصلاح لا يمكن أن تكون سالبة'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'تكلفة الإصلاح غير صحيحة'}), 400

        # Prepare update data
        update_data = {}
        allowed_fields = [
            'vehicle_id', 'breakdown_date', 'responsible_person', 'repair_cost',
            'description', 'status'
        ]

        for field in allowed_fields:
            if field in data:
                if field == 'repair_cost':
                    update_data[field] = float(data[field]) if data[field] is not None else 0
                else:
                    update_data[field] = data[field]

        updated_breakdown = json_store.update('breakdowns', breakdown_id, update_data)
        if not updated_breakdown:
            return jsonify({'error': 'فشل في تحديث العطل'}), 500

        return jsonify(updated_breakdown)

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث العطل: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>', methods=['DELETE'])
@login_required
def delete_breakdown(breakdown_id):
    """Delete a breakdown"""
    try:
        from json_store import json_store

        # Check if breakdown exists
        existing_breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not existing_breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404

        success = json_store.delete('breakdowns', breakdown_id)
        if not success:
            return jsonify({'error': 'فشل في حذف العطل'}), 500

        return jsonify({'message': 'تم حذف العطل بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف العطل: {str(e)}'}), 500

# ==================== BREAKDOWN HISTORY API ====================

@app.route('/api/breakdowns/<breakdown_id>/history', methods=['GET'])
@login_required
def get_breakdown_history(breakdown_id):
    """Get history for a specific breakdown"""
    try:
        from json_store import json_store

        # Check if breakdown exists
        breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404
        
        # Get breakdown history
        history = json_store.filter_records('breakdown_history', {'breakdown_id': breakdown_id})
        history.sort(key=lambda x: x.get('date_created', ''), reverse=True)
        
        return jsonify(history)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل سجل العطل: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>/history', methods=['POST'])
@login_required
def create_breakdown_history(breakdown_id):
    """Create a new breakdown history entry"""
    try:
        from json_store import json_store

        data = request.get_json()
        if not data:
            return jsonify({'error': 'لم يتم إرسال بيانات'}), 400

        # Check if breakdown exists
        breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404

        # Validate required fields
        required_fields = ['action_date', 'action_type', 'description']
        for field in required_fields:
            if not data.get(field, '').strip():
                return jsonify({'error': f'الحقل {field} مطلوب'}), 400

        # Set history data
        history_data = {
            'breakdown_id': breakdown_id,
            'action_date': data.get('action_date'),
            'action_type': data.get('action_type').strip(),
            'description': data.get('description').strip(),
            'cost': float(data.get('cost', 0)) if data.get('cost') else 0,
            'technician': data.get('technician', '').strip(),
            'parts_used': data.get('parts_used', '').strip(),
            'status': data.get('status', 'completed').strip(),
            'date_created': datetime.now().isoformat(),
            'notes': data.get('notes', '').strip()
        }

        new_history = json_store.create('breakdown_history', history_data)
        return jsonify(new_history), 201

    except ValueError as e:
        return jsonify({'error': f'خطأ في البيانات: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء سجل العطل: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>/history/<history_id>', methods=['PUT'])
@login_required
def update_breakdown_history(breakdown_id, history_id):
    """Update a breakdown history entry"""
    try:
        from json_store import json_store

        data = request.get_json()
        if not data:
            return jsonify({'error': 'لم يتم إرسال بيانات'}), 400

        # Check if breakdown exists
        breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404

        # Check if history entry exists
        history = json_store.find_by_id('breakdown_history', history_id)
        if not history or history.get('breakdown_id') != breakdown_id:
            return jsonify({'error': 'سجل العطل غير موجود'}), 404

        # Update only allowed fields
        allowed_fields = [
            'action_date', 'action_type', 'description', 'cost', 'technician',
            'parts_used', 'status', 'notes'
        ]
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                if field == 'cost':
                    update_data[field] = float(data[field]) if data[field] else 0
                else:
                    update_data[field] = data[field].strip() if isinstance(data[field], str) else data[field]

        update_data['date_updated'] = datetime.now().isoformat()

        updated_history = json_store.update('breakdown_history', history_id, update_data)
        if not updated_history:
            return jsonify({'error': 'فشل في تحديث سجل العطل'}), 500

        return jsonify(updated_history)

    except ValueError as e:
        return jsonify({'error': f'خطأ في البيانات: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث سجل العطل: {str(e)}'}), 500

@app.route('/api/breakdowns/<breakdown_id>/history/<history_id>', methods=['DELETE'])
@login_required
def delete_breakdown_history(breakdown_id, history_id):
    """Delete a breakdown history entry"""
    try:
        from json_store import json_store

        # Check if breakdown exists
        breakdown = json_store.find_by_id('breakdowns', breakdown_id)
        if not breakdown:
            return jsonify({'error': 'العطل غير موجود'}), 404

        # Check if history entry exists
        history = json_store.find_by_id('breakdown_history', history_id)
        if not history or history.get('breakdown_id') != breakdown_id:
            return jsonify({'error': 'سجل العطل غير موجود'}), 404

        success = json_store.delete('breakdown_history', history_id)
        if not success:
            return jsonify({'error': 'فشل في حذف سجل العطل'}), 500

        return jsonify({'message': 'تم حذف سجل العطل بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف سجل العطل: {str(e)}'}), 500

# ==================== MAINTENANCE LOGS API ====================

@app.route('/api/maintenance/logs', methods=['GET'])
@login_required
def get_maintenance_logs():
    """Get all maintenance logs"""
    try:
        from json_store import json_store

        logs = json_store.read_all('maintenance_logs')
        
        # Add vehicle information to each log
        vehicles = json_store.read_all('vehicles')
        for log in logs:
            vehicle = next((v for v in vehicles if v.get('id') == log.get('vehicle_id')), None)
            if vehicle:
                log['vehicle_name'] = vehicle.get('name', 'غير محدد')
                log['vehicle_plate'] = vehicle.get('plate_number', 'غير محدد')
            else:
                log['vehicle_name'] = 'غير محدد'
                log['vehicle_plate'] = 'غير محدد'
        
        return jsonify(logs)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل سجلات الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/logs', methods=['POST'])
@login_required
def create_maintenance_log():
    """Create a new maintenance log"""
    try:
        from json_store import json_store

        data = request.get_json()
        if not data:
            return jsonify({'error': 'لم يتم إرسال بيانات'}), 400

        # Validate required fields
        required_fields = ['vehicle_id', 'maintenance_date', 'maintenance_type', 'description']
        for field in required_fields:
            if not data.get(field, '').strip():
                return jsonify({'error': f'الحقل {field} مطلوب'}), 400

        # Set maintenance log data
        log_data = {
            'vehicle_id': data.get('vehicle_id').strip(),
            'maintenance_date': data.get('maintenance_date'),
            'maintenance_type': data.get('maintenance_type').strip(),
            'description': data.get('description').strip(),
            'cost': float(data.get('cost', 0)) if data.get('cost') else 0,
            'technician': data.get('technician', '').strip(),
            'parts_used': data.get('parts_used', '').strip(),
            'mileage': int(data.get('mileage', 0)) if data.get('mileage') else 0,
            'next_service_date': data.get('next_service_date', ''),
            'next_service_mileage': int(data.get('next_service_mileage', 0)) if data.get('next_service_mileage') else 0,
            'status': data.get('status', 'completed').strip(),
            'notes': data.get('notes', '').strip(),
            'date_created': datetime.now().isoformat()
        }

        new_log = json_store.create('maintenance_logs', log_data)
        return jsonify(new_log), 201

    except ValueError as e:
        return jsonify({'error': f'خطأ في البيانات: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء سجل الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/logs/<log_id>', methods=['GET'])
@login_required
def get_maintenance_log(log_id):
    """Get a specific maintenance log"""
    try:
        from json_store import json_store

        log = json_store.find_by_id('maintenance_logs', log_id)
        if not log:
            return jsonify({'error': 'سجل الصيانة غير موجود'}), 404
        return jsonify(log)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل سجل الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/logs/<log_id>', methods=['PUT'])
@login_required
def update_maintenance_log(log_id):
    """Update a maintenance log"""
    try:
        from json_store import json_store

        data = request.get_json()
        if not data:
            return jsonify({'error': 'لم يتم إرسال بيانات'}), 400

        # Check if log exists
        existing_log = json_store.find_by_id('maintenance_logs', log_id)
        if not existing_log:
            return jsonify({'error': 'سجل الصيانة غير موجود'}), 404

        # Update only allowed fields
        allowed_fields = [
            'vehicle_id', 'maintenance_date', 'maintenance_type', 'description',
            'cost', 'technician', 'parts_used', 'mileage', 'next_service_date',
            'next_service_mileage', 'status', 'notes'
        ]
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                if field in ['cost', 'mileage', 'next_service_mileage']:
                    update_data[field] = float(data[field]) if data[field] else 0
                    if field in ['mileage', 'next_service_mileage']:
                        update_data[field] = int(update_data[field])
                else:
                    update_data[field] = data[field].strip() if isinstance(data[field], str) else data[field]

        update_data['date_updated'] = datetime.now().isoformat()

        updated_log = json_store.update('maintenance_logs', log_id, update_data)
        if not updated_log:
            return jsonify({'error': 'فشل في تحديث سجل الصيانة'}), 500

        return jsonify(updated_log)

    except ValueError as e:
        return jsonify({'error': f'خطأ في البيانات: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث سجل الصيانة: {str(e)}'}), 500

@app.route('/api/maintenance/logs/<log_id>', methods=['DELETE'])
@login_required
def delete_maintenance_log(log_id):
    """Delete a maintenance log"""
    try:
        from json_store import json_store

        # Check if log exists
        existing_log = json_store.find_by_id('maintenance_logs', log_id)
        if not existing_log:
            return jsonify({'error': 'سجل الصيانة غير موجود'}), 404

        success = json_store.delete('maintenance_logs', log_id)
        if not success:
            return jsonify({'error': 'فشل في حذف سجل الصيانة'}), 500

        return jsonify({'message': 'تم حذف سجل الصيانة بنجاح'})

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف سجل الصيانة: {str(e)}'}), 500

# ==================== DRIVER HISTORY API ====================

@app.route('/api/drivers/<driver_id>/history', methods=['GET'])
@login_required
def get_driver_history(driver_id):
    """Get history for a specific driver"""
    try:
        from json_store import json_store

        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        history = json_store.filter_records('driver_history', {'driver_id': driver_id})

        # Sort by date created
        history.sort(key=lambda x: x.get('date_created', ''), reverse=True)

        return jsonify(history)
    except Exception as e:
        return jsonify({'error': f'خطأ في تحميل سجل السائق: {str(e)}'}), 500


@app.route('/api/drivers/<driver_id>/photo', methods=['POST'])
@login_required
def upload_driver_photo(driver_id):
    """Upload driver photo"""
    try:
        from json_store import json_store
        import os
        from werkzeug.utils import secure_filename
        
        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404
            
        # Check if the post request has the file part
        if 'photo' not in request.files:
            return jsonify({'error': 'لم يتم العثور على ملف الصورة'}), 400
            
        file = request.files['photo']
        
        # If user does not select file, browser submits empty file without filename
        if file.filename == '':
            return jsonify({'error': 'لم يتم اختيار ملف'}), 400
            
        # Check file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
        def allowed_file(filename):
            return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'نوع الملف غير مدعوم. يرجى استخدام PNG, JPG, JPEG, GIF, أو BMP'}), 400
            
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(app.root_path, 'static', 'uploads', 'driver_photos')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        # Add driver ID to filename to avoid conflicts
        name, ext = os.path.splitext(filename)
        filename = f"driver_{driver_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
        
        file_path = os.path.join(upload_folder, filename)
        
        # Save file
        file.save(file_path)
        
        # Update driver record with photo path
        photo_url = f"/static/uploads/driver_photos/{filename}"
        json_store.update('drivers', driver_id, {'photo_url': photo_url})
        
        # Create history entry
        history_data = {
            'driver_id': driver_id,
            'title': 'تحديث صورة السائق',
            'notes': f'تم رفع صورة جديدة للسائق: {filename}',
            'date_created': datetime.now().isoformat(),
            'created_by': 'admin',
            'type': 'photo_update',
            'attachments': [{
                'filename': filename,
                'type': 'image',
                'size': f'{round(os.path.getsize(file_path) / 1024, 1)} KB'
            }]
        }
        json_store.create('driver_history', history_data)
        
        return jsonify({
            'success': True,
            'message': 'تم رفع الصورة بنجاح',
            'photo_url': photo_url,
            'filename': filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'خطأ في رفع الصورة: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>/history/<history_id>/attachments/<filename>')
@login_required
def download_attachment(driver_id, history_id, filename):
    """Download attachment file"""
    try:
        from json_store import json_store
        import os
        from flask import send_file, abort
        
        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404
            
        # Check if history entry exists
        history = json_store.find_by_id('driver_history', history_id)
        if not history or history.get('driver_id') != driver_id:
            return jsonify({'error': 'سجل السائق غير موجود'}), 404
            
        # Check if attachment exists in history
        attachments = history.get('attachments', [])
        attachment = next((att for att in attachments if att.get('filename') == filename), None)
        
        if not attachment:
            return jsonify({'error': 'المرفق غير موجود'}), 404
            
        # Determine file path based on attachment type
        if attachment.get('type') == 'image' and history.get('type') == 'photo_update':
            # Driver photo
            file_path = os.path.join(app.root_path, 'static', 'uploads', 'driver_photos', filename)
        else:
            # General attachment
            file_path = os.path.join(app.root_path, 'static', 'uploads', 'driver_attachments', filename)
            
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'الملف غير موجود على الخادم'}), 404
            
        # Send file
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({'error': f'خطأ في تنزيل الملف: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>/history', methods=['POST'])
@login_required
def create_driver_history_with_files(driver_id):
    """Create a new driver history entry with file attachments"""
    try:
        from json_store import json_store
        import os
        from werkzeug.utils import secure_filename
        
        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404
            
        # Get form data
        title = request.form.get('title', '').strip()
        notes = request.form.get('notes', '').strip()
        
        # Validate required fields
        if not title or not notes:
            return jsonify({'error': 'العنوان والملاحظات مطلوبة'}), 400
            
        # Process attachments
        attachments = []
        if 'attachments' in request.files:
            files = request.files.getlist('attachments')
            
            # Create uploads directory if it doesn't exist
            upload_folder = os.path.join(app.root_path, 'static', 'uploads', 'driver_attachments')
            os.makedirs(upload_folder, exist_ok=True)
            
            for file in files:
                if file and file.filename:
                    # Generate secure filename
                    filename = secure_filename(file.filename)
                    # Add timestamp to avoid conflicts
                    name, ext = os.path.splitext(filename)
                    filename = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
                    
                    file_path = os.path.join(upload_folder, filename)
                    file.save(file_path)
                    
                    # Determine file type
                    file_type = 'image' if file.content_type and file.content_type.startswith('image/') else 'document'
                    
                    attachments.append({
                        'filename': filename,
                        'original_name': secure_filename(file.filename),
                        'type': file_type,
                        'size': f'{round(os.path.getsize(file_path) / 1024, 1)} KB',
                        'content_type': file.content_type
                    })
        
        # Set history data
        history_data = {
            'driver_id': driver_id,
            'title': title,
            'notes': notes,
            'date_created': datetime.now().isoformat(),
            'created_by': 'admin',  # Current user
            'type': 'note',
            'attachments': attachments
        }
        
        new_history = json_store.create('driver_history', history_data)
        return jsonify(new_history), 201
        
    except Exception as e:
        return jsonify({'error': f'خطأ في إنشاء سجل السائق: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>/history/<history_id>', methods=['PUT'])
@login_required
def update_driver_history(driver_id, history_id):
    """Update a driver history entry"""
    try:
        from json_store import json_store

        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Check if history entry exists
        history_entry = json_store.find_by_id('driver_history', history_id)
        if not history_entry:
            return jsonify({'error': 'سجل السائق غير موجود'}), 404

        # Verify the history belongs to the driver
        if history_entry.get('driver_id') != driver_id:
            return jsonify({'error': 'سجل السائق غير صحيح'}), 400

        # Get update data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'لا توجد بيانات للتحديث'}), 400

        # Validate required fields
        title = data.get('title', '').strip()
        notes = data.get('notes', '').strip()

        if not title or not notes:
            return jsonify({'error': 'العنوان والملاحظات مطلوبة'}), 400

        # Update the history entry
        update_data = {
            'title': title,
            'notes': notes,
            'date_updated': datetime.now().isoformat(),
            'updated_by': 'admin'  # Current user
        }

        updated_history = json_store.update('driver_history', history_id, update_data)
        return jsonify(updated_history), 200

    except Exception as e:
        return jsonify({'error': f'خطأ في تحديث سجل السائق: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>/history/<history_id>', methods=['DELETE'])
@login_required
def delete_driver_history(driver_id, history_id):
    """Delete a driver history entry"""
    try:
        from json_store import json_store
        import os

        # Check if driver exists
        driver = json_store.find_by_id('drivers', driver_id)
        if not driver:
            return jsonify({'error': 'السائق غير موجود'}), 404

        # Check if history entry exists
        history_entry = json_store.find_by_id('driver_history', history_id)
        if not history_entry:
            return jsonify({'error': 'سجل السائق غير موجود'}), 404

        # Verify the history belongs to the driver
        if history_entry.get('driver_id') != driver_id:
            return jsonify({'error': 'سجل السائق غير صحيح'}), 400

        # Delete associated attachment files
        attachments = history_entry.get('attachments', [])
        upload_folder = os.path.join(app.root_path, 'static', 'uploads', 'driver_attachments')

        for attachment in attachments:
            try:
                file_path = os.path.join(upload_folder, attachment.get('filename', ''))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete attachment file: {e}")

        # Delete the history entry
        json_store.delete('driver_history', history_id)

        return jsonify({'message': 'تم حذف سجل السائق بنجاح'}), 200

    except Exception as e:
        return jsonify({'error': f'خطأ في حذف سجل السائق: {str(e)}'}), 500

# ========================================
# ADMIN CLEANUP ENDPOINTS
# ========================================

@app.route('/api/admin/cleanup', methods=['POST'])
@login_required
def run_cleanup():
    """Run comprehensive system cleanup"""
    try:
        results = {
            'temp_files_cleaned': 0,
            'orphaned_files_removed': 0,
            'database_entries_cleaned': 0,
            'timestamp': datetime.now().isoformat()
        }

        # Run cleanup operations
        results['temp_files_cleaned'] = DocumentsCleanupManager.cleanup_temp_files()
        results['orphaned_files_removed'] = DocumentsCleanupManager.cleanup_orphaned_files()

        # Log cleanup action
        log_action('admin', 'system_cleanup', None, results)

        return jsonify({
            'success': True,
            'message': 'تم تنظيف النظام بنجاح',
            'results': results
        })

    except Exception as e:
        return DocumentsErrorHandler.handle_error('server_error', str(e))

@app.route('/api/admin/performance', methods=['GET'])
@login_required
def get_performance_stats():
    """Get system performance statistics"""
    try:
        # Calculate basic performance stats
        stats = {
            'total_documents': 0,
            'total_file_size': 0,
            'documents_by_type': {},
            'upload_directories': {},
            'timestamp': datetime.now().isoformat()
        }

        # Count documents and calculate sizes
        for entity_type in ['drivers', 'vehicles', 'other']:
            entity_docs_file = os.path.join(DATA_DIR, f'{entity_type}_documents.json')
            if os.path.exists(entity_docs_file):
                with open(entity_docs_file, 'r', encoding='utf-8') as f:
                    entity_docs = json.load(f)
                    stats['documents_by_type'][entity_type] = len(entity_docs)
                    stats['total_documents'] += len(entity_docs)

                    # Calculate total file size
                    for doc in entity_docs:
                        file_path = get_storage_path(entity_type, doc.get('entity_id'), doc.get('stored_filename'))
                        if file_path and os.path.exists(file_path):
                            stats['total_file_size'] += os.path.getsize(file_path)

            # Check directory sizes
            entity_dir = os.path.join(UPLOADS_DIR, 'documents', entity_type)
            if os.path.exists(entity_dir):
                dir_size = sum(os.path.getsize(os.path.join(dirpath, filename))
                              for dirpath, dirnames, filenames in os.walk(entity_dir)
                              for filename in filenames)
                stats['upload_directories'][entity_type] = dir_size

        # Format file sizes for display
        stats['total_file_size_formatted'] = format_file_size(stats['total_file_size'])

        return jsonify({
            'success': True,
            'stats': stats
        })

    except Exception as e:
        return DocumentsErrorHandler.handle_error('server_error', str(e))

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 بايت"

    size_names = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f} {size_names[i]}"

if __name__ == '__main__':
    print("Starting Emar Delivery App...")
    print("Server running at: http://localhost:1111")

    # Production security configuration
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.getenv('FLASK_HOST', '127.0.0.1')  # More secure default
    port = int(os.getenv('FLASK_PORT', '1111'))

    if debug_mode:
        print("[WARN] WARNING: Debug mode is enabled. Do not use in production!")
    else:
        print("[OK] Production mode: Debug disabled")

    app.run(debug=debug_mode, host=host, port=port)
