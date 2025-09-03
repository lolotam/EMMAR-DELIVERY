/**
 * Generic Form Modal Component
 * مكون نموذج الإدخال العام
 */

class FormModal {
    constructor(modalId, options = {}) {
        this.modalId = modalId;
        this.options = {
            title: options.title || 'نموذج البيانات',
            fields: options.fields || [],
            size: options.size || 'lg', // sm, lg, xl
            submitText: options.submitText || 'حفظ',
            cancelText: options.cancelText || 'إلغاء',
            ...options
        };
        this.currentData = {};
        this.isEditMode = false;
        this.validationErrors = {};
    }

    /**
     * Create and show the modal
     */
    show(data = null) {
        this.currentData = data || {};
        this.isEditMode = !!data;
        this.validationErrors = {};
        
        this.createModal();
        this.populateForm();
        this.attachEventListeners();

        // Update field visibility after form is populated
        setTimeout(() => {
            this.updateFieldVisibility();
            this.initializeDragAndDrop();
        }, 100);

        const modal = new bootstrap.Modal(document.getElementById(this.modalId));
        modal.show();
    }

    /**
     * Create modal HTML structure
     */
    createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById(this.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-${this.options.size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="${this.options.icon || 'fas fa-edit'} me-2"></i>
                                ${this.isEditMode ? 'تعديل' : 'إضافة'} ${this.options.title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="${this.modalId}_form" novalidate>
                                ${this.renderFormFields()}
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                ${this.options.cancelText}
                            </button>
                            <button type="button" class="btn btn-primary" id="${this.modalId}_submit">
                                <i class="fas fa-save me-2"></i>
                                ${this.options.submitText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Render form fields
     */
    renderFormFields() {
        return this.options.fields.map(field => {
            switch (field.type) {
                case 'text':
                case 'email':
                case 'tel':
                case 'number':
                    return this.renderInputField(field);
                case 'textarea':
                    return this.renderTextareaField(field);
                case 'select':
                    return this.renderSelectField(field);
                case 'driver_select':
                    return this.renderDriverSelectField(field);
                case 'date':
                    return this.renderDateField(field);
                case 'checkbox':
                    return this.renderCheckboxField(field);
                case 'radio':
                    return this.renderRadioField(field);
                case 'file':
                    return this.renderFileField(field);
                default:
                    return this.renderInputField(field);
            }
        }).join('');
    }

    /**
     * Render input field
     */
    renderInputField(field) {
        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label for="${this.modalId}_${field.name}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <input type="${field.type || 'text'}"
                       class="form-control"
                       id="${this.modalId}_${field.name}"
                       name="${field.name}"
                       placeholder="${field.placeholder || ''}"
                       ${field.required ? 'required' : ''}
                       ${field.readonly ? 'readonly' : ''}
                       ${field.min !== undefined ? `min="${field.min}"` : ''}
                       ${field.max !== undefined ? `max="${field.max}"` : ''}
                       ${field.step !== undefined ? `step="${field.step}"` : ''}
                       ${field.pattern ? `pattern="${field.pattern}"` : ''}>
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render driver select field with search functionality
     */
    renderDriverSelectField(field) {
        const fieldId = `${this.modalId}_${field.name}`;
        const searchId = `${fieldId}_search`;
        const dropdownId = `${fieldId}_dropdown`;
        const isVisible = this.isFieldVisible(field);

        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label for="${searchId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <div class="driver-select-container position-relative">
                    <input type="text"
                           class="form-control driver-search-input"
                           id="${searchId}"
                           placeholder="ابحث عن السائق بالاسم أو الرقم المدني أو الهاتف..."
                           autocomplete="off"
                           ${field.readonly ? 'disabled' : ''}>
                    <input type="hidden"
                           id="${fieldId}"
                           name="${field.name}"
                           ${field.required ? 'required' : ''}>
                    <div class="driver-dropdown position-absolute w-100 bg-white border rounded shadow-sm"
                         id="${dropdownId}"
                         style="display: none; max-height: 200px; overflow-y: auto; z-index: 1050; top: 100%;">
                        <div class="p-2 text-center text-muted">
                            <i class="fas fa-spinner fa-spin me-2"></i>
                            جاري تحميل السائقين...
                        </div>
                    </div>
                </div>
                <div class="invalid-feedback" id="${fieldId}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render textarea field
     */
    renderTextareaField(field) {
        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label for="${this.modalId}_${field.name}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <textarea class="form-control"
                          id="${this.modalId}_${field.name}"
                          name="${field.name}"
                          rows="${field.rows || 3}"
                          placeholder="${field.placeholder || ''}"
                          ${field.required ? 'required' : ''}
                          ${field.readonly ? 'readonly' : ''}></textarea>
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render select field
     */
    renderSelectField(field) {
        const options = field.options || [];
        const optionsHTML = options.map(option => {
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option;
            return `<option value="${value}">${label}</option>`;
        }).join('');

        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label for="${this.modalId}_${field.name}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <select class="form-select"
                        id="${this.modalId}_${field.name}"
                        name="${field.name}"
                        ${field.required ? 'required' : ''}
                        ${field.readonly ? 'disabled' : ''}>
                    <option value="">اختر...</option>
                    ${optionsHTML}
                </select>
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render date field
     */
    renderDateField(field) {
        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label for="${this.modalId}_${field.name}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <input type="date"
                       class="form-control"
                       id="${this.modalId}_${field.name}"
                       name="${field.name}"
                       ${field.required ? 'required' : ''}
                       ${field.readonly ? 'readonly' : ''}
                       ${field.min ? `min="${field.min}"` : ''}
                       ${field.max ? `max="${field.max}"` : ''}>
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render checkbox field
     */
    renderCheckboxField(field) {
        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <div class="form-check">
                    <input class="form-check-input"
                           type="checkbox"
                           id="${this.modalId}_${field.name}"
                           name="${field.name}"
                           ${field.readonly ? 'disabled' : ''}>
                    <label class="form-check-label" for="${this.modalId}_${field.name}">
                        ${field.label}
                    </label>
                </div>
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render radio field
     */
    renderRadioField(field) {
        const options = field.options || [];
        const optionsHTML = options.map((option, index) => {
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option;
            return `
                <div class="form-check">
                    <input class="form-check-input" 
                           type="radio" 
                           name="${field.name}" 
                           id="${this.modalId}_${field.name}_${index}"
                           value="${value}"
                           ${field.readonly ? 'disabled' : ''}>
                    <label class="form-check-label" for="${this.modalId}_${field.name}_${index}">
                        ${label}
                    </label>
                </div>
            `;
        }).join('');

        const isVisible = this.isFieldVisible(field);
        return `
            <div class="mb-3" data-field="${field.name}" style="display: ${isVisible ? 'block' : 'none'}">
                <label class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${optionsHTML}
                <div class="invalid-feedback" id="${this.modalId}_${field.name}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render file field
     */
    renderFileField(field) {
        return this.renderDragDropFileField(field);
    }

    renderDragDropFileField(field) {
        const fieldId = `${this.modalId}_${field.name}`;
        const dropZoneId = `${fieldId}_dropzone`;
        const fileListId = `${fieldId}_filelist`;

        return `
            <div class="mb-3">
                <label for="${fieldId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>

                <!-- Drag and Drop Zone -->
                <div class="drag-drop-zone" id="${dropZoneId}"
                     style="border: 2px dashed #dee2e6; border-radius: 8px; padding: 40px 20px; text-align: center; background-color: #f8f9fa; cursor: pointer; transition: all 0.3s ease; margin-bottom: 15px;">
                    <div class="drag-drop-content">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #6c757d; margin-bottom: 15px;"></i>
                        <h5 style="color: #495057; margin-bottom: 10px;">اسحب الملفات هنا أو انقر للتصفح</h5>
                        <p style="color: #6c757d; margin-bottom: 0;">يمكنك إرفاق ملفات متعددة (PDF, صور, مستندات)</p>
                        <p style="color: #6c757d; font-size: 0.875rem;">الحد الأقصى لحجم الملف: 10 ميجابايت</p>
                    </div>
                </div>

                <!-- Hidden File Input -->
                <input type="file"
                       class="d-none"
                       id="${fieldId}"
                       name="${field.name}"
                       ${field.multiple ? 'multiple' : ''}
                       ${field.accept ? `accept="${field.accept}"` : 'accept="image/*,.pdf,.doc,.docx,.txt"'}
                       ${field.required ? 'required' : ''}
                       ${field.readonly ? 'disabled' : ''}>

                <!-- File List Display -->
                <div id="${fileListId}" class="file-list-container" style="margin-top: 15px;"></div>

                <!-- Existing Attachments (for edit mode) -->
                <div id="${fieldId}_existing" class="existing-attachments" style="margin-top: 15px;"></div>

                <div class="invalid-feedback" id="${fieldId}_error"></div>
                ${field.help ? `<div class="form-text">${field.help}</div>` : ''}
            </div>
        `;
    }

    /**
     * Populate form with data
     */
    populateForm() {
        this.options.fields.forEach(field => {
            const element = document.getElementById(`${this.modalId}_${field.name}`);
            if (!element) return;

            const value = this.currentData[field.name];

            if (field.type === 'checkbox') {
                element.checked = !!value;
            } else if (field.type === 'radio') {
                const radioElements = document.querySelectorAll(`input[name="${field.name}"]`);
                radioElements.forEach(radio => {
                    radio.checked = radio.value === value;
                });
            } else if (field.type === 'file') {
                // Skip file inputs - cannot set value programmatically for security reasons
                // Handle existing attachments display
                this.displayExistingAttachments(field);
                return;
            } else {
                element.value = value || '';
            }
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const submitBtn = document.getElementById(`${this.modalId}_submit`);
        const form = document.getElementById(`${this.modalId}_form`);

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Real-time validation and onChange handling
        this.options.fields.forEach(field => {
            const element = document.getElementById(`${this.modalId}_${field.name}`);
            if (element) {
                element.addEventListener('blur', () => this.validateField(field));
                element.addEventListener('input', () => this.clearFieldError(field.name));
                
                // Handle custom onChange events and field visibility updates
                element.addEventListener('change', () => {
                    this.handleFieldChange(field, element.value);
                });
            }
        });
    }

    /**
     * Handle field change events
     */
    handleFieldChange(field, value) {
        // Always call the onFieldChange callback if it exists
        if (typeof this.options.onFieldChange === 'function') {
            this.options.onFieldChange(field.name, value, field.onChange || 'change');
        }

        // Always update field visibility when any field changes
        this.updateFieldVisibility();
    }

    /**
     * Check if a field should be visible based on conditions
     */
    isFieldVisible(field) {
        if (!field.visibleWhen) {
            return true; // Field is always visible if no conditions
        }

        // Get current form values
        const formData = this.getFormData();

        // Check each condition
        for (const condition of field.visibleWhen) {
            const controllerValue = formData[condition.field];
            if (condition.values.includes(controllerValue)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update field visibility based on current form values
     */
    updateFieldVisibility() {
        this.options.fields.forEach(field => {
            const fieldContainer = document.querySelector(`[data-field="${field.name}"]`);
            if (fieldContainer) {
                const isVisible = this.isFieldVisible(field);
                fieldContainer.style.display = isVisible ? 'block' : 'none';

                // Clear field value if hidden
                if (!isVisible) {
                    const element = document.getElementById(`${this.modalId}_${field.name}`);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = false;
                        } else {
                            element.value = '';
                        }
                    }
                }
            }
        });
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        const formData = this.getFormData();
        const isValid = this.validateForm(formData);

        if (!isValid) {
            showError('يرجى تصحيح الأخطاء في النموذج');
            return;
        }

        try {
            showLoading();
            
            if (this.options.onSubmit) {
                await this.options.onSubmit(formData, this.isEditMode);
            }

            this.hide();
            showSuccess(this.isEditMode ? 'تم التحديث بنجاح' : 'تم الحفظ بنجاح');
            
        } catch (error) {
            showError(error.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            hideLoading();
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const formData = { ...this.currentData };

        this.options.fields.forEach(field => {
            if (field.type === 'checkbox') {
                const element = document.getElementById(`${this.modalId}_${field.name}`);
                formData[field.name] = element ? element.checked : false;
            } else if (field.type === 'radio') {
                const checkedRadio = document.querySelector(`input[name="${field.name}"]:checked`);
                formData[field.name] = checkedRadio ? checkedRadio.value : '';
            } else if (field.type === 'file') {
                const element = document.getElementById(`${this.modalId}_${field.name}`);
                formData[field.name] = element ? element.files : null;
            } else {
                const element = document.getElementById(`${this.modalId}_${field.name}`);
                if (element) {
                    let value = element.value.trim();
                    
                    // Convert to appropriate type
                    if (field.type === 'number') {
                        value = value ? parseFloat(value) : null;
                    }
                    
                    formData[field.name] = value;
                }
            }
        });

        return formData;
    }

    /**
     * Validate entire form
     */
    validateForm(data) {
        let isValid = true;
        this.validationErrors = {};

        this.options.fields.forEach(field => {
            const fieldValid = this.validateField(field, data[field.name]);
            if (!fieldValid) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate single field
     */
    validateField(field, value = null) {
        if (value === null) {
            const element = document.getElementById(`${this.modalId}_${field.name}`);
            if (field.type === 'checkbox') {
                value = element ? element.checked : false;
            } else if (field.type === 'radio') {
                const checkedRadio = document.querySelector(`input[name="${field.name}"]:checked`);
                value = checkedRadio ? checkedRadio.value : '';
            } else {
                value = element ? element.value.trim() : '';
            }
        }

        const errors = [];

        // Required validation
        if (field.required && (!value || value === '')) {
            errors.push(`${field.label} مطلوب`);
        }

        // Type-specific validation
        if (value && field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push('البريد الإلكتروني غير صحيح');
            }
        }

        if (value && field.type === 'tel') {
            const phoneRegex = /^\+965\d{8}$/;
            if (!phoneRegex.test(value)) {
                errors.push('رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX');
            }
        }

        // Custom validation
        if (field.validate && typeof field.validate === 'function') {
            const customError = field.validate(value);
            if (customError) {
                errors.push(customError);
            }
        }

        // Show/hide errors
        if (errors.length > 0) {
            this.showFieldError(field.name, errors[0]);
            return false;
        } else {
            this.clearFieldError(field.name);
            return true;
        }
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const element = document.getElementById(`${this.modalId}_${fieldName}`);
        const errorElement = document.getElementById(`${this.modalId}_${fieldName}_error`);

        if (element) {
            element.classList.add('is-invalid');
        }
        if (errorElement) {
            errorElement.textContent = message;
        }

        this.validationErrors[fieldName] = message;
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const element = document.getElementById(`${this.modalId}_${fieldName}`);
        const errorElement = document.getElementById(`${this.modalId}_${fieldName}_error`);

        if (element) {
            element.classList.remove('is-invalid');
        }
        if (errorElement) {
            errorElement.textContent = '';
        }

        delete this.validationErrors[fieldName];
    }

    /**
     * Hide modal
     */
    hide() {
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }

    /**
     * Initialize drag and drop functionality for file fields
     */
    initializeDragAndDrop() {
        // Find all drag-drop zones in this modal
        const dropZones = document.querySelectorAll(`#${this.modalId} .drag-drop-zone`);

        dropZones.forEach(dropZone => {
            const fieldId = dropZone.id.replace('_dropzone', '');
            const fileInput = document.getElementById(fieldId);
            const fileListContainer = document.getElementById(`${fieldId}_filelist`);

            if (!fileInput || !fileListContainer) return;

            // Click to browse files
            dropZone.addEventListener('click', () => {
                fileInput.click();
            });

            // Drag and drop events
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#007bff';
                dropZone.style.backgroundColor = '#e3f2fd';
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#dee2e6';
                dropZone.style.backgroundColor = '#f8f9fa';
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#dee2e6';
                dropZone.style.backgroundColor = '#f8f9fa';

                const files = e.dataTransfer.files;
                this.handleFileSelection(fileInput, files, fileListContainer);
            });

            // File input change event
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(fileInput, e.target.files, fileListContainer);
            });
        });
    }

    /**
     * Handle file selection and display
     */
    handleFileSelection(fileInput, files, fileListContainer) {
        if (!files || files.length === 0) return;

        // Clear previous file list
        fileListContainer.innerHTML = '';

        // Create file list
        const fileList = document.createElement('div');
        fileList.className = 'selected-files';

        Array.from(files).forEach((file, index) => {
            const fileItem = this.createFileItem(file, index, fileInput);
            fileList.appendChild(fileItem);
        });

        fileListContainer.appendChild(fileList);

        // Update the file input with selected files
        const dt = new DataTransfer();
        Array.from(files).forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }

    /**
     * Create file item display
     */
    createFileItem(file, index, fileInput) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item d-flex align-items-center justify-content-between p-3 mb-2 border rounded';
        fileItem.style.backgroundColor = '#f8f9fa';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'd-flex align-items-center';

        // File icon
        const icon = document.createElement('i');
        icon.className = this.getFileIcon(file.type);
        icon.style.fontSize = '24px';
        icon.style.marginRight = '10px';
        icon.style.color = '#6c757d';

        // File details
        const details = document.createElement('div');
        details.innerHTML = `
            <div style="font-weight: 500; color: #495057;">${file.name}</div>
            <div style="font-size: 0.875rem; color: #6c757d;">${this.formatFileSize(file.size)}</div>
        `;

        fileInfo.appendChild(icon);
        fileInfo.appendChild(details);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-outline-danger';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'إزالة الملف';

        removeBtn.addEventListener('click', () => {
            this.removeFile(fileInput, index);
            fileItem.remove();
        });

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);

        return fileItem;
    }

    /**
     * Get file icon based on file type
     */
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fas fa-image text-success';
        if (fileType === 'application/pdf') return 'fas fa-file-pdf text-danger';
        if (fileType.includes('word')) return 'fas fa-file-word text-primary';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel text-success';
        return 'fas fa-file text-secondary';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Remove file from file input
     */
    removeFile(fileInput, indexToRemove) {
        const dt = new DataTransfer();
        Array.from(fileInput.files).forEach((file, index) => {
            if (index !== indexToRemove) {
                dt.items.add(file);
            }
        });
        fileInput.files = dt.files;
    }

    /**
     * Display existing attachments for edit mode
     */
    displayExistingAttachments(field) {
        if (!this.isEditMode || !this.currentData.attachments) return;

        let existingContainer = document.getElementById(`${this.modalId}_${field.name}_existing`);
        if (!existingContainer) {
            // Create the container if it doesn't exist
            const fileFieldContainer = document.querySelector(`#${this.modalId} .mb-3:has(#${this.modalId}_${field.name})`);
            if (fileFieldContainer) {
                existingContainer = document.createElement('div');
                existingContainer.id = `${this.modalId}_${field.name}_existing`;
                existingContainer.className = 'existing-attachments';
                existingContainer.style.marginTop = '15px';
                fileFieldContainer.appendChild(existingContainer);
            } else {
                return;
            }
        }

        // Clear existing content
        existingContainer.innerHTML = '';

        // Check if there are attachments to display
        const attachments = this.currentData.attachments;
        if (!attachments || attachments.length === 0) return;

        // Create header for existing attachments
        const header = document.createElement('div');
        header.className = 'mb-2';
        header.innerHTML = '<strong style="color: #856404;">المرفقات الحالية:</strong>';
        existingContainer.appendChild(header);

        // Display each existing attachment
        attachments.forEach((attachment, index) => {
            const attachmentItem = this.createExistingAttachmentItem(attachment, index, field);
            existingContainer.appendChild(attachmentItem);
        });
    }

    /**
     * Create existing attachment item display
     */
    createExistingAttachmentItem(attachment, index, field) {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'existing-attachment-item';

        const attachmentInfo = document.createElement('div');
        attachmentInfo.className = 'attachment-info';

        // File icon
        const icon = document.createElement('i');
        icon.className = this.getFileIcon(attachment.type || 'application/octet-stream');
        icon.className += ' attachment-icon';

        // File details
        const details = document.createElement('div');
        details.className = 'attachment-details';
        details.innerHTML = `
            <div class="attachment-name">${attachment.filename || attachment.name}</div>
            <div class="attachment-size">${this.formatFileSize(attachment.size || 0)}</div>
        `;

        attachmentInfo.appendChild(icon);
        attachmentInfo.appendChild(details);

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'attachment-actions';

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'btn btn-sm btn-outline-primary';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.title = 'تحميل الملف';

        downloadBtn.addEventListener('click', () => {
            this.downloadAttachment(attachment);
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'حذف الملف';

        deleteBtn.addEventListener('click', () => {
            this.deleteExistingAttachment(attachment, index, field, attachmentItem);
        });

        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);

        attachmentItem.appendChild(attachmentInfo);
        attachmentItem.appendChild(actions);

        return attachmentItem;
    }

    /**
     * Download existing attachment
     */
    downloadAttachment(attachment) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = `/uploads/${attachment.filename || attachment.name}`;
        link.download = attachment.original_name || attachment.filename || attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Delete existing attachment
     */
    deleteExistingAttachment(attachment, index, field, attachmentItem) {
        // Show confirmation dialog
        if (!confirm(`هل تريد حذف الملف "${attachment.original_name || attachment.filename || attachment.name}"؟`)) {
            return;
        }

        // Remove from UI immediately
        attachmentItem.remove();

        // Remove from current data
        if (this.currentData.attachments) {
            this.currentData.attachments.splice(index, 1);
        }

        // Mark for deletion (will be handled by the backend when saving)
        if (!this.currentData.deleted_attachments) {
            this.currentData.deleted_attachments = [];
        }
        this.currentData.deleted_attachments.push(attachment.filename || attachment.name);

        // Show success message
        this.showNotification('تم حذف الملف بنجاح', 'success');
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';

        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Initialize driver select functionality
     */
    initializeDriverSelect(fieldName) {
        const fieldId = `${this.modalId}_${fieldName}`;
        const searchId = `${fieldId}_search`;
        const dropdownId = `${fieldId}_dropdown`;
        const searchInput = document.getElementById(searchId);
        const hiddenInput = document.getElementById(fieldId);
        const dropdown = document.getElementById(dropdownId);

        if (!searchInput || !dropdown) return;

        let drivers = [];
        let filteredDrivers = [];
        let selectedIndex = -1;

        // Load drivers from API
        this.loadActiveDrivers()
            .then(data => {
                drivers = data;
                filteredDrivers = data;
                this.renderDriverOptions(dropdown, filteredDrivers);
                dropdown.style.display = 'none'; // Hide initially
            })
            .catch(error => {
                console.error('Error loading drivers:', error);
                dropdown.innerHTML = '<div class="p-2 text-danger">خطأ في تحميل السائقين</div>';
            });

        // Search functionality
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();

                if (query === '') {
                    filteredDrivers = drivers;
                } else {
                    filteredDrivers = drivers.filter(driver =>
                        driver.full_name.toLowerCase().includes(query) ||
                        driver.national_id.includes(query) ||
                        driver.phone.includes(query)
                    );
                }

                selectedIndex = -1;
                this.renderDriverOptions(dropdown, filteredDrivers);
                dropdown.style.display = 'block';
            }, 300);
        });

        // Show dropdown on focus
        searchInput.addEventListener('focus', () => {
            if (filteredDrivers.length > 0) {
                dropdown.style.display = 'block';
            }
        });

        // Hide dropdown on blur (with delay for click handling)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (dropdown.style.display === 'none') return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, filteredDrivers.length - 1);
                    this.highlightOption(dropdown, selectedIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    this.highlightOption(dropdown, selectedIndex);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && filteredDrivers[selectedIndex]) {
                        this.selectDriver(searchInput, hiddenInput, dropdown, filteredDrivers[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    dropdown.style.display = 'none';
                    break;
            }
        });
    }

    /**
     * Load active drivers from API
     */
    async loadActiveDrivers() {
        const response = await fetch('/api/drivers/active', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load drivers: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render driver options in dropdown
     */
    renderDriverOptions(dropdown, drivers) {
        if (!drivers || drivers.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted">لا توجد نتائج</div>';
            return;
        }

        const optionsHTML = drivers.map((driver, index) => `
            <div class="driver-option p-2 cursor-pointer border-bottom"
                 data-index="${index}"
                 data-driver-id="${driver.id}">
                <div class="fw-bold">${driver.full_name}</div>
                <small class="text-muted">${driver.national_id} - ${driver.phone}</small>
            </div>
        `).join('');

        dropdown.innerHTML = optionsHTML;

        // Ensure all driver options are visible (fix for potential CSS conflicts)
        setTimeout(() => {
            const allOptions = dropdown.querySelectorAll('.driver-option');
            allOptions.forEach((option) => {
                option.style.display = 'block';
                option.style.visibility = 'visible';
                option.style.opacity = '1';
            });
        }, 50);

        // Add click handlers
        dropdown.querySelectorAll('.driver-option').forEach(option => {
            option.addEventListener('click', () => {
                const driverIndex = parseInt(option.dataset.index);
                const driver = drivers[driverIndex];
                const searchInput = option.closest('.driver-select-container').querySelector('.driver-search-input');
                const hiddenInput = option.closest('.driver-select-container').querySelector('input[type="hidden"]');

                this.selectDriver(searchInput, hiddenInput, dropdown, driver);
            });
        });
    }

    /**
     * Highlight option during keyboard navigation
     */
    highlightOption(dropdown, index) {
        dropdown.querySelectorAll('.driver-option').forEach((option, i) => {
            if (i === index) {
                option.classList.add('bg-primary', 'text-white');
            } else {
                option.classList.remove('bg-primary', 'text-white');
            }
        });
    }

    /**
     * Select a driver
     */
    selectDriver(searchInput, hiddenInput, dropdown, driver) {
        searchInput.value = driver.display_text;
        hiddenInput.value = driver.id;
        dropdown.style.display = 'none';

        // Clear validation error if any
        const errorElement = document.getElementById(`${hiddenInput.id}_error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
        hiddenInput.classList.remove('is-invalid');
    }

    /**
     * Destroy modal
     */
    destroy() {
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            modalElement.remove();
        }
    }
}
