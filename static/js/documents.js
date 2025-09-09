/**
 * Documents Management JavaScript
 * إدارة الوثائق - JavaScript
 */

/**
 * Utility Functions for UX Enhancements
 */
const UXUtils = {
    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show skeleton loading cards
    showSkeletonCards(container, count = 6) {
        const skeletonHTML = Array(count).fill().map(() => `
            <div class="skeleton-card skeleton">
                <div class="skeleton skeleton-header"></div>
                <div class="skeleton skeleton-body">
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line short"></div>
                    <div class="skeleton skeleton-line medium"></div>
                </div>
            </div>
        `).join('');
        container.innerHTML = skeletonHTML;
    },

    // Show success animation
    showSuccessAnimation(element) {
        element.classList.add('success-pulse');
        setTimeout(() => element.classList.remove('success-pulse'), 600);
    },

    // Add fade in animation
    addFadeInAnimation(element) {
        element.classList.add('fade-in-up');
        setTimeout(() => element.classList.remove('fade-in-up'), 500);
    },

    // Show loading overlay
    showLoadingOverlay(container, message = 'جاري التحميل...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner-enhanced">
                <div class="spinner-border spinner-border-lg text-primary" role="status">
                    <span class="visually-hidden">${message}</span>
                </div>
                <div class="text-muted">${message}</div>
            </div>
        `;
        container.style.position = 'relative';
        container.appendChild(overlay);
        return overlay;
    },

    // Hide loading overlay
    hideLoadingOverlay(container) {
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    // Add ripple effect to buttons
    addRippleEffect(button) {
        button.classList.add('btn-ripple');
    },

    // Format numbers in Arabic
    formatArabicNumber(number) {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return number.toString().replace(/\d/g, (digit) => arabicNumerals[digit]);
    },

    // Announce to screen readers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }
};

/**
 * API Cache for Performance Optimization
 */
class APICache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
        this.maxSize = 100; // Maximum cache entries
    }

    get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.maxAge) {
            return item.data;
        }
        this.cache.delete(key);
        return null;
    }

    set(key, data) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        return this.cache.has(key) && this.get(key) !== null;
    }
}

/**
 * Enhanced Error Handler
 */
class ErrorHandler {
    static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;

                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));

                console.warn(`Retry attempt ${i + 1}/${maxRetries} for operation`);
            }
        }
    }

    static getArabicErrorMessage(error) {
        const errorMap = {
            'Network Error': 'خطأ في الشبكة - تحقق من الاتصال',
            'Timeout': 'انتهت مهلة الاتصال - حاول مرة أخرى',
            'Unauthorized': 'غير مخول - قم بتسجيل الدخول مرة أخرى',
            'Forbidden': 'غير مسموح - ليس لديك صلاحية',
            'Not Found': 'الملف غير موجود',
            'File too large': 'حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)',
            'Invalid file type': 'نوع الملف غير مدعوم',
            'Upload failed': 'فشل في رفع الملف',
            'Delete failed': 'فشل في حذف الملف',
            'Server Error': 'خطأ في الخادم - حاول مرة أخرى لاحقاً'
        };

        // Check for specific error patterns
        const message = error.message || error.toString();

        if (message.includes('fetch')) {
            return 'خطأ في الاتصال بالخادم';
        }
        if (message.includes('timeout')) {
            return 'انتهت مهلة الاتصال';
        }
        if (message.includes('413')) {
            return 'حجم الملف كبير جداً';
        }
        if (message.includes('415')) {
            return 'نوع الملف غير مدعوم';
        }

        return errorMap[message] || 'حدث خطأ غير متوقع - حاول مرة أخرى';
    }

    static async handleAPIError(error, context = '') {
        console.error(`API Error in ${context}:`, error);

        const arabicMessage = this.getArabicErrorMessage(error);

        // Log error for monitoring
        this.logError(error, context);

        // Show user-friendly message
        if (typeof showError === 'function') {
            showError(arabicMessage);
        } else {
            alert(arabicMessage);
        }

        // Announce to screen readers
        UXUtils.announceToScreenReader(`خطأ: ${arabicMessage}`);

        return arabicMessage;
    }

    static logError(error, context) {
        // In production, this would send to error monitoring service
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.error('Error Log:', errorLog);

        // Store in localStorage for debugging (limit to last 10 errors)
        try {
            const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            errors.unshift(errorLog);
            errors.splice(10); // Keep only last 10 errors
            localStorage.setItem('errorLogs', JSON.stringify(errors));
        } catch (e) {
            console.warn('Could not store error log:', e);
        }
    }
}

/**
 * Bulk Operations Handler
 */
class BulkOperations {
    static async downloadAsZip(documentIds, onProgress = null) {
        try {
            if (!documentIds || documentIds.length === 0) {
                throw new Error('لا توجد وثائق محددة للتحميل');
            }

            UXUtils.announceToScreenReader(`جاري تحضير ${documentIds.length} وثيقة للتحميل`);

            const response = await fetch('/api/documents/bulk/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_ids: documentIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'فشل في تحميل الملفات');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documents_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            UXUtils.announceToScreenReader('تم تحميل الملفات بنجاح');

            if (typeof showSuccess === 'function') {
                showSuccess(`تم تحميل ${documentIds.length} وثيقة في ملف مضغوط`);
            }

        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Bulk Download');
            throw error;
        }
    }

    static async uploadMultiple(files, metadata, onProgress = null) {
        const results = [];
        const totalFiles = files.length;

        UXUtils.announceToScreenReader(`جاري رفع ${totalFiles} ملف`);

        for (let i = 0; i < files.length; i++) {
            try {
                const fileMetadata = {
                    ...metadata,
                    display_name: metadata.display_name || files[i].name.split('.')[0]
                };

                const result = await this.uploadSingle(files[i], fileMetadata);
                results.push({ success: true, file: files[i].name, result });

                if (onProgress) {
                    onProgress(i + 1, totalFiles, files[i].name);
                }

                UXUtils.announceToScreenReader(`تم رفع ${i + 1} من ${totalFiles} ملف`);

            } catch (error) {
                console.error(`Upload failed for ${files[i].name}:`, error);
                results.push({
                    success: false,
                    file: files[i].name,
                    error: ErrorHandler.getArabicErrorMessage(error)
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        let message = `تم رفع ${successCount} ملف بنجاح`;
        if (failCount > 0) {
            message += ` و فشل رفع ${failCount} ملف`;
        }

        UXUtils.announceToScreenReader(message);

        return results;
    }

    static async uploadSingle(file, metadata) {
        const formData = new FormData();
        formData.append('file', file);

        Object.keys(metadata).forEach(key => {
            if (metadata[key] !== null && metadata[key] !== undefined) {
                formData.append(key, metadata[key]);
            }
        });

        const response = await ErrorHandler.retryWithBackoff(async () => {
            return fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    }
}

/**
 * Enhanced Error Handler with Recovery Options
 */
class EnhancedErrorHandler extends ErrorHandler {
    static async handleFileUploadError(error, filename) {
        const errorMap = {
            413: 'حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)',
            415: 'نوع الملف غير مدعوم',
            507: 'مساحة التخزين ممتلئة',
            429: 'تم تجاوز حد الرفع المسموح. حاول مرة أخرى لاحقاً',
            404: 'الملف غير موجود',
            403: 'ليس لديك صلاحية للوصول لهذا الملف'
        };

        const message = errorMap[error.status] || this.getArabicErrorMessage(error);

        // Show user-friendly error with recovery options
        this.showErrorWithRecovery(message, filename, error.status);

        // Log error for analytics
        this.logError(error, 'file_upload', { filename });

        return message;
    }

    static showErrorWithRecovery(message, filename, errorCode) {
        const recoveryOptions = this.getRecoveryOptions(errorCode);

        const errorHTML = `
            <div class="error-with-recovery">
                <h5 class="text-danger mb-3">
                    <i class="fas fa-exclamation-triangle"></i>
                    خطأ في رفع الملف
                </h5>
                <div class="error-details mb-3">
                    <p><strong>الملف:</strong> ${filename}</p>
                    <p><strong>السبب:</strong> ${message}</p>
                </div>
                <div class="recovery-options">
                    ${recoveryOptions}
                </div>
            </div>
        `;

        // Show in modal or alert
        if (typeof showError === 'function') {
            showError(errorHTML);
        } else {
            alert(message);
        }
    }

    static getRecoveryOptions(errorCode) {
        const options = {
            413: `
                <div class="alert alert-info">
                    <h6>نصائح لتقليل حجم الملف:</h6>
                    <ul class="mb-2">
                        <li>ضغط الصور قبل الرفع</li>
                        <li>استخدام PDF بدلاً من الصور للمستندات</li>
                        <li>تقليل جودة الصور إذا أمكن</li>
                    </ul>
                    <button class="btn btn-sm btn-primary" onclick="documentsManager.showCompressionTips()">
                        <i class="fas fa-compress"></i> المزيد من النصائح
                    </button>
                </div>
            `,
            415: `
                <div class="alert alert-warning">
                    <h6>الأنواع المدعومة:</h6>
                    <p>PDF, JPG, PNG, DOCX, XLSX</p>
                    <button class="btn btn-sm btn-primary" onclick="documentsManager.showSupportedFormats()">
                        <i class="fas fa-file-alt"></i> عرض التفاصيل
                    </button>
                </div>
            `,
            507: `
                <div class="alert alert-danger">
                    <h6>مساحة التخزين ممتلئة</h6>
                    <p>يرجى الاتصال بالمدير لزيادة مساحة التخزين</p>
                    <button class="btn btn-sm btn-warning" onclick="documentsManager.contactAdmin()">
                        <i class="fas fa-phone"></i> اتصل بالمدير
                    </button>
                </div>
            `,
            429: `
                <div class="alert alert-warning">
                    <h6>تم تجاوز حد الرفع</h6>
                    <p>انتظر قليلاً ثم حاول مرة أخرى</p>
                    <button class="btn btn-sm btn-secondary" onclick="setTimeout(() => location.reload(), 60000)">
                        <i class="fas fa-clock"></i> إعادة المحاولة خلال دقيقة
                    </button>
                </div>
            `
        };

        return options[errorCode] || `
            <button class="btn btn-sm btn-secondary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> إعادة تحميل الصفحة
            </button>
        `;
    }

    static async handleNetworkError(error) {
        const isOnline = navigator.onLine;

        if (!isOnline) {
            this.showOfflineMessage();
        } else {
            this.showNetworkErrorMessage();
        }

        // Attempt to retry after delay
        setTimeout(() => {
            if (navigator.onLine) {
                this.showRetryOption();
            }
        }, 5000);
    }

    static showOfflineMessage() {
        const message = `
            <div class="offline-message">
                <h5 class="text-warning">
                    <i class="fas fa-wifi"></i>
                    لا يوجد اتصال بالإنترنت
                </h5>
                <p>تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        `;

        if (typeof showError === 'function') {
            showError(message);
        }
    }

    static showNetworkErrorMessage() {
        const message = `
            <div class="network-error-message">
                <h5 class="text-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    خطأ في الشبكة
                </h5>
                <p>حدث خطأ في الاتصال بالخادم. سيتم إعادة المحاولة تلقائياً</p>
                <div class="progress mt-3">
                    <div class="progress-bar progress-bar-striped progress-bar-animated"
                         style="width: 100%"></div>
                </div>
            </div>
        `;

        if (typeof showError === 'function') {
            showError(message);
        }
    }
}

/**
 * Performance Monitor for tracking system performance
 */
class PerformanceMonitor {
    static trackUploadPerformance(filename, fileSize, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const speed = fileSize / (duration / 1000); // bytes per second

        const metrics = {
            filename,
            fileSize,
            duration,
            speed: Math.round(speed),
            timestamp: new Date().toISOString()
        };

        // Store metrics for analysis
        this.storeMetrics('upload_performance', metrics);

        // Show performance feedback to user
        if (speed < 100000) { // Less than 100KB/s
            this.showSlowConnectionWarning();
        } else if (speed > 1000000) { // More than 1MB/s
            this.showFastConnectionInfo();
        }

        return metrics;
    }

    static trackDownloadPerformance(filename, fileSize, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const speed = fileSize / (duration / 1000);

        const metrics = {
            filename,
            fileSize,
            duration,
            speed: Math.round(speed),
            timestamp: new Date().toISOString(),
            type: 'download'
        };

        this.storeMetrics('download_performance', metrics);
        return metrics;
    }

    static storeMetrics(type, data) {
        try {
            const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
            metrics.push({ type, data });

            // Keep only last 100 metrics
            if (metrics.length > 100) {
                metrics.splice(0, metrics.length - 100);
            }

            localStorage.setItem('performance_metrics', JSON.stringify(metrics));
        } catch (e) {
            console.warn('Could not store performance metrics:', e);
        }
    }

    static showSlowConnectionWarning() {
        if (typeof showWarning === 'function') {
            showWarning('الاتصال بطيء. قد يستغرق رفع الملفات وقتاً أطول من المعتاد');
        }
    }

    static showFastConnectionInfo() {
        if (typeof showInfo === 'function') {
            showInfo('اتصال سريع! تم رفع الملف بسرعة عالية');
        }
    }

    static getPerformanceReport() {
        try {
            const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');

            const uploadMetrics = metrics.filter(m => m.type === 'upload_performance');
            const downloadMetrics = metrics.filter(m => m.type === 'download_performance');

            const avgUploadSpeed = uploadMetrics.length > 0
                ? uploadMetrics.reduce((sum, m) => sum + m.data.speed, 0) / uploadMetrics.length
                : 0;

            const avgDownloadSpeed = downloadMetrics.length > 0
                ? downloadMetrics.reduce((sum, m) => sum + m.data.speed, 0) / downloadMetrics.length
                : 0;

            return {
                totalUploads: uploadMetrics.length,
                totalDownloads: downloadMetrics.length,
                avgUploadSpeed: Math.round(avgUploadSpeed),
                avgDownloadSpeed: Math.round(avgDownloadSpeed),
                lastUpdate: new Date().toISOString()
            };
        } catch (e) {
            return null;
        }
    }
}

// Global instances
const apiCache = new APICache();
const bulkOps = new BulkOperations();
const enhancedErrorHandler = new EnhancedErrorHandler();
const performanceMonitor = new PerformanceMonitor();

/**
 * Documents Management System for Emar Delivery
 *
 * Comprehensive document management system designed for Arabic-speaking users
 * in Kuwait. Provides full RTL support, file upload/download, search capabilities,
 * and bulk operations with enhanced user experience.
 *
 * Features:
 * - Arabic RTL interface with proper typography
 * - Drag-and-drop file upload with validation
 * - Real-time search and filtering
 * - Bulk operations with ZIP download
 * - Performance monitoring and error handling
 * - Responsive design for all screen sizes
 *
 * Supported File Types:
 * - PDF documents
 * - Images (JPG, PNG, WebP)
 * - Office documents (DOCX, XLSX)
 *
 * File Size Limits:
 * - Maximum file size: 15MB
 * - Bulk download: Up to 100 files
 *
 * Browser Support:
 * - Chrome 90+
 * - Firefox 88+
 * - Safari 14+
 * - Edge 90+
 *
 * @author Emar Delivery Team
 * @version 1.0.0
 * @since 2025-01-22
 *
 * @example
 * // Initialize documents manager
 * const documentsManager = new DocumentsManager();
 *
 * // Load documents for drivers
 * await documentsManager.loadDrivers();
 *
 * // Upload a document
 * await documentsManager.uploadDocument(file, 'drivers', 'driver_123');
 */
class DocumentsManager {
    /**
     * Initialize the Documents Manager with default configuration.
     *
     * Sets up the document management system with Arabic RTL support,
     * initializes data structures, and prepares the user interface.
     *
     * @constructor
     */
    constructor() {
        this.currentTab = 'drivers';
        this.drivers = [];
        this.vehicles = [];
        this.otherDocuments = [];
        this.documentStats = {};
        
        this.init();
    }

    /**
     * Initialize the documents manager
     */
    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#drivers-content') {
                    this.currentTab = 'drivers';
                    this.loadDrivers();
                } else if (target === '#vehicles-content') {
                    this.currentTab = 'vehicles';
                    this.loadVehicles();
                } else if (target === '#other-content') {
                    this.currentTab = 'other';
                    this.loadOtherDocuments();
                }
            });
        });

        // Upload button (conditional - only if element exists)
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        // Entity card clicks and upload buttons (delegated event listeners)
        document.addEventListener('click', (e) => {
            // Handle entity card clicks
            const entityCard = e.target.closest('.entity-card[data-entity-type]');
            if (entityCard) {
                const entityType = entityCard.getAttribute('data-entity-type');
                const entityId = entityCard.getAttribute('data-entity-id');

                if (entityType && entityId) {
                    // Navigate to the entity page using the app's navigation system
                    if (window.app && typeof window.app.navigateToPage === 'function') {
                        window.app.navigateToPage(entityType, entityId);
                    } else {
                        console.warn('App navigation not available, falling back to direct navigation');
                        // Fallback: trigger the document modal for the entity
                        this.showEntityDocuments(entityType, entityId);
                    }
                }
                return;
            }

            // Handle upload button clicks
            const uploadButton = e.target.closest('button[data-action="upload"]');
            if (uploadButton) {
                const entityType = uploadButton.getAttribute('data-entity-type');
                this.showUploadModal(entityType);
                return;
            }
        });

        // Search inputs with debouncing
        const debouncedDriversSearch = UXUtils.debounce((value) => {
            this.filterEntities('drivers', value);
        }, 300);

        const debouncedVehiclesSearch = UXUtils.debounce((value) => {
            this.filterEntities('vehicles', value);
        }, 300);

        const debouncedOtherSearch = UXUtils.debounce((value) => {
            this.filterEntities('other', value);
        }, 300);

        // Search inputs (conditional - only if elements exist)
        const driversSearch = document.getElementById('driversSearch');
        if (driversSearch) {
            driversSearch.addEventListener('input', (e) => {
                debouncedDriversSearch(e.target.value);
            });
        }

        const vehiclesSearch = document.getElementById('vehiclesSearch');
        if (vehiclesSearch) {
            vehiclesSearch.addEventListener('input', (e) => {
                debouncedVehiclesSearch(e.target.value);
            });
        }

        const otherSearch = document.getElementById('otherSearch');
        if (otherSearch) {
            otherSearch.addEventListener('input', (e) => {
                debouncedOtherSearch(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                const tabContent = e.target.closest('.tab-pane');
                
                // Update active filter button
                tabContent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Apply filter
                this.applyFilter(this.currentTab, filter);
            });
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load document statistics
            await this.loadDocumentStats();
            
            // Load drivers (default tab)
            await this.loadDrivers();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('خطأ في تحميل البيانات الأولية');
        }
    }

    /**
     * Load document statistics with caching
     */
    async loadDocumentStats() {
        try {
            const cacheKey = 'document_stats';

            // Try to get from cache first
            let stats = apiCache.get(cacheKey);
            if (stats) {
                this.documentStats = stats;
                this.updateTabCounts();
                return;
            }

            // Fetch with retry logic
            const response = await ErrorHandler.retryWithBackoff(async () => {
                return fetch('/api/documents/stats');
            });

            if (response.ok) {
                this.documentStats = await response.json();

                // Cache the results
                apiCache.set(cacheKey, this.documentStats);

                this.updateTabCounts();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Load Document Stats');
        }
    }

    /**
     * Update tab counts
     */
    updateTabCounts() {
        const stats = this.documentStats.by_entity_type || {};
        document.getElementById('driversCount').textContent = stats.driver || 0;
        document.getElementById('vehiclesCount').textContent = stats.vehicle || 0;
        document.getElementById('otherCount').textContent = stats.other || 0;
    }

    /**
     * Load drivers with document counts and enhanced error handling.
     *
     * Fetches all drivers from the API and enriches them with document statistics.
     * Implements caching, skeleton loading, and comprehensive error handling.
     *
     * @async
     * @method loadDrivers
     * @memberof DocumentsManager
     *
     * @description
     * This method performs the following operations:
     * 1. Shows skeleton loading cards for better UX
     * 2. Fetches drivers data from /api/drivers endpoint
     * 3. For each driver, fetches document statistics
     * 4. Caches results for improved performance
     * 5. Updates UI with driver cards and document counts
     * 6. Handles errors gracefully with Arabic messages
     *
     * @returns {Promise<void>} Resolves when drivers are loaded and UI is updated
     *
     * @throws {Error} Network errors, API errors, or data processing errors
     *
     * @example
     * // Load drivers and update UI
     * await documentsManager.loadDrivers();
     *
     * @since 1.0.0
     */
    async loadDrivers() {
        try {
            const grid = document.getElementById('driversGrid');
            this.showEnhancedSkeletonCards(grid, 6);
            UXUtils.announceToScreenReader('جاري تحميل بيانات السائقين');

            const cacheKey = 'drivers_with_docs';

            // Try cache first
            let driversData = apiCache.get(cacheKey);
            if (driversData) {
                this.drivers = driversData;
                this.renderDrivers();
                UXUtils.announceToScreenReader(`تم تحميل ${this.drivers.length} سائق من الذاكرة المؤقتة`);
                return;
            }

            // Fetch drivers with retry logic
            const response = await ErrorHandler.retryWithBackoff(async () => {
                return fetch('/api/drivers');
            });

            if (response.ok) {
                this.drivers = await response.json();

                // Get document counts for each driver with parallel requests
                const documentPromises = this.drivers.map(async (driver) => {
                    try {
                        const docCacheKey = `driver_docs_${driver.id}`;
                        let docData = apiCache.get(docCacheKey);

                        if (!docData) {
                            const docResponse = await ErrorHandler.retryWithBackoff(async () => {
                                return fetch(`/api/documents/entity/driver/${driver.id}`);
                            });

                            if (docResponse.ok) {
                                docData = await docResponse.json();
                                apiCache.set(docCacheKey, docData);
                            }
                        }

                        if (docData) {
                            driver.documentStats = docData.stats;
                            driver.documents = docData.documents;
                        } else {
                            driver.documentStats = { total_documents: 0 };
                            driver.documents = [];
                        }
                    } catch (error) {
                        console.error(`Error loading documents for driver ${driver.id}:`, error);
                        driver.documentStats = { total_documents: 0 };
                        driver.documents = [];
                    }
                });

                // Wait for all document counts to load
                await Promise.allSettled(documentPromises);

                // Cache the complete data
                apiCache.set(cacheKey, this.drivers);

                this.renderDrivers();
                UXUtils.announceToScreenReader(`تم تحميل ${this.drivers.length} سائق`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Load Drivers');
            this.showError('خطأ في تحميل بيانات السائقين', 'driversGrid');
        }
    }

    /**
     * Load vehicles with document counts - Optimized for performance
     */
    async loadVehicles() {
        try {
            const grid = document.getElementById('vehiclesGrid');
            this.showEnhancedSkeletonCards(grid, 6);
            UXUtils.announceToScreenReader('جاري تحميل بيانات المركبات');

            const cacheKey = 'vehicles_with_docs';

            // Try cache first
            let vehiclesData = apiCache.get(cacheKey);
            if (vehiclesData) {
                this.vehicles = vehiclesData;
                this.renderVehicles();
                UXUtils.announceToScreenReader(`تم تحميل ${this.vehicles.length} مركبة من الذاكرة المؤقتة`);
                return;
            }

            // Fetch vehicles with retry logic
            const response = await ErrorHandler.retryWithBackoff(async () => {
                return fetch('/api/vehicles');
            });

            if (response.ok) {
                this.vehicles = await response.json();

                // Get document counts for each vehicle with parallel requests
                const documentPromises = this.vehicles.map(async (vehicle) => {
                    try {
                        const docCacheKey = `vehicle_docs_${vehicle.id}`;
                        let docData = apiCache.get(docCacheKey);

                        if (!docData) {
                            const docResponse = await ErrorHandler.retryWithBackoff(async () => {
                                return fetch(`/api/documents/entity/vehicle/${vehicle.id}`);
                            });

                            if (docResponse.ok) {
                                docData = await docResponse.json();
                                apiCache.set(docCacheKey, docData);
                            }
                        }

                        if (docData) {
                            vehicle.documentStats = docData.stats;
                            vehicle.documents = docData.documents;
                        } else {
                            vehicle.documentStats = { total_documents: 0 };
                            vehicle.documents = [];
                        }
                    } catch (error) {
                        console.error(`Error loading documents for vehicle ${vehicle.id}:`, error);
                        vehicle.documentStats = { total_documents: 0 };
                        vehicle.documents = [];
                    }
                });

                // Wait for all document counts to load in parallel
                await Promise.allSettled(documentPromises);

                // Cache the complete data
                apiCache.set(cacheKey, this.vehicles);

                this.renderVehicles();
                UXUtils.announceToScreenReader(`تم تحميل ${this.vehicles.length} مركبة`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Load Vehicles');
            this.showError('خطأ في تحميل بيانات المركبات', 'vehiclesGrid');
            UXUtils.announceToScreenReader('خطأ في تحميل بيانات المركبات');
        }
    }

    /**
     * Load other documents - Optimized for performance
     */
    async loadOtherDocuments() {
        try {
            const grid = document.getElementById('otherGrid');
            this.showEnhancedSkeletonCards(grid, 3);
            UXUtils.announceToScreenReader('جاري تحميل الوثائق الأخرى');

            const cacheKey = 'other_documents';

            // Try cache first
            let documentsData = apiCache.get(cacheKey);
            if (documentsData) {
                this.otherDocuments = documentsData.documents || [];
                this.renderOtherDocuments();
                UXUtils.announceToScreenReader(`تم تحميل ${this.otherDocuments.length} وثيقة أخرى من الذاكرة المؤقتة`);
                return;
            }

            // Fetch other documents with retry logic
            const response = await ErrorHandler.retryWithBackoff(async () => {
                return fetch('/api/documents?entity_type=other');
            });

            if (response.ok) {
                const data = await response.json();
                this.otherDocuments = data.documents || [];

                // Cache the complete data
                apiCache.set(cacheKey, data);

                this.renderOtherDocuments();
                UXUtils.announceToScreenReader(`تم تحميل ${this.otherDocuments.length} وثيقة أخرى`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Load Other Documents');
            this.showError('خطأ في تحميل الوثائق الأخرى', 'otherGrid');
            UXUtils.announceToScreenReader('خطأ في تحميل الوثائق الأخرى');
        }
    }

    /**
     * Render drivers grid with enhanced UX
     */
    renderDrivers() {
        const grid = document.getElementById('driversGrid');

        if (this.drivers.length === 0) {
            grid.innerHTML = this.getEmptyState('لا توجد سائقون مسجلون', 'fas fa-user-plus', 'drivers');
            return;
        }

        const html = this.drivers.map(driver => this.createDriverCard(driver)).join('');
        grid.innerHTML = html;

        // Add enhanced animations and effects
        UXUtils.addFadeInAnimation(grid);

        // Add enhanced card effects
        grid.querySelectorAll('.entity-card').forEach(card => {
            card.classList.add('entity-card-enhanced');
            UXUtils.addRippleEffect(card);
        });
    }

    /**
     * Render vehicles grid with enhanced UX
     */
    renderVehicles() {
        const grid = document.getElementById('vehiclesGrid');

        if (this.vehicles.length === 0) {
            grid.innerHTML = this.getEmptyState('لا توجد مركبات مسجلة', 'fas fa-car', 'vehicles');
            return;
        }

        const html = this.vehicles.map(vehicle => this.createVehicleCard(vehicle)).join('');
        grid.innerHTML = html;

        // Add enhanced animations and effects
        UXUtils.addFadeInAnimation(grid);

        // Add enhanced card effects
        grid.querySelectorAll('.entity-card').forEach(card => {
            card.classList.add('entity-card-enhanced');
            UXUtils.addRippleEffect(card);
        });
    }

    /**
     * Render other documents with enhanced UX
     */
    renderOtherDocuments() {
        const grid = document.getElementById('otherGrid');

        if (this.otherDocuments.length === 0) {
            grid.innerHTML = this.getEmptyState('لا توجد وثائق أخرى', 'fas fa-folder-open', 'other');
            return;
        }

        const html = this.otherDocuments.map(doc => this.createDocumentCard(doc)).join('');
        grid.innerHTML = html;

        // Add enhanced animations and effects
        UXUtils.addFadeInAnimation(grid);

        // Add enhanced card effects
        grid.querySelectorAll('.entity-card').forEach(card => {
            card.classList.add('entity-card-enhanced');
            UXUtils.addRippleEffect(card);
        });
    }

    /**
     * Create driver card HTML
     */
    createDriverCard(driver) {
        const stats = driver.documentStats || {};
        const badgeClass = this.getDocumentBadgeClass(stats);
        const documentCount = stats.total_documents || 0;
        
        return `
            <div class="entity-card" data-entity-type="driver" data-entity-id="${driver.id}">
                <div class="entity-card-header">
                    <div class="document-badge ${badgeClass}">
                        ${documentCount}
                    </div>
                    <div class="entity-info">
                        <h5 class="entity-name">${driver.full_name || driver.name || 'غير محدد'}</h5>
                        <div class="entity-details">
                            <i class="fas fa-id-card"></i> ${driver.national_id || driver.civil_id || 'غير محدد'}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-phone"></i> ${driver.phone || 'غير محدد'}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-briefcase"></i> ${this.getEmploymentTypeArabic(driver.employment_type)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-calendar"></i> تاريخ انتهاء الإقامة: ${this.formatResidencyExpiryDate(driver.residency_expiry_date)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-passport"></i> ${this.getResidenceStatusBadge(driver.residence_status)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-car"></i> ملكية السيارة: ${this.getCarOwnershipArabic(driver.car_ownership)}
                        </div>
                    </div>
                </div>
                <div class="entity-card-body">
                    <div class="entity-stats">
                        <div class="stat-item">
                            <div class="stat-value">${documentCount}</div>
                            <div class="stat-label">وثيقة</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.expired_count || 0}</div>
                            <div class="stat-label">منتهية</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.expiring_soon || 0}</div>
                            <div class="stat-label">تنتهي قريباً</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get Arabic translation for employment type
     */
    getEmploymentTypeArabic(employmentType) {
        const types = {
            'commission': 'بالعمولة',
            'salary': 'راتب ثابت',
            'mixed': 'مختلط'
        };
        return types[employmentType] || employmentType || 'غير محدد';
    }

    /**
     * Format hire date for display
     */
    formatHireDate(hireDate) {
        if (!hireDate) return 'غير محدد';

        try {
            const date = new Date(hireDate);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Kuwait'
            };
            return date.toLocaleDateString('ar-KW', options);
        } catch (error) {
            return hireDate;
        }
    }

    /**
     * Format residency expiry date for display (Gregorian)
     */
    formatResidencyExpiryDate(expiryDate) {
        if (!expiryDate) return 'غير محدد';

        try {
            const date = new Date(expiryDate);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Kuwait'
            };
            return date.toLocaleDateString('ar-KW', options);
        } catch (error) {
            return expiryDate;
        }
    }

    /**
     * Get car ownership in Arabic
     */
    getCarOwnershipArabic(carOwnership) {
        const ownershipMap = {
            'private': 'خاصة',
            'company': 'شركة'
        };
        return ownershipMap[carOwnership] || 'غير محدد';
    }

    /**
     * Get residence status badge HTML
     */
    getResidenceStatusBadge(status) {
        if (!status) return '<span class="badge bg-secondary">غير محدد</span>';

        const statusMap = {
            'صالحة': '<span class="badge bg-success">صالحة</span>',
            'منتهية': '<span class="badge bg-danger">منتهية</span>',
            'تنتهي قريباً': '<span class="badge bg-warning">تنتهي قريباً</span>',
            'مواطن': '<span class="badge bg-info">مواطن</span>'
        };

        return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    /**
     * Create comprehensive vehicle card HTML
     */
    createVehicleCard(vehicle) {
        const stats = vehicle.documentStats || {};
        const badgeClass = this.getDocumentBadgeClass(stats);
        const documentCount = stats.total_documents || 0;

        return `
            <div class="entity-card" data-entity-type="vehicle" data-entity-id="${vehicle.id}">
                <div class="entity-card-header">
                    <div class="document-badge ${badgeClass}">
                        ${documentCount}
                    </div>
                    <div class="entity-info">
                        <h5 class="entity-name">${vehicle.license_plate || vehicle.plate_number || 'غير محدد'}</h5>
                        <div class="entity-details">
                            <i class="fas fa-car"></i> ${vehicle.make || 'غير محدد'} ${vehicle.model || 'غير محدد'} (${vehicle.year || 'غير محدد'})
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-palette"></i> ${vehicle.color || 'غير محدد'}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-tachometer-alt"></i> ${this.formatMileage(vehicle.mileage)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-shield-alt"></i> ${this.getInsuranceStatusBadge(vehicle.insurance_status, vehicle.insurance_expiry_date || vehicle.insurance_expiry)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-id-card"></i> ${this.getRegistrationStatusBadge(vehicle.registration_status, vehicle.registration_expiry_date)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-user"></i> ${this.getAssignedDriverName(vehicle.assigned_driver_id)}
                        </div>
                    </div>
                </div>
                <div class="entity-card-body">
                    <div class="entity-stats">
                        <div class="stat-item">
                            <div class="stat-value">${documentCount}</div>
                            <div class="stat-label">وثيقة</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.expired_count || 0}</div>
                            <div class="stat-label">منتهية</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.expiring_soon || 0}</div>
                            <div class="stat-label">تنتهي قريباً</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format vehicle mileage for display
     */
    formatMileage(mileage) {
        if (!mileage) return 'غير محدد';
        return `${mileage.toLocaleString('ar-SA')} كم`;
    }

    /**
     * Get insurance status badge HTML
     */
    getInsuranceStatusBadge(status, expiryDate) {
        if (!status) return '<span class="badge bg-secondary">غير محدد</span>';

        let badgeClass = 'bg-secondary';
        let displayText = status;

        if (expiryDate) {
            const expiry = new Date(expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                badgeClass = 'bg-danger';
                displayText = 'منتهي';
            } else if (daysUntilExpiry <= 30) {
                badgeClass = 'bg-warning';
                displayText = 'ينتهي قريباً';
            } else {
                badgeClass = 'bg-success';
                displayText = 'صالح';
            }

            displayText += ` (${this.formatExpiryDate(expiryDate)})`;
        }

        return `<span class="badge ${badgeClass}">${displayText}</span>`;
    }

    /**
     * Get registration status badge HTML
     */
    getRegistrationStatusBadge(status, expiryDate) {
        if (!status) return '<span class="badge bg-secondary">غير محدد</span>';

        let badgeClass = 'bg-secondary';
        let displayText = status;

        if (expiryDate) {
            const expiry = new Date(expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                badgeClass = 'bg-danger';
                displayText = 'منتهي';
            } else if (daysUntilExpiry <= 30) {
                badgeClass = 'bg-warning';
                displayText = 'ينتهي قريباً';
            } else {
                badgeClass = 'bg-success';
                displayText = 'صالح';
            }

            displayText += ` (${this.formatExpiryDate(expiryDate)})`;
        }

        return `<span class="badge ${badgeClass}">${displayText}</span>`;
    }

    /**
     * Format expiry date for display (Gregorian)
     */
    formatExpiryDate(dateString) {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-KW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Kuwait'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Get assigned driver name
     */
    getAssignedDriverName(driverId) {
        if (!driverId) return '<span class="text-muted">غير مخصص</span>';

        // Try to find driver in cached drivers data
        if (this.drivers && this.drivers.length > 0) {
            const driver = this.drivers.find(d => d.id === driverId);
            if (driver) {
                return `<span class="text-primary">${driver.full_name || driver.name || 'غير محدد'}</span>`;
            }
        }

        return `<span class="text-info">السائق: ${driverId}</span>`;
    }

    /**
     * Create enhanced document card HTML for other documents
     */
    createDocumentCard(document) {
        const iconClass = this.getFileIconClass(document.mime_type || document.file_type);
        const sizeFormatted = this.formatFileSize(document.size_bytes || document.file_size);
        const statusBadge = this.getDocumentStatusBadge(document.status);
        const categoryBadge = this.getDocumentCategoryBadge(document.category);

        return `
            <div class="entity-card" data-action="show-details" data-document-id="${document.id}">
                <div class="entity-card-header">
                    <div class="document-badge ${this.getDocumentTypeBadgeClass(document.category)}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="entity-info">
                        <h5 class="entity-name">${document.display_name || document.name || document.original_filename || 'وثيقة غير محددة'}</h5>
                        <div class="entity-details">
                            <i class="fas fa-file"></i> ${document.original_filename || document.filename || 'غير محدد'}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-hdd"></i> ${sizeFormatted}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-tags"></i> ${categoryBadge}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-info-circle"></i> ${statusBadge}
                        </div>
                        <div class="entity-details">
                            ${this.formatDocumentDateInfo(document)}
                        </div>
                        <div class="entity-details">
                            <i class="fas fa-user"></i> ${document.uploaded_by || document.uploader || 'غير محدد'}
                        </div>
                    </div>
                </div>
                <div class="entity-card-body">
                    <div class="entity-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.getFileTypeDisplay(document.mime_type || document.file_type)}</div>
                            <div class="stat-label">نوع الملف</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${document.downloads || 0}</div>
                            <div class="stat-label">مرات التحميل</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getDocumentAge(document.created_at || document.upload_date)}</div>
                            <div class="stat-label">العمر</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get document status badge HTML
     */
    getDocumentStatusBadge(status) {
        if (!status) return '<span class="badge bg-secondary">غير محدد</span>';

        const statusMap = {
            'active': '<span class="badge bg-success">نشط</span>',
            'archived': '<span class="badge bg-warning">مؤرشف</span>',
            'deleted': '<span class="badge bg-danger">محذوف</span>',
            'pending': '<span class="badge bg-info">معلق</span>',
            'approved': '<span class="badge bg-success">معتمد</span>',
            'rejected': '<span class="badge bg-danger">مرفوض</span>'
        };

        return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    /**
     * Get document category badge HTML
     */
    getDocumentCategoryBadge(category) {
        if (!category) return '<span class="badge bg-secondary">غير محدد</span>';

        const categoryMap = {
            'contract': '<span class="badge bg-primary">عقد</span>',
            'invoice': '<span class="badge bg-info">فاتورة</span>',
            'receipt': '<span class="badge bg-success">إيصال</span>',
            'report': '<span class="badge bg-warning">تقرير</span>',
            'certificate': '<span class="badge bg-danger">شهادة</span>',
            'license': '<span class="badge bg-dark">رخصة</span>',
            'other': '<span class="badge bg-secondary">أخرى</span>'
        };

        return categoryMap[category] || `<span class="badge bg-secondary">${category}</span>`;
    }

    /**
     * Get document type badge class
     */
    getDocumentTypeBadgeClass(category) {
        const classMap = {
            'contract': 'primary',
            'invoice': 'info',
            'receipt': 'success',
            'report': 'warning',
            'certificate': 'danger',
            'license': 'dark',
            'other': 'secondary'
        };

        return classMap[category] || 'secondary';
    }

    /**
     * Format document date for display (Gregorian)
     */
    formatDocumentDate(dateString) {
        if (!dateString) return 'غير محدد';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-KW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Kuwait'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Format document date info - prioritizes expiry date over creation date
     */
    formatDocumentDateInfo(document) {
        // Priority 1: Show expiry date if it exists
        if (document.expiry_date) {
            const expiryFormatted = this.formatDocumentDate(document.expiry_date);
            
            // Check if expired or expiring soon
            try {
                const expiryDate = new Date(document.expiry_date);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry < 0) {
                    return `<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> انتهى: ${expiryFormatted}</span>`;
                } else if (daysUntilExpiry <= 30) {
                    return `<span class="text-warning"><i class="fas fa-clock"></i> ينتهي: ${expiryFormatted}</span>`;
                } else {
                    return `<span class="text-success"><i class="fas fa-calendar-check"></i> ينتهي: ${expiryFormatted}</span>`;
                }
            } catch (error) {
                return `<span><i class="fas fa-calendar-alt"></i> ينتهي: ${expiryFormatted}</span>`;
            }
        }
        
        // Priority 2: Show creation/upload date if no expiry date
        const creationDate = document.created_at || document.upload_date;
        if (creationDate) {
            return `<span><i class="fas fa-upload"></i> رُفع: ${this.formatDocumentDate(creationDate)}</span>`;
        }
        
        return 'غير محدد';
    }

    /**
     * Get file type display name
     */
    getFileTypeDisplay(mimeType) {
        if (!mimeType) return 'غير محدد';

        const typeMap = {
            'application/pdf': 'PDF',
            'image/jpeg': 'صورة JPEG',
            'image/png': 'صورة PNG',
            'image/gif': 'صورة GIF',
            'application/msword': 'مستند Word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'مستند Word',
            'application/vnd.ms-excel': 'جدول Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'جدول Excel',
            'text/plain': 'ملف نصي',
            'text/csv': 'ملف CSV'
        };

        return typeMap[mimeType] || mimeType.split('/')[1].toUpperCase();
    }

    /**
     * Get document age in human readable format
     */
    getDocumentAge(dateString) {
        if (!dateString) return 'غير محدد';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) return 'يوم واحد';
            if (diffDays < 7) return `${diffDays} أيام`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} أسابيع`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} أشهر`;
            return `${Math.floor(diffDays / 365)} سنوات`;
        } catch (error) {
            return 'غير محدد';
        }
    }

    /**
     * Get document badge class based on stats
     */
    getDocumentBadgeClass(stats) {
        if (!stats || stats.total_documents === 0) {
            return 'secondary';
        }
        
        if (stats.expired_count > 0) {
            return 'danger';
        }
        
        if (stats.expiring_soon > 0) {
            return 'warning';
        }
        
        return '';
    }

    /**
     * Get file icon class
     */
    getFileIconClass(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'fas fa-image text-info';
        } else if (mimeType === 'application/pdf') {
            return 'fas fa-file-pdf text-danger';
        } else if (mimeType.includes('word')) {
            return 'fas fa-file-word text-primary';
        } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            return 'fas fa-file-excel text-success';
        } else {
            return 'fas fa-file text-secondary';
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Format date (Gregorian)
     */
    formatDate(dateString) {
        if (!dateString) return 'غير محدد';

        const date = new Date(dateString);
        return date.toLocaleDateString('ar-KW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Kuwait'
        });
    }

    /**
     * Show loading spinner
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message, containerId = null) {
        const html = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle text-danger"></i>
                <h4>خطأ</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    إعادة المحاولة
                </button>
            </div>
        `;
        
        if (containerId) {
            document.getElementById(containerId).innerHTML = html;
        } else {
            showError(message);
        }
    }

    /**
     * Get enhanced empty state HTML
     */
    getEmptyState(message, icon, entityType = 'other') {
        const emptyStateConfig = {
            drivers: {
                title: 'لا توجد وثائق للسائقين',
                description: 'ابدأ برفع رخص القيادة والهويات والمستندات الشخصية',
                buttonText: 'رفع وثيقة سائق',
                tips: 'يمكنك رفع رخص القيادة، الهويات، والشهادات الطبية',
                icon: 'fas fa-id-card'
            },
            vehicles: {
                title: 'لا توجد وثائق للمركبات',
                description: 'ارفع رخص السير وبوالص التأمين ووثائق الصيانة',
                buttonText: 'رفع وثيقة مركبة',
                tips: 'يمكنك رفع رخص السير، التأمين، وشهادات الفحص الفني',
                icon: 'fas fa-car'
            },
            other: {
                title: 'لا توجد وثائق أخرى',
                description: 'ارفع العقود والمستندات والملفات الأخرى',
                buttonText: 'رفع وثيقة',
                tips: 'يمكنك رفع العقود، الفواتير، والمستندات الإدارية',
                icon: 'fas fa-file-alt'
            }
        };

        const config = emptyStateConfig[entityType] || emptyStateConfig.other;

        return `
            <div class="empty-state-enhanced fade-in-up">
                <div class="empty-icon">
                    <i class="${config.icon} fa-4x"></i>
                </div>
                <h4 class="empty-title">${config.title}</h4>
                <p class="empty-description">${config.description}</p>
                <div class="empty-actions">
                    <button class="btn btn-primary btn-lg btn-enhanced" data-action="upload" data-entity-type="${entityType}">
                        <i class="fas fa-plus icon-right"></i>
                        ${config.buttonText}
                    </button>
                </div>
                <div class="empty-tips">
                    <small class="text-muted">
                        <i class="fas fa-info-circle icon-right"></i>
                        ${config.tips}
                    </small>
                </div>
            </div>
        `;
    }

    /**
     * Show enhanced loading state
     */
    showEnhancedLoading(container, message = 'جاري التحميل...') {
        const loadingHTML = `
            <div class="loading-enhanced">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">${message}</span>
                </div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        container.innerHTML = loadingHTML;
    }

    /**
     * Show enhanced skeleton cards
     */
    showEnhancedSkeletonCards(container, count = 6) {
        const skeletonHTML = Array(count).fill().map(() => `
            <div class="skeleton-card-enhanced">
                <div class="skeleton-header-enhanced"></div>
                <div class="skeleton-body-enhanced"></div>
                <div class="skeleton-body-enhanced short"></div>
                <div class="skeleton-body-enhanced medium"></div>
            </div>
        `).join('');
        container.innerHTML = skeletonHTML;
    }

    /**
     * Show entity documents modal
     */
    showEntityDocuments(entityType, entityId, entityName) {
        if (documentModal) {
            documentModal.show(entityType, entityId, entityName);
        } else {
            console.error('Document modal not initialized');
            showError('خطأ في تهيئة نافذة الوثائق');
        }
    }

    /**
     * Show document details
     */
    async showDocumentDetails(documentId) {
        try {
            // Show the modal first
            const modal = new bootstrap.Modal(document.getElementById('documentDetailsModal'));
            modal.show();
            
            // Load document details
            const response = await fetch(`/api/documents/${documentId}/info`);
            if (!response.ok) {
                throw new Error('Failed to load document info');
            }
            
            const doc = await response.json();
            this.currentDocumentId = documentId;
            
            // Create document details HTML
            const detailsHTML = this.createDocumentDetailsHTML(doc);
            
            // Update modal content
            document.getElementById('documentDetailsContent').innerHTML = detailsHTML;
            
            // Setup action button handlers
            this.setupDocumentActionHandlers(documentId);
            
        } catch (error) {
            console.error('Error loading document details:', error);
            showError('خطأ في تحميل تفاصيل الوثيقة');
        }
    }

    /**
     * Create document details HTML
     */
    createDocumentDetailsHTML(doc) {
        const formattedDate = this.formatDate(doc.uploaded_at);
        const formattedSize = this.formatFileSize(doc.size_bytes);
        const categoryName = this.getCategoryName(doc.category);
        const statusBadge = this.getDocumentStatusBadge(doc.status);
        
        return `
            <div class="document-details">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">
                                    <i class="fas fa-info-circle text-primary"></i>
                                    المعلومات الأساسية
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <strong>اسم الوثيقة:</strong>
                                    <div class="text-muted">${doc.display_name}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>اسم الملف:</strong>
                                    <div class="text-muted">${doc.original_filename}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>الفئة:</strong>
                                    <div class="text-muted">${categoryName}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>الحالة:</strong>
                                    <div>${statusBadge}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>الحجم:</strong>
                                    <div class="text-muted">${formattedSize}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">
                                    <i class="fas fa-clock text-primary"></i>
                                    معلومات إضافية
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <strong>تاريخ الرفع:</strong>
                                    <div class="text-muted">${formattedDate}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>رفع بواسطة:</strong>
                                    <div class="text-muted">${doc.uploaded_by || 'admin'}</div>
                                </div>
                                <div class="mb-3">
                                    <strong>عدد مرات التحميل:</strong>
                                    <div class="text-muted">${doc.downloads || 0}</div>
                                </div>
                                ${doc.expiry_date ? `
                                    <div class="mb-3">
                                        <strong>تاريخ الانتهاء:</strong>
                                        <div class="text-muted">${doc.expiry_date}</div>
                                    </div>
                                ` : ''}
                                ${doc.notes ? `
                                    <div class="mb-3">
                                        <strong>الملاحظات:</strong>
                                        <div class="text-muted">${doc.notes}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup document action button handlers
     */
    setupDocumentActionHandlers(documentId) {
        // Preview button
        const previewBtn = document.getElementById('previewDocumentBtn');
        if (previewBtn) {
            previewBtn.onclick = () => {
                if (window.documentModal && typeof window.documentModal.previewDocument === 'function') {
                    window.documentModal.previewDocument(documentId);
                } else {
                    window.open(`/api/documents/preview/${documentId}`, '_blank');
                }
            };
        }

        // Download button
        const downloadBtn = document.getElementById('downloadDocumentBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                if (window.documentModal && typeof window.documentModal.downloadDocument === 'function') {
                    window.documentModal.downloadDocument(documentId);
                } else {
                    window.open(`/api/documents/download/${documentId}`, '_blank');
                }
            };
        }

        // Edit button
        const editBtn = document.getElementById('editDocumentBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                if (window.documentModal && typeof window.documentModal.editDocument === 'function') {
                    window.documentModal.editDocument(documentId);
                } else {
                    showInfo('تعديل الوثيقة غير متاح حالياً');
                }
            };
        }

        // Delete button
        const deleteBtn = document.getElementById('deleteDocumentBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (window.documentModal && typeof window.documentModal.deleteDocument === 'function') {
                    window.documentModal.deleteDocument(documentId);
                } else {
                    showError('حذف الوثيقة غير متاح حالياً');
                }
            };
        }
    }

    /**
     * Show document info modal
     */
    async showDocumentInfo(documentId) {
        try {
            const response = await fetch(`/api/documents/${documentId}/info`);
            if (response.ok) {
                const doc = await response.json();
                const info = `
                    <strong>اسم الوثيقة:</strong> ${doc.display_name}<br>
                    <strong>اسم الملف:</strong> ${doc.original_filename}<br>
                    <strong>الحجم:</strong> ${doc.size_formatted}<br>
                    <strong>الفئة:</strong> ${this.getCategoryName(doc.category)}<br>
                    <strong>الحالة:</strong> ${doc.status}<br>
                    <strong>تاريخ الرفع:</strong> ${this.formatDate(doc.uploaded_at)}<br>
                    ${doc.notes ? `<strong>الملاحظات:</strong> ${doc.notes}<br>` : ''}
                    ${doc.expiry_date ? `<strong>تاريخ الانتهاء:</strong> ${doc.expiry_date}<br>` : ''}
                `;

                showInfo(info, 'معلومات الوثيقة');
            } else {
                throw new Error('Failed to load document info');
            }
        } catch (error) {
            console.error('Error loading document info:', error);
            showError('خطأ في تحميل معلومات الوثيقة');
        }
    }

    /**
     * Get category name in Arabic
     */
    getCategoryName(category) {
        const categoryMap = {
            'id_copy': 'نسخة الهوية',
            'license': 'رخصة القيادة',
            'insurance': 'التأمين',
            'contract': 'العقد',
            'maintenance': 'الصيانة',
            'other': 'أخرى'
        };
        return categoryMap[category] || 'غير محدد';
    }

    /**
     * Show upload modal
     */
    showUploadModal() {
        if (window.uploadModal) {
            window.uploadModal.show();
        } else {
            showError('خطأ في تهيئة نافذة الرفع');
        }
    }

    /**
     * Show entity documents modal
     * عرض نافذة وثائق الكيان
     */
    showEntityDocuments(entityType, entityId) {
        console.log(`Opening documents for ${entityType} with ID: ${entityId}`);

        if (documentModal) {
            // Set the entity context and show the modal
            documentModal.entityType = entityType;
            documentModal.entityId = entityId;
            documentModal.show();
        } else {
            console.error('Document modal not available');
            showError('خطأ في تهيئة نافذة الوثائق');
        }
    }

    /**
     * Filter entities
     */
    filterEntities(type, searchTerm) {
        // This will be implemented with more advanced filtering
        console.log(`Filter ${type} with term: ${searchTerm}`);
    }

    /**
     * Apply filter
     */
    applyFilter(type, filter) {
        // This will be implemented with more advanced filtering
        console.log(`Apply filter ${filter} to ${type}`);
    }
}

/**
 * Document Management Modal Class
 * فئة إدارة نافذة الوثائق
 */
class DocumentModal {
    constructor() {
        this.currentEntityType = null;
        this.currentEntityId = null;
        this.currentEntityName = null;
        this.documents = [];
        this.filteredDocuments = [];
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortField = 'created_at';
        this.sortOrder = 'desc';
        this.selectedDocuments = new Set();

        this.initializeModal();
    }

    /**
     * Initialize modal event listeners
     */
    initializeModal() {
        // Search input (conditional - only if element exists)
        const documentSearch = document.getElementById('documentSearch');
        if (documentSearch) {
            documentSearch.addEventListener('input', () => {
                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderTable();
                this.updatePagination();
            });
        }

        // Filter selects (conditional - only if elements exist)
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderTable();
                this.updatePagination();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderTable();
                this.updatePagination();
            });
        }

        // Items per page (conditional - only if element exists)
        const itemsPerPage = document.getElementById('itemsPerPage');
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.renderTable();
                this.updatePagination();
            });
        }

        // Clear filters (conditional - only if element exists)
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                const documentSearch = document.getElementById('documentSearch');
                const categoryFilter = document.getElementById('categoryFilter');
                const statusFilter = document.getElementById('statusFilter');

                if (documentSearch) documentSearch.value = '';
                if (categoryFilter) categoryFilter.value = '';
                if (statusFilter) statusFilter.value = '';

                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderTable();
                this.updatePagination();
            });
        }

        // Select all checkbox (conditional - only if element exists)
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.document-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const docId = cb.getAttribute('data-doc-id');
                if (e.target.checked) {
                    this.selectedDocuments.add(docId);
                } else {
                    this.selectedDocuments.delete(docId);
                }
            });
            this.updateSelectionUI();
            });
        }

        // Action buttons (conditional - only if elements exist)
        const uploadDocBtn = document.getElementById('uploadDocBtn');
        if (uploadDocBtn) {
            uploadDocBtn.addEventListener('click', () => {
                this.uploadDocument();
            });
        }

        const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
        if (downloadSelectedBtn) {
            downloadSelectedBtn.addEventListener('click', () => {
                this.downloadSelected();
            });
        }

        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                this.deleteSelected();
            });
        }

        const refreshDocuments = document.getElementById('refreshDocuments');
        if (refreshDocuments) {
            refreshDocuments.addEventListener('click', () => {
                this.loadDocuments();
            });
        }

        // Sortable headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.getAttribute('data-sort');
                if (this.sortField === sortField) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = sortField;
                    this.sortOrder = 'asc';
                }
                this.applyFiltersAndSort();
                this.renderTable();
                this.updateSortIcons();
            });
        });

        // Document checkboxes (delegated event)
        const documentsTableBodyForCheckboxes = document.getElementById('documentsTableBody');
        if (documentsTableBodyForCheckboxes) {
            documentsTableBodyForCheckboxes.addEventListener('change', (e) => {
                if (e.target.classList.contains('document-checkbox')) {
                    const docId = e.target.getAttribute('data-doc-id');
                    if (e.target.checked) {
                        this.selectedDocuments.add(docId);
                    } else {
                        this.selectedDocuments.delete(docId);
                    }
                    this.updateSelectionUI();
                }
            });
        }

        // Document action buttons (delegated event)
        const documentTableBody = document.getElementById('documentsTableBody');
        if (documentTableBody) {
            documentTableBody.addEventListener('click', (e) => {
                const actionButton = e.target.closest('button[data-action]');
                if (actionButton) {
                    const action = actionButton.getAttribute('data-action');
                    const documentId = actionButton.getAttribute('data-document-id');

                    if (action && documentId) {
                        switch (action) {
                            case 'preview':
                                this.previewDocument(documentId);
                                break;
                            case 'download':
                                this.downloadDocument(documentId);
                                break;
                            case 'edit':
                                this.editDocument(documentId);
                                break;
                            case 'delete':
                                this.deleteDocument(documentId);
                                break;
                            case 'reload-documents':
                                this.loadDocuments();
                                break;
                            default:
                                console.warn(`Unknown document action: ${action}`);
                        }
                    }
                }
            });
        }

        // Pagination and other modal actions (delegated event)
        document.addEventListener('click', (e) => {
            const actionElement = e.target.closest('[data-action]');
            if (actionElement && actionElement.closest('.modal')) {
                const action = actionElement.getAttribute('data-action');

                switch (action) {
                    case 'goto-page':
                        e.preventDefault();
                        const page = parseInt(actionElement.getAttribute('data-page'));
                        if (page && page !== this.currentPage && window.documentModal) {
                            window.documentModal.goToPage(page);
                        }
                        break;
                    case 'show-details':
                        const docId = actionElement.getAttribute('data-document-id');
                        if (docId && window.documentsManager) {
                            window.documentsManager.showDocumentDetails(docId);
                        }
                        break;
                    case 'remove-file':
                        const fileIndex = parseInt(actionElement.getAttribute('data-file-index'));
                        if (fileIndex !== undefined && window.uploadModal) {
                            window.uploadModal.removeFile(fileIndex);
                        }
                        break;
                }
            }
        });
    }

    /**
     * Show modal for entity documents
     */
    show(entityType, entityId, entityName) {
        this.currentEntityType = entityType;
        this.currentEntityId = entityId;
        this.currentEntityName = entityName;

        // Reset state
        this.currentPage = 1;
        this.selectedDocuments.clear();
        document.getElementById('documentSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';

        // Update modal title
        document.getElementById('entityName').textContent = entityName;

        // Load documents
        this.loadDocuments();

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('documentModal'));
        modal.show();
    }

    /**
     * Load documents for current entity
     */
    async loadDocuments() {
        try {
            this.showLoading();

            const response = await fetch(`/api/documents/entity/${this.currentEntityType}/${this.currentEntityId}`);
            if (response.ok) {
                const data = await response.json();
                this.documents = data.documents || [];
                this.applyFiltersAndSort();
                this.renderTable();
                this.updatePagination();
            } else {
                throw new Error('Failed to load documents');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            this.showError('خطأ في تحميل الوثائق');
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFiltersAndSort() {
        let filtered = [...this.documents];

        // Apply search filter
        const searchTerm = document.getElementById('documentSearch').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.display_name.toLowerCase().includes(searchTerm) ||
                doc.original_filename.toLowerCase().includes(searchTerm) ||
                (doc.notes && doc.notes.toLowerCase().includes(searchTerm))
            );
        }

        // Apply category filter
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (categoryFilter) {
            filtered = filtered.filter(doc => doc.category === categoryFilter);
        }

        // Apply status filter
        const statusFilter = document.getElementById('statusFilter').value;
        if (statusFilter) {
            filtered = filtered.filter(doc => doc.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];

            if (this.sortField === 'size_bytes') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else if (this.sortField === 'created_at') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }

            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredDocuments = filtered;
    }

    /**
     * Render documents table
     */
    renderTable() {
        const tbody = document.getElementById('documentsTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageDocuments = this.filteredDocuments.slice(startIndex, endIndex);

        if (pageDocuments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                        <p class="text-muted mb-0">لا توجد وثائق</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageDocuments.map(doc => this.createDocumentRow(doc)).join('');

        // Update selection state
        this.updateSelectionUI();
    }

    /**
     * Create document table row
     */
    createDocumentRow(document) {
        const isSelected = this.selectedDocuments.has(document.id);
        const statusBadge = this.getStatusBadge(document.status);
        const categoryName = this.getCategoryName(document.category);
        const fileIcon = this.getFileIconClass(document.mime_type);
        const formattedSize = this.formatFileSize(document.size_bytes);
        const formattedDate = this.formatDate(document.created_at);

        return `
            <tr ${isSelected ? 'class="table-active"' : ''}>
                <td>
                    <input type="checkbox" class="form-check-input document-checkbox"
                           data-doc-id="${document.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="${fileIcon} me-2"></i>
                        <div>
                            <div class="fw-bold">${document.display_name}</div>
                            <small class="text-muted">${document.original_filename}</small>
                        </div>
                    </div>
                </td>
                <td>${categoryName}</td>
                <td>${formattedSize}</td>
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" data-action="preview" data-document-id="${document.id}"
                                title="معاينة">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" data-action="download" data-document-id="${document.id}"
                                title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-action="edit" data-document-id="${document.id}"
                                title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" data-action="delete" data-document-id="${document.id}"
                                title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Update pagination
     */
    updatePagination() {
        const totalPages = Math.ceil(this.filteredDocuments.length / this.itemsPerPage);
        const pagination = document.getElementById('documentsPagination');

        // Update showing info
        const startIndex = this.filteredDocuments.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredDocuments.length);

        document.getElementById('showingFrom').textContent = startIndex;
        document.getElementById('showingTo').textContent = endIndex;
        document.getElementById('totalDocuments').textContent = this.filteredDocuments.length;

        // Generate pagination buttons
        let paginationHTML = '';

        if (totalPages > 1) {
            // Previous button
            paginationHTML += `
                <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-action="goto-page" data-page="${this.currentPage - 1}">السابق</a>
                </li>
            `;

            // Page numbers (show max 5 pages)
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);

            for (let i = startPage; i <= endPage; i++) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-action="goto-page" data-page="${i}">${i}</a>
                    </li>
                `;
            }

            // Next button
            paginationHTML += `
                <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-action="goto-page" data-page="${this.currentPage + 1}">التالي</a>
                </li>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredDocuments.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.updatePagination();
        }
    }

    /**
     * Update selection UI
     */
    updateSelectionUI() {
        const selectedCount = this.selectedDocuments.size;
        const downloadBtn = document.getElementById('downloadSelectedBtn');
        const deleteBtn = document.getElementById('deleteSelectedBtn');

        downloadBtn.disabled = selectedCount === 0;
        deleteBtn.disabled = selectedCount === 0;

        if (selectedCount > 0) {
            downloadBtn.innerHTML = `<i class="fas fa-download"></i> تحميل (${selectedCount})`;
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i> حذف (${selectedCount})`;
        } else {
            downloadBtn.innerHTML = `<i class="fas fa-download"></i> تحميل المحدد`;
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i> حذف المحدد`;
        }

        // Update select all checkbox
        const allCheckboxes = document.querySelectorAll('.document-checkbox');
        const selectAllCheckbox = document.getElementById('selectAll');

        if (allCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    /**
     * Update sort icons
     */
    updateSortIcons() {
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort text-muted';
        });

        const currentHeader = document.querySelector(`[data-sort="${this.sortField}"] i`);
        if (currentHeader) {
            currentHeader.className = this.sortOrder === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary';
        }
    }

    /**
     * Action methods
     */
    async previewDocument(documentId) {
        try {
            // Get document info first
            const response = await fetch(`/api/documents/${documentId}/info`);
            if (!response.ok) {
                throw new Error('Failed to load document info');
            }
            
            const doc = await response.json();
            
            // Show preview modal
            const previewModal = new bootstrap.Modal(document.getElementById('documentPreviewModal'));
            
            // Set modal title
            document.getElementById('previewModalTitle').innerHTML = `
                <i class="fas fa-eye text-primary"></i>
                معاينة: ${doc.display_name}
            `;
            
            // Create preview content based on file type
            const previewContent = this.createPreviewContent(documentId, doc);
            document.getElementById('documentPreviewContent').innerHTML = previewContent;
            
            // Setup download button in preview
            const downloadFromPreviewBtn = document.getElementById('downloadFromPreviewBtn');
            if (downloadFromPreviewBtn) {
                downloadFromPreviewBtn.onclick = () => this.downloadDocument(documentId);
            }
            
            // Show the modal
            previewModal.show();
            
        } catch (error) {
            console.error('Error previewing document:', error);
            // Fallback to opening in new tab
            window.open(`/api/documents/preview/${documentId}`, '_blank');
        }
    }

    /**
     * Create preview content based on file type
     */
    createPreviewContent(documentId, doc) {
        const fileExtension = doc.original_filename.split('.').pop().toLowerCase();
        const previewUrl = `/api/documents/preview/${documentId}`;
        
        switch (fileExtension) {
            case 'pdf':
                return `
                    <div class="pdf-preview">
                        <iframe src="${previewUrl}" 
                                style="width: 100%; height: 500px; border: none;">
                        </iframe>
                        <div class="text-center mt-2">
                            <small class="text-muted">PDF - ${doc.original_filename}</small>
                        </div>
                    </div>
                `;
            
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return `
                    <div class="image-preview text-center">
                        <img src="${previewUrl}" 
                             alt="${doc.display_name}"
                             class="img-fluid rounded shadow-sm"
                             style="max-height: 500px;">
                        <div class="mt-2">
                            <small class="text-muted">صورة - ${doc.original_filename}</small>
                        </div>
                    </div>
                `;
            
            case 'txt':
            case 'csv':
                return `
                    <div class="text-preview">
                        <iframe src="${previewUrl}" 
                                style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 4px;">
                        </iframe>
                        <div class="text-center mt-2">
                            <small class="text-muted">ملف نصي - ${doc.original_filename}</small>
                        </div>
                    </div>
                `;
            
            default:
                return `
                    <div class="unsupported-preview text-center py-5">
                        <div class="mb-4">
                            <i class="fas fa-file-alt fa-4x text-muted"></i>
                        </div>
                        <h5>لا يمكن معاينة هذا النوع من الملفات</h5>
                        <p class="text-muted">${doc.original_filename}</p>
                        <button type="button" class="btn btn-primary" onclick="window.documentsManager.downloadDocument('${documentId}')">
                            <i class="fas fa-download"></i> تحميل الملف
                        </button>
                    </div>
                `;
        }
    }

    async downloadDocument(documentId) {
        window.open(`/api/documents/download/${documentId}`, '_blank');
    }

    async editDocument(documentId) {
        try {
            // Get document info first
            const response = await fetch(`/api/documents/${documentId}/info`);
            if (!response.ok) {
                throw new Error('Failed to load document info');
            }
            
            const doc = await response.json();
            
            // Populate edit form
            document.getElementById('editDocumentId').value = documentId;
            document.getElementById('editDisplayName').value = doc.display_name || '';
            
            // Set category if exists
            const categorySelect = document.getElementById('editCategory');
            if (categorySelect) {
                categorySelect.value = doc.category || 'other';
            }
            
            // Set status if exists
            const statusSelect = document.getElementById('editStatus');
            if (statusSelect) {
                statusSelect.value = doc.status || 'active';
            }
            
            // Set expiry date if exists
            const expiryDateInput = document.getElementById('editExpiryDate');
            if (expiryDateInput && doc.expiry_date) {
                expiryDateInput.value = doc.expiry_date;
            }
            
            // Set notes if exists
            const notesInput = document.getElementById('editNotes');
            if (notesInput) {
                notesInput.value = doc.notes || '';
            }
            
            // Show edit modal
            const editModal = new bootstrap.Modal(document.getElementById('editDocumentModal'));
            editModal.show();
            
            // Setup form submit handler
            this.setupEditFormHandler();
            
        } catch (error) {
            console.error('Error loading document for edit:', error);
            showError('خطأ في تحميل بيانات الوثيقة للتعديل');
        }
    }

    /**
     * Setup edit form submit handler
     */
    setupEditFormHandler() {
        const form = document.getElementById('editDocumentForm');
        if (!form) return;
        
        // Remove existing handlers to prevent duplicates
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(newForm);
            const documentId = formData.get('document_id');
            
            if (!documentId) {
                showError('معرف الوثيقة غير صحيح');
                return;
            }
            
            try {
                const updateData = {
                    display_name: formData.get('display_name'),
                    category: formData.get('category'),
                    status: formData.get('status'),
                    expiry_date: formData.get('expiry_date'),
                    notes: formData.get('notes')
                };
                
                const response = await fetch(`/api/documents/${documentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('meta[name=csrf-token]')?.getAttribute('content')
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update document');
                }
                
                const result = await response.json();
                showSuccess(result.message || 'تم تحديث الوثيقة بنجاح');
                
                // Close edit modal
                bootstrap.Modal.getInstance(document.getElementById('editDocumentModal')).hide();
                
                // Refresh documents display
                if (window.documentsManager && typeof window.documentsManager.loadDocuments === 'function') {
                    await window.documentsManager.loadDocuments();
                }
                
                // If document details modal is open, refresh it
                const detailsModal = document.getElementById('documentDetailsModal');
                if (detailsModal && detailsModal.classList.contains('show')) {
                    await this.showDocumentDetails(documentId);
                }
                
            } catch (error) {
                console.error('Error updating document:', error);
                showError('خطأ في تحديث الوثيقة: ' + error.message);
            }
        });
    }

    async deleteDocument(documentId) {
        const confirmed = await showConfirm('هل تريد حذف هذه الوثيقة؟\n\nلا يمكن التراجع عن هذا الإجراء.');
        if (confirmed) {
            try {
                const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
                if (response.ok) {
                    const result = await response.json();
                    showSuccess(result.message || 'تم حذف الوثيقة بنجاح');
                    
                    // Immediately remove from DOM to prevent ghost artifacts
                    const documentElements = document.querySelectorAll(`[data-document-id="${documentId}"]`);
                    documentElements.forEach(element => {
                        element.remove();
                    });
                    
                    // Clean up references
                    this.selectedDocuments.delete(documentId);
                    
                    // Emit cleanup event
                    document.dispatchEvent(new CustomEvent('documentDeleted', {
                        detail: { documentId: documentId }
                    }));
                    
                    // Close details modal if open
                    const detailsModal = document.getElementById('documentDetailsModal');
                    if (detailsModal && detailsModal.classList.contains('show')) {
                        bootstrap.Modal.getInstance(detailsModal).hide();
                    }
                    
                    this.loadDocuments(); // Reload documents

                    // Refresh main page counts
                    if (documentsManager) {
                        documentsManager.loadDocumentStats();
                    }
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete document');
                }
            } catch (error) {
                console.error('Error deleting document:', error);
                showError('خطأ في حذف الوثيقة: ' + error.message);
            }
        }
    }

    async uploadDocument() {
        // This will be implemented in T10 - Upload Interface
        showInfo('رفع وثيقة جديدة\n\nسيتم تنفيذ هذه الميزة في المرحلة التالية.');
    }

    async downloadSelected() {
        const selected = Array.from(this.selectedDocuments);
        if (selected.length === 0) return;

        if (selected.length === 1) {
            this.downloadDocument(selected[0]);
        } else {
            try {
                // Show loading state
                const downloadBtn = document.getElementById('downloadSelectedBtn');
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحضير...';
                downloadBtn.disabled = true;

                // Use bulk download functionality
                await BulkOperations.downloadAsZip(selected);

                // Reset button
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;

                // Clear selection after successful download
                this.selectedDocuments.clear();
                this.updateSelectionUI();

            } catch (error) {
                // Reset button on error
                const downloadBtn = document.getElementById('downloadSelectedBtn');
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> تحميل المحدد';
                downloadBtn.disabled = false;

                console.error('Bulk download failed:', error);
            }
        }
    }

    async deleteSelected() {
        const selected = Array.from(this.selectedDocuments);
        if (selected.length === 0) return;

        const confirmed = await showConfirm(`هل تريد حذف ${selected.length} وثيقة؟\n\nلا يمكن التراجع عن هذا الإجراء.`);
        if (confirmed) {
            try {
                const response = await fetch('/api/documents/bulk', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ document_ids: selected })
                });

                if (response.ok) {
                    const result = await response.json();
                    showSuccess(result.message);
                    this.selectedDocuments.clear();
                    this.loadDocuments(); // Reload documents

                    // Refresh main page counts
                    if (documentsManager) {
                        documentsManager.loadDocumentStats();
                    }
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete documents');
                }
            } catch (error) {
                console.error('Error deleting documents:', error);
                showError('خطأ في حذف الوثائق: ' + error.message);
            }
        }
    }

    /**
     * Helper methods
     */
    getStatusBadge(status) {
        const statusMap = {
            'active': '<span class="badge bg-success">نشط</span>',
            'expired': '<span class="badge bg-danger">منتهي</span>',
            'pending_renewal': '<span class="badge bg-warning">في انتظار التجديد</span>'
        };
        return statusMap[status] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    getCategoryName(category) {
        const categoryMap = {
            'id_copy': 'نسخة الهوية',
            'license': 'رخصة القيادة',
            'insurance': 'التأمين',
            'contract': 'العقد',
            'maintenance': 'الصيانة',
            'other': 'أخرى'
        };
        return categoryMap[category] || 'غير محدد';
    }

    showLoading() {
        const tbody = document.getElementById('documentsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="text-muted mt-2 mb-0">جاري تحميل الوثائق...</p>
                </td>
            </tr>
        `;
    }

    showError(message) {
        const tbody = document.getElementById('documentsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger mb-2">${message}</p>
                    <button class="btn btn-primary btn-sm" data-action="reload-documents">
                        <i class="fas fa-sync-alt"></i> إعادة المحاولة
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Upload Modal Class
 * فئة نافذة رفع الوثائق
 */
class UploadModal {
    constructor() {
        this.selectedFiles = [];
        this.currentEntityType = null;
        this.currentEntityId = null;
        this.isUploading = false;

        this.initializeUpload();
    }

    /**
     * Initialize upload functionality
     */
    initializeUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // Check if elements exist before adding event listeners
        if (!uploadArea || !fileInput) {
            console.warn('Upload elements not found in DOM, deferring initialization...');
            return;
        }

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.uploadFiles();
        });

        // Click to select files
        uploadArea.addEventListener('click', (e) => {
            if (!this.isUploading && e.target === uploadArea) {
                fileInput.click();
            }
        });

        // Select files button (CSP-compliant event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="select-files"]')) {
                e.preventDefault();
                fileInput.click();
            }
        });
    }

    /**
     * Show upload modal
     */
    show(entityType = null, entityId = null) {
        this.currentEntityType = entityType;
        this.currentEntityId = entityId;

        // Try to reinitialize upload functionality now that modal exists
        this.initializeUpload();

        // Set entity info
        const entityTypeInput = document.getElementById('entityType');
        const entityIdInput = document.getElementById('entityId');
        
        if (entityTypeInput) entityTypeInput.value = entityType || 'other';
        if (entityIdInput) entityIdInput.value = entityId || '';

        // Reset form
        this.resetForm();

        // Show modal
        const modalElement = document.getElementById('uploadModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Upload modal element not found');
            showError('خطأ في تهيئة نافذة الرفع');
        }
    }

    /**
     * Reset upload form
     */
    resetForm() {
        this.selectedFiles = [];
        this.isUploading = false;

        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Hide sections
        const filesPreview = document.getElementById('filesPreview');
        if (filesPreview) {
            filesPreview.style.display = 'none';
        }
        
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
        
        const metadataForm = document.getElementById('metadataForm');
        if (metadataForm) {
            metadataForm.style.display = 'none';
        }

        // Reset form fields with null checks
        const displayName = document.getElementById('displayName');
        if (displayName) {
            displayName.value = '';
        }
        
        const category = document.getElementById('category');
        if (category) {
            category.value = '';
        }
        
        const status = document.getElementById('status');
        if (status) {
            status.value = 'active';
        }
        
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.value = '';
        }
        
        const notes = document.getElementById('notes');
        if (notes) {
            notes.value = '';
        }

        // Reset upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }

        // Remove validation classes
        document.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    /**
     * Handle selected files
     */
    handleFiles(files) {
        this.selectedFiles = [];

        Array.from(files).forEach(file => {
            const validation = this.validateFile(file);
            this.selectedFiles.push({
                file: file,
                valid: validation.valid,
                error: validation.error
            });
        });

        this.renderFilePreview();
        this.updateUploadButton();

        if (this.selectedFiles.length > 0) {
            this.showMetadataForm();

            // Auto-fill display name if single file
            if (this.selectedFiles.length === 1) {
                const fileName = this.selectedFiles[0].file.name;
                const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
                document.getElementById('displayName').value = nameWithoutExt;
            }
        }
    }

    /**
     * Validate file
     */
    validateFile(file) {
        const maxSize = 15 * 1024 * 1024; // 15MB
        const allowedTypes = [
            'application/pdf',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'نوع الملف غير مدعوم' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: 'حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)' };
        }

        return { valid: true, error: null };
    }

    /**
     * Render file preview
     */
    renderFilePreview() {
        const preview = document.getElementById('filesPreview');
        const filesList = document.getElementById('filesList');

        if (this.selectedFiles.length === 0) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        filesList.innerHTML = this.selectedFiles.map((fileObj, index) =>
            this.createFilePreview(fileObj, index)
        ).join('');
    }

    /**
     * Create file preview HTML
     */
    createFilePreview(fileObj, index) {
        const { file, valid, error } = fileObj;
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        const statusIcon = valid ?
            '<i class="fas fa-check-circle file-status valid"></i>' :
            '<i class="fas fa-exclamation-circle file-status invalid"></i>';

        return `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon ${fileIcon.class}">
                        <i class="${fileIcon.icon}"></i>
                    </div>
                    <div class="file-details">
                        <h6>${file.name}</h6>
                        <div class="file-size">${fileSize}</div>
                        ${error ? `<div class="invalid-feedback">${error}</div>` : ''}
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    ${statusIcon}
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            data-action="remove-file" data-file-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get file icon
     */
    getFileIcon(mimeType) {
        if (mimeType === 'application/pdf') {
            return { class: 'pdf', icon: 'fas fa-file-pdf' };
        } else if (mimeType.startsWith('image/')) {
            return { class: 'image', icon: 'fas fa-image' };
        } else if (mimeType.includes('word')) {
            return { class: 'document', icon: 'fas fa-file-word' };
        } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
            return { class: 'spreadsheet', icon: 'fas fa-file-excel' };
        } else {
            return { class: 'document', icon: 'fas fa-file' };
        }
    }

    /**
     * Remove file from selection
     */
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFilePreview();
        this.updateUploadButton();

        if (this.selectedFiles.length === 0) {
            document.getElementById('metadataForm').style.display = 'none';
        }
    }

    /**
     * Show metadata form
     */
    showMetadataForm() {
        document.getElementById('metadataForm').style.display = 'block';
    }

    /**
     * Update upload button state
     */
    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        const validFiles = this.selectedFiles.filter(f => f.valid);

        uploadBtn.disabled = validFiles.length === 0 || this.isUploading;

        if (validFiles.length > 0) {
            uploadBtn.innerHTML = `<i class="fas fa-upload"></i> رفع ${validFiles.length} وثيقة`;
        } else {
            uploadBtn.innerHTML = `<i class="fas fa-upload"></i> رفع الوثيقة`;
        }
    }

    /**
     * Upload multiple files with comprehensive validation and progress tracking.
     *
     * Handles the complete file upload workflow including validation, progress tracking,
     * error handling, and UI updates. Supports both single and multiple file uploads
     * with Arabic user feedback.
     *
     * @async
     * @method uploadFiles
     * @memberof DocumentsManager
     *
     * @description
     * Upload process workflow:
     * 1. Validates form data and file selection
     * 2. Performs client-side file validation (size, type)
     * 3. Creates FormData for each file with metadata
     * 4. Uploads files sequentially with progress tracking
     * 5. Updates UI with upload progress and results
     * 6. Handles errors with Arabic messages and recovery options
     * 7. Refreshes document lists on successful upload
     *
     * @returns {Promise<void>} Resolves when all uploads complete
     *
     * @throws {Error} Validation errors, network errors, or server errors
     *
     * @fires DocumentsManager#uploadStart - When upload process begins
     * @fires DocumentsManager#uploadProgress - During file upload progress
     * @fires DocumentsManager#uploadComplete - When upload process completes
     * @fires DocumentsManager#uploadError - When upload errors occur
     *
     * @example
     * // Upload selected files
     * await documentsManager.uploadFiles();
     *
     * @since 1.0.0
     */
    async uploadFiles() {
        if (this.isUploading || this.selectedFiles.length === 0) return;

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        const validFiles = this.selectedFiles.filter(f => f.valid);
        if (validFiles.length === 0) {
            showError('لا توجد ملفات صالحة للرفع');
            return;
        }

        this.isUploading = true;
        this.showProgress();

        try {
            const uploadedDocuments = [];
            for (let i = 0; i < validFiles.length; i++) {
                const fileObj = validFiles[i];
                const uploadResponse = await this.uploadSingleFile(fileObj.file, i + 1, validFiles.length);
                if (uploadResponse && uploadResponse.document) {
                    uploadedDocuments.push(uploadResponse.document);
                }
            }

            showSuccess(`تم رفع ${validFiles.length} وثيقة بنجاح`);
            this.closeModal();

            // Auto-redirect to edit form for the last uploaded document if single file upload
            if (uploadedDocuments.length === 1) {
                setTimeout(() => {
                    this.showEditFormForDocument(uploadedDocuments[0]);
                }, 500); // Small delay to ensure modal is closed
            }

            // Refresh parent modal/page
            if (documentModal && documentModal.currentEntityType) {
                documentModal.loadDocuments();
            }
            if (documentsManager) {
                documentsManager.loadDocumentStats();

                // Refresh current tab
                if (documentsManager.currentTab === 'drivers') {
                    documentsManager.loadDrivers();
                } else if (documentsManager.currentTab === 'vehicles') {
                    documentsManager.loadVehicles();
                } else if (documentsManager.currentTab === 'other') {
                    documentsManager.loadOtherDocuments();
                }
            }

            // Refresh entity document manager if on individual entity page
            if (typeof window.refreshEntityDocuments === 'function') {
                window.refreshEntityDocuments();
            }

        } catch (error) {
            console.error('Upload error:', error);
            showError('خطأ في رفع الملفات: ' + error.message);
        } finally {
            this.isUploading = false;
            this.hideProgress();
        }
    }

    /**
     * Validate form
     */
    validateForm() {
        let isValid = true;

        // Validate display name
        const displayName = document.getElementById('displayName');
        if (!displayName.value.trim()) {
            displayName.classList.add('is-invalid');
            isValid = false;
        } else {
            displayName.classList.remove('is-invalid');
            displayName.classList.add('is-valid');
        }

        // Validate category
        const category = document.getElementById('category');
        if (!category.value) {
            category.classList.add('is-invalid');
            isValid = false;
        } else {
            category.classList.remove('is-invalid');
            category.classList.add('is-valid');
        }

        return isValid;
    }

    /**
     * Get CSRF token for secure uploads
     */
    async getCSRFToken() {
        try {
            // Try to get from meta tag first
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                return metaTag.getAttribute('content');
            }

            // Try to get from global API object
            if (window.api && typeof window.api.getCSRFToken === 'function') {
                return window.api.getCSRFToken();
            }

            // Fetch fresh token from API
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            return data.csrf_token;
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
            return null;
        }
    }

    /**
     * Upload single file
     */
    async uploadSingleFile(file, current, total) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', document.getElementById('entityType').value);
        formData.append('entity_id', document.getElementById('entityId').value);
        formData.append('display_name', document.getElementById('displayName').value || file.name);
        formData.append('category', document.getElementById('category').value);
        formData.append('status', document.getElementById('status').value);
        formData.append('expiry_date', document.getElementById('expiryDate').value);
        formData.append('notes', document.getElementById('notes').value);

        // Get CSRF token for secure upload
        const csrfToken = await this.getCSRFToken();
        const headers = {};
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        // Update progress
        const progress = (current / total) * 100;
        this.updateProgress(progress);

        return response.json();
    }

    /**
     * Show upload progress
     */
    showProgress() {
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('uploadArea').classList.add('uploading');
        document.getElementById('uploadBtn').disabled = true;
        this.updateProgress(0);
    }

    /**
     * Hide upload progress
     */
    hideProgress() {
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadArea').classList.remove('uploading');
        this.updateUploadButton();
    }

    /**
     * Update progress bar
     */
    updateProgress(percent) {
        document.getElementById('progressBar').style.width = percent + '%';
        document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
    }

    /**
     * Show edit form for uploaded document
     * عرض نموذج التحرير للوثيقة المرفوعة
     */
    showEditFormForDocument(document) {
        try {
            // Check if we have the document edit functionality available
            if (window.entityDocumentManager && window.entityDocumentManager.showEditForm) {
                // Use entity document manager to show edit form
                window.entityDocumentManager.showEditForm(document.id, document);
            } else if (window.documentModal && window.documentModal.showEditForm) {
                // Use document modal to show edit form
                window.documentModal.showEditForm(document.id, document);
            } else {
                // Fallback: show document details
                console.log('Edit form not available, showing document info:', document);
                showInfo(
                    `تم رفع الوثيقة بنجاح:\n\n` +
                    `الاسم: ${document.display_name}\n` +
                    `الفئة: ${document.category}\n` +
                    `الحجم: ${this.formatFileSize(document.size_bytes)}\n` +
                    `تاريخ الرفع: ${document.uploaded_at}`,
                    'تفاصيل الوثيقة المرفوعة'
                );
            }
        } catch (error) {
            console.error('Error showing edit form:', error);
            showError('خطأ في فتح نموذج التحرير: ' + error.message);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
        if (modal) {
            modal.hide();
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';

        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Update DocumentsManager and DocumentModal to use UploadModal
// Update showUploadModal methods
DocumentsManager.prototype.showUploadModal = function() {
    if (uploadModal) {
        uploadModal.show();
    } else {
        showError('خطأ في تهيئة نافذة الرفع');
    }
};

DocumentModal.prototype.uploadDocument = function() {
    if (uploadModal) {
        uploadModal.show(this.currentEntityType, this.currentEntityId);
    } else {
        showError('خطأ في تهيئة نافذة الرفع');
    }
};

// Initialize documents manager when page loads
let documentsManager;
let documentModal;
let uploadModal;
document.addEventListener('DOMContentLoaded', function() {
    documentsManager = new DocumentsManager();
    documentModal = new DocumentModal();
    uploadModal = new UploadModal();

    // Make instances globally available for debugging and event delegation
    window.documentsManager = documentsManager;
    window.documentModal = documentModal;
    window.uploadModal = uploadModal;
});
