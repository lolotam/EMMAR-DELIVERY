/**
 * Entity Document Bulk Operations - ZIP Download, Bulk Delete, Export
 * العمليات المجمعة لوثائق الكيانات - تحميل مضغوط، حذف مجمع، تصدير
 */

// Extend EntityDocumentManager with bulk operations
Object.assign(EntityDocumentManager.prototype, {

    /**
     * Download all documents as ZIP
     */
    async downloadAllDocuments() {
        if (this.documents.length === 0) {
            showError('لا توجد وثائق للتحميل');
            return;
        }

        try {
            const entityName = this.entityInfo.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
            const timestamp = new Date().toISOString().split('T')[0];
            const zipName = `${entityName}_documents_${timestamp}.zip`;

            // Show loading
            showInfo('جاري إنشاء الملف المضغوط...');

            const response = await fetch('/api/documents/bulk-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_type: this.entityType,
                    entity_id: this.entityId,
                    zip_name: zipName
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadBlob(blob, zipName);
                showSuccess('تم تحميل جميع الوثائق بنجاح');
            } else {
                throw new Error('Bulk download failed');
            }
        } catch (error) {
            console.error('Bulk download error:', error);
            showError('خطأ في تحميل الوثائق');
        }
    },

    /**
     * Download selected documents as ZIP
     */
    async downloadSelectedDocuments() {
        if (this.selectedDocuments.size === 0) {
            showError('يرجى تحديد وثائق للتحميل');
            return;
        }

        try {
            const selectedIds = Array.from(this.selectedDocuments);
            const entityName = this.entityInfo.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
            const timestamp = new Date().toISOString().split('T')[0];
            const zipName = `${entityName}_selected_documents_${timestamp}.zip`;

            // Show loading
            showInfo('جاري إنشاء الملف المضغوط...');

            const response = await fetch('/api/documents/bulk-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document_ids: selectedIds,
                    zip_name: zipName
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadBlob(blob, zipName);
                showSuccess(`تم تحميل ${selectedIds.length} وثيقة بنجاح`);
            } else {
                throw new Error('Bulk download failed');
            }
        } catch (error) {
            console.error('Bulk download error:', error);
            showError('خطأ في تحميل الوثائق المحددة');
        }
    },

    /**
     * Delete selected documents
     */
    async deleteSelectedDocuments() {
        if (this.selectedDocuments.size === 0) {
            showError('يرجى تحديد وثائق للحذف');
            return;
        }

        const selectedCount = this.selectedDocuments.size;
        const confirmed = await this.showBulkDeleteConfirmation(selectedCount);
        if (!confirmed) return;

        try {
            const selectedIds = Array.from(this.selectedDocuments);
            
            // Show progress
            showInfo(`جاري حذف ${selectedCount} وثيقة...`);

            const response = await fetch('/api/documents/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document_ids: selectedIds
                })
            });

            if (response.ok) {
                // Remove deleted documents from local arrays
                this.documents = this.documents.filter(doc => !selectedIds.includes(doc.id));
                this.filteredDocuments = this.filteredDocuments.filter(doc => !selectedIds.includes(doc.id));
                this.selectedDocuments.clear();
                
                // Clear cache
                this.clearCache();
                
                // Re-render
                this.renderDocuments();
                this.updateSelectionUI();
                
                showSuccess(`تم حذف ${selectedCount} وثيقة بنجاح`);
            } else {
                throw new Error('Bulk delete failed');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            showError('خطأ في حذف الوثائق المحددة');
        }
    },

    /**
     * Export document list to CSV/Excel
     */
    async exportDocumentList() {
        if (this.documents.length === 0) {
            showError('لا توجد وثائق للتصدير');
            return;
        }

        try {
            const entityName = this.entityInfo.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
            const timestamp = new Date().toISOString().split('T')[0];
            
            // Prepare export data
            const exportData = this.documents.map(doc => ({
                'اسم الوثيقة': doc.display_name || doc.original_filename,
                'اسم الملف الأصلي': doc.original_filename,
                'الفئة': this.getCategoryName(doc.category),
                'الحجم': this.formatFileSize(doc.size_bytes || doc.file_size),
                'الحالة': this.getDocumentStatusText(doc),
                'تاريخ الرفع': this.formatDocumentDate(doc.created_at || doc.upload_date),
                'تاريخ الانتهاء': doc.expiry_date ? this.formatDocumentDate(doc.expiry_date) : 'غير محدد',
                'الملاحظات': doc.notes || ''
            }));

            // Export as CSV
            const csvContent = this.convertToCSV(exportData);
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            this.downloadBlob(csvBlob, `${entityName}_documents_${timestamp}.csv`);
            
            showSuccess('تم تصدير قائمة الوثائق بنجاح');
        } catch (error) {
            console.error('Export error:', error);
            showError('خطأ في تصدير قائمة الوثائق');
        }
    },

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape quotes and wrap in quotes if contains comma
                return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    },

    /**
     * Get document status as text
     */
    getDocumentStatusText(document) {
        if (this.isDocumentExpired(document)) {
            return 'منتهي';
        }
        if (this.isDocumentExpiring(document)) {
            return 'ينتهي قريباً';
        }
        return 'نشط';
    },

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Show bulk delete confirmation dialog
     */
    showBulkDeleteConfirmation(count) {
        return new Promise((resolve) => {
            const confirmed = confirm(`هل أنت متأكد من حذف ${count} وثيقة؟\n\nلا يمكن التراجع عن هذا الإجراء.`);
            resolve(confirmed);
        });
    },

    /**
     * Edit document metadata
     */
    async editDocument(documentId) {
        const documentData = this.documents.find(doc => doc.id === documentId);
        if (!documentData) return;

        // Show edit modal/form
        this.showEditDocumentModal(documentData);
    },

    /**
     * Show edit document modal
     */
    showEditDocumentModal(documentData) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="editDocumentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">تعديل بيانات الوثيقة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editDocumentForm">
                                <div class="mb-3">
                                    <label for="editDisplayName" class="form-label">اسم الوثيقة</label>
                                    <input type="text" class="form-control" id="editDisplayName"
                                           value="${documentData.display_name || documentData.original_filename}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editCategory" class="form-label">الفئة</label>
                                    <select class="form-select" id="editCategory" required>
                                        <option value="license" ${documentData.category === 'license' ? 'selected' : ''}>رخصة القيادة</option>
                                        <option value="insurance" ${documentData.category === 'insurance' ? 'selected' : ''}>تأمين المركبة</option>
                                        <option value="contract" ${documentData.category === 'contract' ? 'selected' : ''}>عقد العمل</option>
                                        <option value="invoice" ${documentData.category === 'invoice' ? 'selected' : ''}>فاتورة</option>
                                        <option value="receipt" ${documentData.category === 'receipt' ? 'selected' : ''}>إيصال</option>
                                        <option value="certificate" ${documentData.category === 'certificate' ? 'selected' : ''}>شهادة</option>
                                        <option value="other" ${documentData.category === 'other' ? 'selected' : ''}>أخرى</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editExpiryDate" class="form-label">تاريخ الانتهاء</label>
                                    <input type="date" class="form-control" id="editExpiryDate"
                                           value="${documentData.expiry_date || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="editNotes" class="form-label">الملاحظات</label>
                                    <textarea class="form-control" id="editNotes" rows="3">${documentData.notes || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" data-action="save-document-changes" data-document-id="${documentData.id}">حفظ التغييرات</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editDocumentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editDocumentModal'));
        modal.show();

        // Initialize date picker after modal is shown
        modal._element.addEventListener('shown.bs.modal', () => {
            this.initializeDatePicker('editExpiryDate');
        });
    },

    /**
     * Initialize date picker for expiry date fields
     * تهيئة منتقي التاريخ لحقول تاريخ الانتهاء
     */
    initializeDatePicker(fieldId) {
        try {
            const dateField = document.getElementById(fieldId);
            if (dateField) {
                // Ensure the field is focusable and properly initialized
                dateField.setAttribute('autocomplete', 'off');
                dateField.addEventListener('focus', function() {
                    // Force show date picker on focus (helps with some browsers)
                    this.showPicker && this.showPicker();
                });

                // Add validation
                dateField.addEventListener('change', function() {
                    const value = this.value;
                    if (value) {
                        const date = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // Add visual indicator for expired dates
                        if (date < today) {
                            this.classList.add('date-expired');
                            this.classList.remove('date-valid');
                        } else {
                            this.classList.add('date-valid');
                            this.classList.remove('date-expired');
                        }
                    } else {
                        this.classList.remove('date-expired', 'date-valid');
                    }
                });

                // Trigger validation for existing values
                const changeEvent = new Event('change');
                dateField.dispatchEvent(changeEvent);
            }
        } catch (error) {
            console.error('Error initializing date picker:', error);
        }
    },

    /**
     * Get CSRF token for secure requests
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
     * Save document changes
     */
    async saveDocumentChanges(documentId) {
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

            // Get CSRF token for secure request
            const csrfToken = await this.getCSRFToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }

            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({
                    display_name: displayName,
                    category: category,
                    expiry_date: expiryDate || null,
                    notes: notes
                })
            });

            console.log('DEBUG: Response status:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('DEBUG: Response data:', result);

                // Update local document
                const docIndex = this.documents.findIndex(doc => doc.id === documentId);
                if (docIndex !== -1) {
                    this.documents[docIndex] = {
                        ...this.documents[docIndex],
                        display_name: displayName,
                        category: category,
                        expiry_date: expiryDate || null,
                        notes: notes
                    };
                }

                // Clear cache and re-render
                this.clearCache();
                this.applyFilters();
                this.renderDocuments();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editDocumentModal'));
                modal.hide();

                showSuccess('تم حفظ التغييرات بنجاح');
            } else {
                const errorData = await response.text();
                console.error('DEBUG: Error response:', errorData);
                throw new Error(`Save failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            showError('خطأ في حفظ التغييرات');
        }
    }
});

// Event delegation for document edit modal save button (CSP compliant)
document.addEventListener('click', (e) => {
    const actionButton = e.target.closest('button[data-action]');
    if (actionButton && actionButton.closest('#editDocumentModal')) {
        const action = actionButton.getAttribute('data-action');
        const documentId = actionButton.getAttribute('data-document-id');

        if (action === 'save-document-changes' && documentId) {
            if (window.entityDocumentBulkOperations) {
                window.entityDocumentBulkOperations.saveDocumentChanges(documentId);
            } else {
                console.error('entityDocumentBulkOperations not available');
                showError('خطأ في حفظ التغييرات - المدير غير متاح');
            }
        }
    }
});

// Bulk operations are now part of EntityDocumentManager prototype
// No need for separate global variable
