/**
 * Entity Document Manager - Individual Driver/Vehicle Document Management
 * مدير وثائق الكيانات - إدارة وثائق السائقين والمركبات الفردية
 */

class EntityDocumentManager {
    constructor(entityType, entityId, entityInfo) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityInfo = entityInfo;
        
        // State management
        this.documents = [];
        this.filteredDocuments = [];
        this.selectedDocuments = new Set();
        this.currentView = 'grid'; // 'grid' or 'list'
        this.isUploading = false;
        
        // Filters and search
        this.searchQuery = '';
        this.categoryFilter = '';
        this.statusFilter = '';
        
        // Performance optimization
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize the entity document manager
     */
    async initialize() {
        try {
            console.log(`🚀 Initializing EntityDocumentManager for ${this.entityType}:${this.entityId}`);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load documents
            await this.loadDocuments();
            
            // Setup drag and drop
            this.setupDragAndDrop();
            
            console.log('✅ EntityDocumentManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing EntityDocumentManager:', error);
            showError('خطأ في تهيئة مدير الوثائق');
        }
    }

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
    }

    /**
     * Setup event listeners for the document management interface
     */
    setupEventListeners() {
        // Upload button
        const uploadBtn = document.getElementById('uploadEntityDocBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadZone());
        }

        // View toggle buttons
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => this.switchView('grid'));
        }
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.switchView('list'));
        }

        // Search and filter inputs
        const searchInput = document.getElementById('fileSearchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.applyFilters();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.categoryFilter = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.applyFilters();
            });
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => fileInput?.click());
        }

        // Bulk action buttons
        const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
        const bulkDownloadSelectedBtn = document.getElementById('bulkDownloadSelectedBtn');
        const bulkDeleteSelectedBtn = document.getElementById('bulkDeleteSelectedBtn');
        const exportListBtn = document.getElementById('exportListBtn');

        if (bulkDownloadBtn) {
            bulkDownloadBtn.addEventListener('click', () => this.downloadAllDocuments());
        }
        if (bulkDownloadSelectedBtn) {
            bulkDownloadSelectedBtn.addEventListener('click', () => this.downloadSelectedDocuments());
        }
        if (bulkDeleteSelectedBtn) {
            bulkDeleteSelectedBtn.addEventListener('click', () => this.deleteSelectedDocuments());
        }
        if (exportListBtn) {
            exportListBtn.addEventListener('click', () => this.exportDocumentList());
        }

        // Document action buttons (delegated event listeners)
        document.addEventListener('click', (e) => {
            const actionButton = e.target.closest('button[data-action]');
            if (actionButton) {
                const action = actionButton.getAttribute('data-action');
                const documentId = actionButton.getAttribute('data-document-id');

                // Handle document-specific actions
                if (action && documentId && actionButton.closest('#filesGrid, #filesList')) {
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
                        default:
                            console.warn(`Unknown document action: ${action}`);
                    }
                }
                // Handle general actions
                else if (action) {
                    switch (action) {
                        case 'reload-documents':
                            this.loadDocuments();
                            break;
                        case 'show-upload-zone':
                            this.showUploadZone();
                            break;
                        case 'save-document-changes':
                            const documentId = actionButton.getAttribute('data-document-id');
                            if (documentId) {
                                this.saveDocumentChanges(documentId);
                            } else {
                                console.error('No document ID provided for save action');
                            }
                            break;
                        default:
                            console.warn(`Unknown general action: ${action}`);
                    }
                }
            }
        });
    }

    /**
     * Refresh documents by clearing cache and reloading
     * تحديث الوثائق عبر مسح الذاكرة المؤقتة وإعادة التحميل
     */
    async refreshDocuments() {
        try {
            // Clear cache to force fresh data
            const cacheKey = `${this.entityType}_${this.entityId}_documents`;
            this.cache.delete(cacheKey);

            // Reload documents
            await this.loadDocuments();

            console.log(`🔄 Documents refreshed for ${this.entityType}:${this.entityId}`);
        } catch (error) {
            console.error('❌ Error refreshing documents:', error);
            await ErrorHandler.handleAPIError(error, 'Refresh Documents');
        }
    }

    /**
     * Load documents for the current entity with caching and retry logic
     */
    async loadDocuments() {
        try {
            const grid = document.getElementById('filesGrid');
            this.showLoadingState(grid);

            // Check cache first
            const cacheKey = `${this.entityType}_${this.entityId}_documents`;
            const cachedData = this.getFromCache(cacheKey);

            if (cachedData) {
                this.documents = cachedData;
                this.applyFilters();
                this.renderDocuments();
                UXUtils.announceToScreenReader(`تم تحميل ${this.documents.length} وثيقة من الذاكرة المؤقتة`);
                return;
            }

            // Fetch documents with retry logic
            const response = await ErrorHandler.retryWithBackoff(async () => {
                return fetch(`/api/documents/entity/${this.entityType}/${this.entityId}`);
            });

            if (response.ok) {
                const data = await response.json();
                this.documents = data.documents || [];

                // Cache the data
                this.setCache(cacheKey, this.documents);

                this.applyFilters();
                this.renderDocuments();
                UXUtils.announceToScreenReader(`تم تحميل ${this.documents.length} وثيقة`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            await ErrorHandler.handleAPIError(error, 'Load Entity Documents');
            this.showErrorState('خطأ في تحميل الوثائق');
            UXUtils.announceToScreenReader('خطأ في تحميل الوثائق');
        }
    }

    /**
     * Apply search and filter criteria
     */
    applyFilters() {
        this.filteredDocuments = this.documents.filter(doc => {
            // Search filter
            if (this.searchQuery) {
                const searchLower = this.searchQuery.toLowerCase();
                const matchesSearch = 
                    (doc.display_name || '').toLowerCase().includes(searchLower) ||
                    (doc.original_filename || '').toLowerCase().includes(searchLower) ||
                    (doc.notes || '').toLowerCase().includes(searchLower);
                
                if (!matchesSearch) return false;
            }

            // Category filter
            if (this.categoryFilter && doc.category !== this.categoryFilter) {
                return false;
            }

            // Status filter
            if (this.statusFilter) {
                if (this.statusFilter === 'expired' && !this.isDocumentExpired(doc)) {
                    return false;
                }
                if (this.statusFilter === 'expiring' && !this.isDocumentExpiring(doc)) {
                    return false;
                }
                if (this.statusFilter === 'active' && (this.isDocumentExpired(doc) || this.isDocumentExpiring(doc))) {
                    return false;
                }
            }

            return true;
        });

        // Update UI
        this.updateFilterResults();
    }

    /**
     * Check if document is expired
     */
    isDocumentExpired(doc) {
        if (!doc.expiry_date) return false;
        return new Date(doc.expiry_date) < new Date();
    }

    /**
     * Check if document is expiring soon (within 30 days)
     */
    isDocumentExpiring(doc) {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }

    /**
     * Update filter results display
     */
    updateFilterResults() {
        const totalCount = this.documents.length;
        const filteredCount = this.filteredDocuments.length;
        
        // Update any result counters if they exist
        const resultCounter = document.querySelector('.filter-results');
        if (resultCounter) {
            if (filteredCount === totalCount) {
                resultCounter.textContent = `${totalCount} وثيقة`;
            } else {
                resultCounter.textContent = `${filteredCount} من ${totalCount} وثيقة`;
            }
        }
    }

    /**
     * Switch between grid and list view
     */
    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', viewType === 'grid');
            listBtn.classList.toggle('active', viewType === 'list');
        }
        
        // Re-render documents with new view
        this.renderDocuments();
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <div class="loading-text">جاري تحميل الوثائق...</div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const grid = document.getElementById('filesGrid');
        grid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4>${message}</h4>
                <button class="btn btn-primary" data-action="reload-documents">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }

    /**
     * Cache management
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Render documents in current view mode
     */
    renderDocuments() {
        const grid = document.getElementById('filesGrid');

        if (this.filteredDocuments.length === 0) {
            this.showEmptyState(grid);
            return;
        }

        if (this.currentView === 'grid') {
            this.renderGridView(grid);
        } else {
            this.renderListView(grid);
        }

        // Add enhanced animations
        UXUtils.addFadeInAnimation(grid);
    }

    /**
     * Render documents in grid view
     */
    renderGridView(container) {
        const html = this.filteredDocuments.map(doc => this.createDocumentCard(doc)).join('');
        container.innerHTML = `<div class="documents-grid">${html}</div>`;

        // Setup card interactions
        this.setupCardInteractions();
    }

    /**
     * Render documents in list view
     */
    renderListView(container) {
        const html = `
            <div class="documents-list">
                <div class="list-header">
                    <div class="list-controls">
                        <input type="checkbox" id="selectAllDocs" class="form-check-input">
                        <label for="selectAllDocs">تحديد الكل</label>
                    </div>
                </div>
                <div class="list-body">
                    ${this.filteredDocuments.map(doc => this.createDocumentListItem(doc)).join('')}
                </div>
            </div>
        `;
        container.innerHTML = html;

        // Setup list interactions
        this.setupListInteractions();
    }

    /**
     * Create document card for grid view
     */
    createDocumentCard(document) {
        const isSelected = this.selectedDocuments.has(document.id);
        const iconClass = this.getFileIconClass(document.mime_type || document.file_type);
        const sizeFormatted = this.formatFileSize(document.size_bytes || document.file_size);
        const statusBadge = this.getDocumentStatusBadge(document);
        const categoryBadge = this.getDocumentCategoryBadge(document.category);

        return `
            <div class="document-card ${isSelected ? 'selected' : ''}" data-doc-id="${document.id}">
                <div class="card-header">
                    <div class="card-checkbox">
                        <input type="checkbox" class="form-check-input doc-checkbox"
                               data-doc-id="${document.id}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-primary" data-action="preview" data-document-id="${document.id}" title="معاينة">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" data-action="download" data-document-id="${document.id}" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit" data-document-id="${document.id}" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-document-id="${document.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="file-icon">
                        <i class="${iconClass} fa-3x"></i>
                    </div>
                    <h6 class="file-name" title="${document.display_name || document.original_filename}">
                        ${this.truncateText(document.display_name || document.original_filename, 30)}
                    </h6>
                    <div class="file-details">
                        <small class="text-muted">${sizeFormatted}</small>
                        <div class="file-badges">
                            ${categoryBadge}
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="file-meta">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDocumentDate(document.created_at || document.upload_date)}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create document list item for list view
     */
    createDocumentListItem(document) {
        const isSelected = this.selectedDocuments.has(document.id);
        const iconClass = this.getFileIconClass(document.mime_type || document.file_type);
        const sizeFormatted = this.formatFileSize(document.size_bytes || document.file_size);
        const statusBadge = this.getDocumentStatusBadge(document);
        const categoryName = this.getCategoryName(document.category);

        return `
            <div class="document-list-item ${isSelected ? 'selected' : ''}" data-doc-id="${document.id}">
                <div class="item-checkbox">
                    <input type="checkbox" class="form-check-input doc-checkbox"
                           data-doc-id="${document.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="item-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="item-info">
                    <div class="item-name">${document.display_name || document.original_filename}</div>
                    <div class="item-details">
                        <span class="detail-item">${categoryName}</span>
                        <span class="detail-item">${sizeFormatted}</span>
                        <span class="detail-item">${this.formatDocumentDate(document.created_at || document.upload_date)}</span>
                    </div>
                </div>
                <div class="item-status">
                    ${statusBadge}
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline-primary" data-action="preview" data-document-id="${document.id}" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" data-action="download" data-document-id="${document.id}" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" data-action="edit" data-document-id="${document.id}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete" data-document-id="${document.id}" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state when no documents
     */
    showEmptyState(container) {
        const entityTypeArabic = this.entityType === 'driver' ? 'السائق' : 'المركبة';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-folder-open fa-4x text-muted"></i>
                </div>
                <h4>لا توجد وثائق</h4>
                <p class="text-muted">لم يتم رفع أي وثائق لهذا ${entityTypeArabic} بعد</p>
                <button class="btn btn-primary" data-action="show-upload-zone">
                    <i class="fas fa-upload"></i>
                    رفع وثيقة جديدة
                </button>
            </div>
        `;
    }

    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Get file icon class based on mime type
     */
    getFileIconClass(mimeType) {
        if (!mimeType) return 'fas fa-file';

        const iconMap = {
            'application/pdf': 'fas fa-file-pdf text-danger',
            'image/jpeg': 'fas fa-file-image text-info',
            'image/jpg': 'fas fa-file-image text-info',
            'image/png': 'fas fa-file-image text-info',
            'image/gif': 'fas fa-file-image text-info',
            'application/msword': 'fas fa-file-word text-primary',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word text-primary',
            'application/vnd.ms-excel': 'fas fa-file-excel text-success',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel text-success',
            'text/plain': 'fas fa-file-alt text-secondary',
            'text/csv': 'fas fa-file-csv text-success'
        };

        return iconMap[mimeType] || 'fas fa-file';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 بايت';

        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = (bytes / Math.pow(1024, i)).toFixed(1);

        return `${size} ${sizes[i]}`;
    }

    /**
     * Get document status badge
     */
    getDocumentStatusBadge(document) {
        if (this.isDocumentExpired(document)) {
            return '<span class="badge bg-danger">منتهي</span>';
        }
        if (this.isDocumentExpiring(document)) {
            return '<span class="badge bg-warning">ينتهي قريباً</span>';
        }
        return '<span class="badge bg-success">نشط</span>';
    }

    /**
     * Get document category badge
     */
    getDocumentCategoryBadge(category) {
        const categoryMap = {
            'license': '<span class="badge bg-primary">رخصة</span>',
            'insurance': '<span class="badge bg-info">تأمين</span>',
            'contract': '<span class="badge bg-success">عقد</span>',
            'invoice': '<span class="badge bg-warning">فاتورة</span>',
            'receipt': '<span class="badge bg-secondary">إيصال</span>',
            'certificate': '<span class="badge bg-danger">شهادة</span>',
            'other': '<span class="badge bg-dark">أخرى</span>'
        };

        return categoryMap[category] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    /**
     * Get category name in Arabic
     */
    getCategoryName(category) {
        const categoryMap = {
            'license': 'رخصة القيادة',
            'insurance': 'تأمين المركبة',
            'contract': 'عقد العمل',
            'invoice': 'فاتورة',
            'receipt': 'إيصال',
            'certificate': 'شهادة',
            'other': 'أخرى'
        };

        return categoryMap[category] || 'غير محدد';
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
     * Setup card interactions for grid view
     */
    setupCardInteractions() {
        // Document checkboxes
        document.querySelectorAll('.doc-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const docId = e.target.getAttribute('data-doc-id');
                if (e.target.checked) {
                    this.selectedDocuments.add(docId);
                } else {
                    this.selectedDocuments.delete(docId);
                }
                this.updateSelectionUI();
            });
        });
    }

    /**
     * Setup list interactions for list view
     */
    setupListInteractions() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllDocs');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.doc-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    const docId = checkbox.getAttribute('data-doc-id');
                    if (e.target.checked) {
                        this.selectedDocuments.add(docId);
                    } else {
                        this.selectedDocuments.delete(docId);
                    }
                });
                this.updateSelectionUI();
            });
        }

        // Individual checkboxes
        this.setupCardInteractions();
    }

    /**
     * Update selection UI based on selected documents
     */
    updateSelectionUI() {
        const selectedCount = this.selectedDocuments.size;
        const bulkActionsBar = document.getElementById('bulkActionsBar');
        const selectedCountElement = document.getElementById('selectedCount');

        if (bulkActionsBar) {
            bulkActionsBar.style.display = selectedCount > 0 ? 'flex' : 'none';
        }

        if (selectedCountElement) {
            selectedCountElement.textContent = `${selectedCount} محدد`;
        }

        // Update card/item visual states
        document.querySelectorAll('.document-card, .document-list-item').forEach(item => {
            const docId = item.getAttribute('data-doc-id');
            item.classList.toggle('selected', this.selectedDocuments.has(docId));
        });
    }

    /**
     * Edit document - delegate to bulk operations manager
     */
    editDocument(documentId) {
        console.log('🔧 Edit document called for:', documentId);

        // Use the bulk operations manager for editing
        if (window.entityDocumentBulkOperations) {
            window.entityDocumentBulkOperations.editDocument(documentId);
        } else {
            console.error('entityDocumentBulkOperations not available');
            showError('خطأ في تحميل نظام تعديل الوثائق');
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(documentId) {
        console.log('🗑️ Delete document called for:', documentId);

        // Find the document to get its name for confirmation
        const document = this.documents.find(doc => doc.id === documentId);
        const documentName = document ? document.display_name : 'الوثيقة';

        const confirmMessage = `هل أنت متأكد من حذف الوثيقة "${documentName}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`;

        if (confirm(confirmMessage)) {
            try {
                // Get CSRF token for secure deletion
                const csrfToken = await this.getCSRFToken();

                const response = await fetch(`/api/documents/${documentId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrfToken
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    showSuccess(result.message || 'تم حذف الوثيقة بنجاح');

                    // Remove from local documents array
                    this.documents = this.documents.filter(doc => doc.id !== documentId);

                    // Clear cache to force fresh data on next load
                    const cacheKey = `${this.entityType}_${this.entityId}_documents`;
                    this.cache.delete(cacheKey);

                    // Re-render the documents
                    this.applyFilters();
                    this.renderDocuments();

                    console.log('✅ Document deleted successfully:', documentId);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'فشل في حذف الوثيقة');
                }
            } catch (error) {
                console.error('❌ Delete error:', error);
                showError('خطأ في حذف الوثيقة: ' + error.message);
            }
        }
    }

    /**
     * Preview document
     */
    previewDocument(documentId) {
        console.log('👁️ Preview document called for:', documentId);

        // Open document in new tab
        const previewUrl = `/api/documents/preview/${documentId}`;
        window.open(previewUrl, '_blank');
    }

    /**
     * Download document
     */
    downloadDocument(documentId) {
        console.log('⬇️ Download document called for:', documentId);

        // Trigger download
        const downloadUrl = `/api/documents/download/${documentId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Save document changes
     */
    async saveDocumentChanges(documentId) {
        console.log('💾 Save document changes called for:', documentId);

        try {
            const displayName = document.getElementById('editDisplayName').value;
            const category = document.getElementById('editCategory').value;
            const expiryDate = document.getElementById('editExpiryDate').value;
            const notes = document.getElementById('editNotes').value;

            console.log('DEBUG: Saving document changes', {
                documentId,
                displayName,
                category,
                expiryDate,
                notes
            });

            // Get CSRF token for the request
            const csrfToken = await this.getCSRFToken();
            console.log('DEBUG: CSRF token obtained:', csrfToken ? 'Yes' : 'No');

            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    display_name: displayName,
                    category: category,
                    expiry_date: expiryDate || null,
                    notes: notes
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('DEBUG: Save successful:', result);

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editDocumentModal'));
                if (modal) {
                    modal.hide();
                }

                // Show success message
                if (window.showSuccess) {
                    window.showSuccess('تم حفظ التغييرات بنجاح');
                } else {
                    console.log('✅ تم حفظ التغييرات بنجاح');
                }

                // Reload documents to show updated data
                this.loadDocuments();
            } else {
                const errorData = await response.text();
                console.error('DEBUG: Error response:', errorData);
                throw new Error(`Save failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            if (window.showError) {
                window.showError('خطأ في حفظ التغييرات');
            } else {
                console.log('❌ خطأ في حفظ التغييرات');
            }
        }
    }
}

// Make EntityDocumentManager globally available
window.EntityDocumentManager = EntityDocumentManager;

/**
 * Global function to refresh entity documents after uploads
 * دالة عامة لتحديث وثائق الكيان بعد الرفع
 */
window.refreshEntityDocuments = function() {
    if (window.entityDocumentManager) {
        console.log('🔄 Refreshing entity documents via global function');
        window.entityDocumentManager.refreshDocuments();
    } else {
        console.log('⚠️ No entity document manager found to refresh');
    }
};
