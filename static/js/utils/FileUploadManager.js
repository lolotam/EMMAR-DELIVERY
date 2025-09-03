/**
 * FileUploadManager - Unified File Upload Utility
 * Eliminates code duplication across multiple file upload implementations
 * 
 * Usage:
 * const manager = new FileUploadManager();
 * await manager.uploadFile(file, '/api/upload', { entity_type: 'driver', entity_id: 'd001' });
 */

class FileUploadManager {
    constructor() {
        this.ALLOWED_TYPES = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            document: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            any: ['*/*']
        };
        
        this.MAX_SIZES = {
            image: 5 * 1024 * 1024,      // 5MB
            document: 10 * 1024 * 1024,  // 10MB
            any: 15 * 1024 * 1024        // 15MB
        };
        
        this.ERROR_MESSAGES = {
            'invalid_type': 'نوع الملف غير مدعوم',
            'file_too_large': 'حجم الملف كبير جداً',
            'upload_failed': 'فشل في رفع الملف',
            'network_error': 'خطأ في الاتصال بالشبكة',
            'no_file': 'لم يتم اختيار ملف',
            'server_error': 'خطأ في الخادم'
        };
    }
    
    /**
     * Validate file type and size
     * @param {File} file - The file to validate
     * @param {string} type - File type category ('image', 'document', 'any')
     * @returns {Object} - Validation result with success flag and error message
     */
    validateFile(file, type = 'image') {
        if (!file) {
            return {
                success: false,
                error: this.ERROR_MESSAGES.no_file
            };
        }
        
        const allowedTypes = this.ALLOWED_TYPES[type] || this.ALLOWED_TYPES.any;
        const maxSize = this.MAX_SIZES[type] || this.MAX_SIZES.any;
        
        // Check file type
        if (!allowedTypes.includes('*/*') && !allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: `${this.ERROR_MESSAGES.invalid_type}. الأنواع المسموحة: ${allowedTypes.join(', ')}`
            };
        }
        
        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
            return {
                success: false,
                error: `${this.ERROR_MESSAGES.file_too_large}. الحد الأقصى: ${maxSizeMB} ميجابايت`
            };
        }
        
        return { success: true };
    }
    
    /**
     * Create FormData object with file and metadata
     * @param {File} file - The file to upload
     * @param {Object} metadata - Additional metadata to include
     * @returns {FormData} - Prepared FormData object
     */
    createFormData(file, metadata = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add metadata
        Object.entries(metadata).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
        
        return formData;
    }
    
    /**
     * Upload file with progress tracking
     * @param {File} file - The file to upload
     * @param {string} endpoint - Upload endpoint URL
     * @param {Object} options - Upload options
     * @returns {Promise} - Upload promise with progress tracking
     */
    async uploadFile(file, endpoint, options = {}) {
        const {
            metadata = {},
            fileType = 'image',
            onProgress = null,
            onSuccess = null,
            onError = null
        } = options;
        
        try {
            // Validate file
            const validation = this.validateFile(file, fileType);
            if (!validation.success) {
                const error = new Error(validation.error);
                if (onError) onError(error);
                throw error;
            }
            
            // Create FormData
            const formData = this.createFormData(file, metadata);
            
            // Create XMLHttpRequest for progress tracking
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                // Progress tracking
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = (event.loaded / event.total) * 100;
                            onProgress(percentComplete);
                        }
                    });
                }
                
                // Success handler
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (onSuccess) onSuccess(response);
                            resolve(response);
                        } catch (parseError) {
                            const error = new Error('خطأ في تحليل استجابة الخادم');
                            if (onError) onError(error);
                            reject(error);
                        }
                    } else {
                        const error = new Error(this.getErrorMessage(xhr.status, xhr.responseText));
                        if (onError) onError(error);
                        reject(error);
                    }
                });
                
                // Error handler
                xhr.addEventListener('error', () => {
                    const error = new Error(this.ERROR_MESSAGES.network_error);
                    if (onError) onError(error);
                    reject(error);
                });
                
                // Add CSRF token if available
                const csrfToken = this.getCSRFToken();
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRFToken', csrfToken);
                }
                
                // Send request
                xhr.open('POST', endpoint);
                xhr.send(formData);
            });
            
        } catch (error) {
            if (onError) onError(error);
            throw error;
        }
    }
    
    /**
     * Upload multiple files
     * @param {FileList|Array} files - Files to upload
     * @param {string} endpoint - Upload endpoint URL
     * @param {Object} options - Upload options
     * @returns {Promise} - Promise that resolves when all uploads complete
     */
    async uploadMultipleFiles(files, endpoint, options = {}) {
        const {
            concurrent = 3,
            onFileProgress = null,
            onOverallProgress = null
        } = options;
        
        const fileArray = Array.from(files);
        const results = [];
        let completed = 0;
        
        // Process files in batches
        for (let i = 0; i < fileArray.length; i += concurrent) {
            const batch = fileArray.slice(i, i + concurrent);
            
            const batchPromises = batch.map(async (file, index) => {
                const globalIndex = i + index;
                
                try {
                    const result = await this.uploadFile(file, endpoint, {
                        ...options,
                        onProgress: (progress) => {
                            if (onFileProgress) {
                                onFileProgress(globalIndex, progress);
                            }
                        }
                    });
                    
                    completed++;
                    if (onOverallProgress) {
                        onOverallProgress((completed / fileArray.length) * 100);
                    }
                    
                    return { success: true, file, result };
                } catch (error) {
                    completed++;
                    if (onOverallProgress) {
                        onOverallProgress((completed / fileArray.length) * 100);
                    }
                    
                    return { success: false, file, error };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }
    
    /**
     * Get CSRF token from meta tag or API
     * @returns {string|null} - CSRF token or null if not found
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
     * Get appropriate error message based on HTTP status
     * @param {number} status - HTTP status code
     * @param {string} responseText - Response text
     * @returns {string} - Arabic error message
     */
    getErrorMessage(status, responseText) {
        try {
            const response = JSON.parse(responseText);
            if (response.error) {
                return response.error;
            }
        } catch (e) {
            // Continue with status-based messages
        }
        
        switch (status) {
            case 400:
                return 'طلب غير صحيح';
            case 401:
                return 'انتهت صلاحية الجلسة';
            case 403:
                return 'غير مصرح لك برفع الملفات';
            case 413:
                return this.ERROR_MESSAGES.file_too_large;
            case 415:
                return this.ERROR_MESSAGES.invalid_type;
            case 429:
                return 'تم تجاوز الحد المسموح من الطلبات';
            case 500:
                return this.ERROR_MESSAGES.server_error;
            default:
                return this.ERROR_MESSAGES.upload_failed;
        }
    }
    
    /**
     * Create file input element with drag and drop support
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} - File input container element
     */
    createFileInput(options = {}) {
        const {
            accept = 'image/*',
            multiple = false,
            dragAndDrop = true,
            placeholder = 'اختر ملف أو اسحبه هنا',
            onFileSelect = null
        } = options;
        
        const container = document.createElement('div');
        container.className = 'file-upload-container';
        container.style.cssText = `
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.3s ease;
        `;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';
        
        const label = document.createElement('label');
        label.textContent = placeholder;
        label.style.cssText = `
            display: block;
            cursor: pointer;
            color: #666;
        `;
        
        container.appendChild(input);
        container.appendChild(label);
        
        // Click to select files
        container.addEventListener('click', () => input.click());
        
        // File selection handler
        input.addEventListener('change', (event) => {
            if (onFileSelect && event.target.files.length > 0) {
                onFileSelect(event.target.files);
            }
        });
        
        // Drag and drop support
        if (dragAndDrop) {
            container.addEventListener('dragover', (event) => {
                event.preventDefault();
                container.style.borderColor = '#007bff';
            });
            
            container.addEventListener('dragleave', () => {
                container.style.borderColor = '#ddd';
            });
            
            container.addEventListener('drop', (event) => {
                event.preventDefault();
                container.style.borderColor = '#ddd';
                
                if (onFileSelect && event.dataTransfer.files.length > 0) {
                    onFileSelect(event.dataTransfer.files);
                }
            });
        }
        
        return container;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
} else {
    window.FileUploadManager = FileUploadManager;
}
