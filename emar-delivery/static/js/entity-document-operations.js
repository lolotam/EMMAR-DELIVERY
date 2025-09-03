/**
 * Entity Document Operations - File Upload, Download, Delete, and Bulk Operations
 * عمليات وثائق الكيانات - رفع وتحميل وحذف الملفات والعمليات المجمعة
 */

// Extend EntityDocumentManager with file operations
Object.assign(EntityDocumentManager.prototype, {

    /**
     * Show upload zone for file selection
     */
    showUploadZone() {
        const uploadZone = document.getElementById('fileUploadZone');
        if (uploadZone) {
            uploadZone.style.display = 'block';
            uploadZone.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Hide upload zone
     */
    hideUploadZone() {
        const uploadZone = document.getElementById('fileUploadZone');
        if (uploadZone) {
            uploadZone.style.display = 'none';
        }
    },

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    },

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Highlight upload area
     */
    highlight(element) {
        element.classList.add('drag-over');
    },

    /**
     * Remove highlight from upload area
     */
    unhighlight(element) {
        element.classList.remove('drag-over');
    },

    /**
     * Handle dropped files
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    },

    /**
     * Handle file selection from input or drag-and-drop
     */
    handleFileSelection(e) {
        const files = e.target.files;
        this.handleFiles(files);
    },

    /**
     * Process selected files
     */
    handleFiles(files) {
        if (this.isUploading) {
            showError('يتم رفع ملفات أخرى حالياً، يرجى الانتظار');
            return;
        }

        const fileArray = Array.from(files);
        
        // Validate files
        const validFiles = this.validateFiles(fileArray);
        if (validFiles.length === 0) {
            return;
        }

        // Show upload progress
        this.showUploadProgress();
        
        // Start upload process
        this.uploadFiles(validFiles);
    },

    /**
     * Validate selected files
     */
    validateFiles(files) {
        const validFiles = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];

        files.forEach(file => {
            // Check file size
            if (file.size > maxSize) {
                showError(`الملف "${file.name}" كبير جداً. الحد الأقصى 10 ميجابايت`);
                return;
            }

            // Check file type
            if (!allowedTypes.includes(file.type)) {
                showError(`نوع الملف "${file.name}" غير مدعوم`);
                return;
            }

            validFiles.push(file);
        });

        return validFiles;
    },

    /**
     * Show upload progress interface
     */
    showUploadProgress() {
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress) {
            uploadProgress.style.display = 'block';
        }
    },

    /**
     * Hide upload progress interface
     */
    hideUploadProgress() {
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
    },

    /**
     * Upload files to server
     */
    async uploadFiles(files) {
        this.isUploading = true;
        const progressList = document.getElementById('progressList');
        
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await this.uploadSingleFile(file, i, progressList);
            }

            // Refresh documents list
            await this.loadDocuments();
            
            // Hide upload interface
            this.hideUploadZone();
            this.hideUploadProgress();
            
            showSuccess(`تم رفع ${files.length} ملف بنجاح`);
            
        } catch (error) {
            console.error('Upload error:', error);
            showError('خطأ في رفع الملفات');
        } finally {
            this.isUploading = false;
        }
    },

    /**
     * Upload a single file
     */
    async uploadSingleFile(file, index, progressContainer) {
        const progressId = `progress-${index}`;
        
        // Create progress item
        const progressItem = document.createElement('div');
        progressItem.className = 'upload-progress-item';
        progressItem.id = progressId;
        progressItem.innerHTML = `
            <div class="progress-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
            <div class="progress-status">جاري الرفع...</div>
        `;
        progressContainer.appendChild(progressItem);

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', this.entityType);
        formData.append('entity_id', this.entityId);
        formData.append('category', 'other'); // Default category, can be changed later
        formData.append('display_name', file.name.split('.')[0]); // Use filename without extension as display name

        try {
            // Upload with progress tracking
            const response = await this.uploadWithProgress(formData, progressId);

            // Check XMLHttpRequest status (not response.ok which is for Fetch API)
            if (response.status >= 200 && response.status < 300) {
                this.updateProgressStatus(progressId, 'تم الرفع بنجاح', 'success');
            } else {
                throw new Error(`Upload failed with status ${response.status}`);
            }
        } catch (error) {
            this.updateProgressStatus(progressId, 'فشل في الرفع', 'error');
            throw error;
        }
    },

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
    },

    /**
     * Upload with progress tracking
     */
    async uploadWithProgress(formData, progressId) {
        // Get CSRF token for secure upload
        const csrfToken = await this.getCSRFToken();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.updateProgressBar(progressId, percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.open('POST', '/api/documents/upload');

            // Add CSRF token header if available
            if (csrfToken) {
                xhr.setRequestHeader('X-CSRFToken', csrfToken);
            }

            xhr.send(formData);
        });
    },

    /**
     * Update progress bar
     */
    updateProgressBar(progressId, percent) {
        const progressItem = document.getElementById(progressId);
        if (progressItem) {
            const progressBar = progressItem.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${percent}%`;
                progressBar.setAttribute('aria-valuenow', percent);
            }
        }
    },

    /**
     * Update progress status
     */
    updateProgressStatus(progressId, status, type = 'info') {
        const progressItem = document.getElementById(progressId);
        if (progressItem) {
            const statusElement = progressItem.querySelector('.progress-status');
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `progress-status ${type}`;
            }
        }
    },

    /**
     * Preview document
     */
    async previewDocument(documentId) {
        try {
            window.open(`/api/documents/preview/${documentId}`, '_blank');
        } catch (error) {
            console.error('Preview error:', error);
            showError('خطأ في معاينة الوثيقة');
        }
    },

    /**
     * Download single document
     */
    async downloadDocument(documentId) {
        try {
            window.open(`/api/documents/download/${documentId}`, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            showError('خطأ في تحميل الوثيقة');
        }
    },

    /**
     * Delete single document
     */
    async deleteDocument(documentId) {
        const document = this.documents.find(doc => doc.id === documentId);
        if (!document) return;

        const confirmed = await this.showDeleteConfirmation(document.display_name || document.original_filename);
        if (!confirmed) return;

        try {
            // Get CSRF token
            const csrfToken = await this.getCSRFToken();

            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                // Remove from local arrays
                this.documents = this.documents.filter(doc => doc.id !== documentId);
                this.filteredDocuments = this.filteredDocuments.filter(doc => doc.id !== documentId);
                this.selectedDocuments.delete(documentId);

                // Clear cache
                this.clearCache();

                // Re-render
                this.renderDocuments();
                this.updateSelectionUI();

                showSuccess('تم حذف الوثيقة بنجاح');
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showError('خطأ في حذف الوثيقة');
        }
    },

    /**
     * Get CSRF token for API requests
     */
    async getCSRFToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                return data.csrf_token;
            } else {
                console.error('Failed to get CSRF token:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error getting CSRF token:', error);
            return null;
        }
    },

    /**
     * Show delete confirmation dialog
     */
    showDeleteConfirmation(fileName) {
        return new Promise((resolve) => {
            const confirmed = confirm(`هل أنت متأكد من حذف الوثيقة "${fileName}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`);
            resolve(confirmed);
        });
    }
});
