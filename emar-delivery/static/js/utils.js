/**
 * Utility Functions
 * الوظائف المساعدة
 */

/**
 * Show/hide loading spinner
 */
function showLoadingSpinner(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }
}

/**
 * Show success message
 */
function showSuccess(message, title = 'نجح') {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'موافق',
        confirmButtonColor: '#27ae60'
    });
}

/**
 * Show loading message
 */
function showLoading(message = 'جاري التحميل...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Hide loading message
 */
function hideLoading() {
    Swal.close();
}

/**
 * Show error message
 */
function showError(message, title = 'خطأ') {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'موافق',
        confirmButtonColor: '#e74c3c'
    });
}

/**
 * Show confirmation dialog
 */
function showConfirm(message, title = 'تأكيد') {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#95a5a6'
    });
}

/**
 * Format currency (KWD)
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.000 د.ك';
    return `${parseFloat(amount).toFixed(3)} د.ك`;
}

/**
 * Format date in Arabic with proper validation
 */
function formatDate(dateString) {
    if (!dateString || dateString === '' || dateString === 'Invalid Date') return '';

    try {
        // Handle different date formats
        let date;
        if (typeof dateString === 'string') {
            // Handle ISO date strings
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Kuwait'
        };

        return date.toLocaleDateString('ar-KW', options);
    } catch (error) {
        console.warn('Date formatting error:', error, 'for date:', dateString);
        return '';
    }
}

/**
 * Format datetime in Arabic with proper validation
 */
function formatDateTime(dateString) {
    if (!dateString || dateString === '' || dateString === 'Invalid Date') return '';

    try {
        let date;
        if (typeof dateString === 'string') {
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            return '';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kuwait'
        };

        return date.toLocaleDateString('ar-KW', options);
    } catch (error) {
        console.warn('DateTime formatting error:', error, 'for date:', dateString);
        return '';
    }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
function formatDateForInput(dateString) {
    if (!dateString || dateString === '' || dateString === 'Invalid Date') return '';

    try {
        let date;
        if (typeof dateString === 'string') {
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            return '';
        }

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.warn('Date input formatting error:', error, 'for date:', dateString);
        return '';
    }
}

/**
 * Format date in short DD/MM/YYYY format for table displays
 */
function formatDateShort(dateString) {
    if (!dateString || dateString === '' || dateString === 'Invalid Date') return '';

    try {
        // Handle different date formats using same parsing logic as formatDate
        let date;
        if (typeof dateString === 'string') {
            // Handle ISO date strings
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }

        // Format as DD/MM/YYYY for table displays
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.warn('Date short formatting error:', error, 'for date:', dateString);
        return '';
    }
}

/**
 * Validate date string
 */
function isValidDate(dateString) {
    if (!dateString || dateString === '' || dateString === 'Invalid Date') return false;

    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
}

/**
 * Get current date in Kuwait timezone
 */
function getCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'Asia/Kuwait'
    };

    return now.toLocaleDateString('ar-KW', options);
}

/**
 * Validate form data
 */
function validateForm(formData, rules) {
    const errors = [];

    for (const field in rules) {
        const rule = rules[field];
        const value = formData[field];

        if (rule.required && (!value || value.toString().trim() === '')) {
            errors.push(`${rule.label} مطلوب`);
            continue;
        }

        if (value && rule.minLength && value.toString().length < rule.minLength) {
            errors.push(`${rule.label} يجب أن يكون ${rule.minLength} أحرف على الأقل`);
        }

        if (value && rule.maxLength && value.toString().length > rule.maxLength) {
            errors.push(`${rule.label} يجب أن يكون ${rule.maxLength} أحرف كحد أقصى`);
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.label} غير صحيح`);
        }

        if (value && rule.min && parseFloat(value) < rule.min) {
            errors.push(`${rule.label} يجب أن يكون ${rule.min} كحد أدنى`);
        }

        if (value && rule.max && parseFloat(value) > rule.max) {
            errors.push(`${rule.label} يجب أن يكون ${rule.max} كحد أقصى`);
        }
    }

    return errors;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format phone number
 */
function formatPhone(phone) {
    if (!phone) return '';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as +965 XXXX XXXX
    if (cleaned.startsWith('965')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
