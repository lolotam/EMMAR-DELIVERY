/**
 * ErrorManager - Centralized Error Handling Utility
 * Eliminates error handling code duplication across the application
 * 
 * Usage:
 * ErrorManager.handleError(error, 'Load Drivers');
 * ErrorManager.showUserError('حدث خطأ في تحميل البيانات');
 */

class ErrorManager {
    constructor() {
        this.ERROR_MESSAGES = {
            // Network and HTTP errors
            'Network error': 'خطأ في الاتصال بالشبكة',
            'Failed to fetch': 'فشل في الاتصال بالخادم',
            'Connection refused': 'تم رفض الاتصال',
            'Timeout': 'انتهت مهلة الاتصال',
            
            // Authentication errors
            'Authentication failed': 'فشل في المصادقة',
            'Session expired': 'انتهت صلاحية الجلسة',
            'Invalid credentials': 'بيانات الدخول غير صحيحة',
            'Access denied': 'غير مصرح لك بالوصول',
            
            // File upload errors
            'File too large': 'حجم الملف كبير جداً',
            'Invalid file type': 'نوع الملف غير مدعوم',
            'Upload failed': 'فشل في رفع الملف',
            'No file selected': 'لم يتم اختيار ملف',
            
            // Form validation errors
            'Required field': 'هذا الحقل مطلوب',
            'Invalid email': 'البريد الإلكتروني غير صحيح',
            'Invalid phone': 'رقم الهاتف غير صحيح',
            'Invalid date': 'التاريخ غير صحيح',
            'Invalid number': 'الرقم غير صحيح',
            
            // Database errors
            'Database error': 'خطأ في قاعدة البيانات',
            'Record not found': 'السجل غير موجود',
            'Duplicate entry': 'البيانات موجودة مسبقاً',
            'Foreign key constraint': 'لا يمكن حذف هذا السجل لوجود بيانات مرتبطة به',
            
            // General errors
            'Unknown error': 'حدث خطأ غير متوقع',
            'Server error': 'خطأ في الخادم',
            'Bad request': 'طلب غير صحيح',
            'Not found': 'الصفحة غير موجودة',
            'Method not allowed': 'العملية غير مسموحة',
            'Too many requests': 'تم تجاوز الحد المسموح من الطلبات'
        };
        
        this.HTTP_STATUS_MESSAGES = {
            400: 'طلب غير صحيح',
            401: 'انتهت صلاحية الجلسة',
            403: 'غير مصرح لك بالوصول',
            404: 'الصفحة غير موجودة',
            405: 'العملية غير مسموحة',
            408: 'انتهت مهلة الطلب',
            409: 'تعارض في البيانات',
            413: 'حجم الطلب كبير جداً',
            415: 'نوع المحتوى غير مدعوم',
            422: 'بيانات غير صحيحة',
            429: 'تم تجاوز الحد المسموح من الطلبات',
            500: 'خطأ في الخادم',
            502: 'خطأ في البوابة',
            503: 'الخدمة غير متاحة',
            504: 'انتهت مهلة البوابة'
        };
        
        this.errorLog = [];
        this.maxLogSize = 100;
    }
    
    /**
     * Get Arabic error message for any error
     * @param {Error|string|Object} error - Error object, message, or response
     * @returns {string} - Arabic error message
     */
    getArabicMessage(error) {
        let message = '';
        
        // Extract message from different error types
        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
        } else if (error && error.message) {
            message = error.message;
        } else if (error && error.error) {
            message = error.error;
        } else {
            message = 'Unknown error';
        }
        
        // Check for exact matches first
        for (const [pattern, arabicMessage] of Object.entries(this.ERROR_MESSAGES)) {
            if (message.toLowerCase().includes(pattern.toLowerCase())) {
                return arabicMessage;
            }
        }
        
        // Check for HTTP status codes
        const statusMatch = message.match(/(\d{3})/);
        if (statusMatch) {
            const status = parseInt(statusMatch[1]);
            if (this.HTTP_STATUS_MESSAGES[status]) {
                return this.HTTP_STATUS_MESSAGES[status];
            }
        }
        
        // Check for specific error patterns
        if (message.includes('CSRF')) {
            return 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة';
        }
        
        if (message.includes('null') || message.includes('undefined')) {
            return 'خطأ في تحميل البيانات. يرجى إعادة المحاولة';
        }
        
        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'غير مصرح لك بهذه العملية';
        }
        
        if (message.includes('validation')) {
            return 'بيانات غير صحيحة. يرجى التحقق من المدخلات';
        }
        
        // Default message
        return this.ERROR_MESSAGES['Unknown error'];
    }
    
    /**
     * Handle any error with logging and user notification
     * @param {Error|string|Object} error - Error to handle
     * @param {string} context - Context where error occurred
     * @param {Object} options - Additional options
     */
    handleError(error, context = '', options = {}) {
        const {
            showToUser = true,
            logToServer = true,
            logToConsole = true,
            customMessage = null
        } = options;
        
        // Log to console
        if (logToConsole) {
            console.error(`Error in ${context}:`, error);
        }
        
        // Add to local error log
        this.logError(error, context);
        
        // Get user-friendly message
        const userMessage = customMessage || this.getArabicMessage(error);
        
        // Show to user
        if (showToUser) {
            this.showUserError(userMessage);
        }
        
        // Log to server
        if (logToServer) {
            this.logToServer(error, context).catch(serverError => {
                console.warn('Failed to log error to server:', serverError);
            });
        }
        
        return userMessage;
    }
    
    /**
     * Show error message to user
     * @param {string} message - Arabic error message
     * @param {Object} options - Display options
     */
    showUserError(message, options = {}) {
        const {
            type = 'error',
            duration = 5000,
            position = 'top-right'
        } = options;
        
        // Try to use existing notification system
        if (window.showError && typeof window.showError === 'function') {
            window.showError(message);
            return;
        }
        
        // Try to use toast notification if available
        if (window.showToast && typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        
        // Fallback to custom notification
        this.createNotification(message, type, duration, position);
    }
    
    /**
     * Create custom notification element
     * @param {string} message - Message to display
     * @param {string} type - Notification type
     * @param {number} duration - Display duration
     * @param {string} position - Position on screen
     */
    createNotification(message, type, duration, position) {
        // Create notification container if it doesn't exist
        let container = document.getElementById('error-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-notifications';
            container.style.cssText = `
                position: fixed;
                ${position.includes('top') ? 'top: 20px;' : 'bottom: 20px;'}
                ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            direction: rtl;
            text-align: right;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    }
    
    /**
     * Log error to local storage
     * @param {Error|string|Object} error - Error to log
     * @param {string} context - Context where error occurred
     */
    logError(error, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message || error.toString(),
            stack: error.stack || null,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.errorLog.push(logEntry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
        
        // Store in localStorage for debugging
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Failed to store error log in localStorage:', e);
        }
    }
    
    /**
     * Log error to server
     * @param {Error|string|Object} error - Error to log
     * @param {string} context - Context where error occurred
     * @returns {Promise} - Server logging promise
     */
    async logToServer(error, context) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                context,
                message: error.message || error.toString(),
                stack: error.stack || null,
                url: window.location.href,
                userAgent: navigator.userAgent,
                userId: this.getCurrentUserId()
            };
            
            const response = await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(logData)
            });
            
            if (!response.ok) {
                throw new Error(`Server logging failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (serverError) {
            // Don't show server logging errors to user
            console.warn('Failed to log error to server:', serverError);
            throw serverError;
        }
    }
    
    /**
     * Handle API response errors
     * @param {Response} response - Fetch response object
     * @param {string} context - Context for error handling
     * @returns {Promise} - Throws error if response is not ok
     */
    async handleAPIResponse(response, context = 'API Call') {
        if (!response.ok) {
            let errorMessage = this.HTTP_STATUS_MESSAGES[response.status] || 'خطأ في الخادم';
            
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Use status-based message if JSON parsing fails
            }
            
            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = response;
            
            this.handleError(error, context);
            throw error;
        }
        
        return response;
    }
    
    /**
     * Get current user ID for logging
     * @returns {string|null} - Current user ID or null
     */
    getCurrentUserId() {
        // Try to get from global app object
        if (window.App && window.App.currentUser && window.App.currentUser.id) {
            return window.App.currentUser.id;
        }
        
        // Try to get from session storage
        try {
            const userData = sessionStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                return user.id;
            }
        } catch (e) {
            // Ignore parsing errors
        }
        
        return null;
    }
    
    /**
     * Get CSRF token for API requests
     * @returns {string|null} - CSRF token or null
     */
    getCSRFToken() {
        // Try to get from meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // Try to get from global API object
        if (window.api && typeof window.api.getCSRFToken === 'function') {
            return window.api.getCSRFToken();
        }
        
        return null;
    }
    
    /**
     * Get error log for debugging
     * @returns {Array} - Array of logged errors
     */
    getErrorLog() {
        return [...this.errorLog];
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            console.warn('Failed to clear error log from localStorage:', e);
        }
    }
}

// Create global instance
const errorManager = new ErrorManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorManager;
} else {
    window.ErrorManager = ErrorManager;
    window.errorManager = errorManager;
}
