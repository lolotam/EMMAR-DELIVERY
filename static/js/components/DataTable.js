/**
 * Generic Data Table Component
 * مكون جدول البيانات العام
 */

class DataTable {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            title: options.title || 'البيانات',
            columns: options.columns || [],
            data: options.data || [],
            actions: options.actions || ['edit', 'delete'],
            searchable: options.searchable !== false,
            addButton: options.addButton !== false,
            exportable: options.exportable !== false,
            importable: options.importable !== false,
            pageSize: options.pageSize || 10,
            ...options
        };
        this.currentPage = 1;
        this.filteredData = [...this.options.data];
        this.searchTerm = '';
        this.columnFilters = {};
        this.sortColumn = null;
        this.sortDirection = 'asc';
    }

    /**
     * Render the complete data table
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID ${this.containerId} not found`);
            return;
        }

        container.innerHTML = this.getTableHTML();
        this.attachEventListeners();
        this.updateTable();
    }

    /**
     * Generate the table HTML structure
     */
    getTableHTML() {
        return `
            <div class="card table-container">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="${this.options.icon || 'fas fa-table'} me-2"></i>
                        ${this.options.title}
                    </h5>
                    <div class="btn-group" role="group">
                        ${this.options.addButton ? `
                            <button class="btn btn-success" id="${this.containerId}_addBtn">
                                <i class="fas fa-plus me-2"></i>
                                إضافة جديد
                            </button>
                        ` : ''}
                        ${this.options.exportable ? `
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-outline-primary dropdown-toggle"
                                        data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-download me-2"></i>
                                    تصدير
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" id="${this.containerId}_exportCSV">
                                        <i class="fas fa-file-csv me-2"></i>تصدير CSV
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" id="${this.containerId}_exportExcel">
                                        <i class="fas fa-file-excel me-2"></i>تصدير Excel
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" id="${this.containerId}_downloadTemplate">
                                        <i class="fas fa-file-download me-2"></i>تحميل قالب
                                    </a></li>
                                </ul>
                            </div>
                        ` : ''}
                        ${this.options.importable ? `
                            <button class="btn btn-outline-secondary" id="${this.containerId}_importBtn">
                                <i class="fas fa-upload me-2"></i>
                                استيراد
                            </button>
                            <input type="file" id="${this.containerId}_importFile"
                                   accept=".csv,.xlsx,.xls" style="display: none;">
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    ${this.options.searchable ? `
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                    <input type="text" class="form-control"
                                           id="${this.containerId}_search"
                                           placeholder="البحث العام...">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-outline-secondary" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#${this.containerId}_filters">
                                    <i class="fas fa-filter me-2"></i>
                                    فلاتر متقدمة
                                </button>
                                <button class="btn btn-outline-warning ms-2" id="${this.containerId}_resetFilters">
                                    <i class="fas fa-undo me-2"></i>
                                    إعادة تعيين
                                </button>
                            </div>
                            <div class="col-md-4 text-start">
                                <span class="text-muted" id="${this.containerId}_count">
                                    إجمالي السجلات: ${this.options.data.length}
                                </span>
                            </div>
                        </div>
                        <div class="collapse mb-3" id="${this.containerId}_filters">
                            <div class="card card-body">
                                <div class="row">
                                    ${this.options.columns.map(col => `
                                        <div class="col-md-3 mb-2">
                                            <label class="form-label small">${col.label}</label>
                                            <input type="text" class="form-control form-control-sm column-filter"
                                                   data-column="${col.field}" placeholder="فلترة ${col.label}...">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="table-responsive">
                        <table class="table table-hover" id="${this.containerId}_table">
                            <thead>
                                <tr>
                                    ${this.options.columns.map(col =>
                                        `<th class="sortable-header" data-column="${col.field}" style="cursor: pointer;">
                                            ${col.label}
                                            <i class="fas fa-sort ms-1 sort-icon" data-column="${col.field}"></i>
                                        </th>`
                                    ).join('')}
                                    ${this.options.actions.length > 0 ? '<th class="text-center">الإجراءات</th>' : ''}
                                </tr>
                            </thead>
                            <tbody id="${this.containerId}_tbody">
                                <!-- Table rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span class="text-muted" id="${this.containerId}_pageInfo">
                                <!-- Page info will be inserted here -->
                            </span>
                        </div>
                        <nav>
                            <ul class="pagination pagination-sm mb-0" id="${this.containerId}_pagination">
                                <!-- Pagination will be inserted here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search functionality
        if (this.options.searchable) {
            const searchInput = document.getElementById(`${this.containerId}_search`);
            if (searchInput) {
                searchInput.addEventListener('input', debounce((e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.filterData();
                    this.currentPage = 1;
                    this.updateTable();
                }, 300));
            }
        }

        // Add button
        if (this.options.addButton) {
            const addBtn = document.getElementById(`${this.containerId}_addBtn`);
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    if (this.options.onAdd) {
                        this.options.onAdd();
                    }
                });
            }
        }

        // Column filters
        const columnFilters = document.querySelectorAll(`#${this.containerId} .column-filter`);
        columnFilters.forEach(filter => {
            filter.addEventListener('input', debounce((e) => {
                const column = e.target.getAttribute('data-column');
                this.columnFilters[column] = e.target.value.toLowerCase();
                this.filterData();
                this.currentPage = 1;
                this.updateTable();
            }, 300));
        });

        // Reset filters
        const resetBtn = document.getElementById(`${this.containerId}_resetFilters`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Sorting functionality
        const sortableHeaders = document.querySelectorAll(`#${this.containerId} .sortable-header`);
        sortableHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const column = e.target.getAttribute('data-column') || e.target.closest('th').getAttribute('data-column');
                this.handleSort(column);
            });
        });

        // Export functionality
        if (this.options.exportable) {
            const exportCSVBtn = document.getElementById(`${this.containerId}_exportCSV`);
            if (exportCSVBtn) {
                exportCSVBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exportToCSV();
                });
            }

            const exportExcelBtn = document.getElementById(`${this.containerId}_exportExcel`);
            if (exportExcelBtn) {
                exportExcelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exportToExcel();
                });
            }

            const downloadTemplateBtn = document.getElementById(`${this.containerId}_downloadTemplate`);
            if (downloadTemplateBtn) {
                downloadTemplateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.downloadTemplate();
                });
            }
        }

        // Import functionality
        if (this.options.importable) {
            const importBtn = document.getElementById(`${this.containerId}_importBtn`);
            const importFile = document.getElementById(`${this.containerId}_importFile`);

            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    importFile.click();
                });
            }

            if (importFile) {
                importFile.addEventListener('change', (e) => {
                    this.handleImport(e.target.files[0]);
                });
            }
        }
    }

    /**
     * Filter data based on search term and column filters
     */
    filterData() {
        this.filteredData = this.options.data.filter(row => {
            // Global search filter
            let matchesGlobalSearch = true;
            if (this.searchTerm) {
                matchesGlobalSearch = this.options.columns.some(col => {
                    const value = this.getCellValue(row, col);
                    return value.toString().toLowerCase().includes(this.searchTerm);
                });
            }

            // Column-specific filters
            let matchesColumnFilters = true;
            for (const [column, filterValue] of Object.entries(this.columnFilters)) {
                if (filterValue) {
                    const cellValue = this.getCellValue(row, { field: column });
                    if (!cellValue.toString().toLowerCase().includes(filterValue)) {
                        matchesColumnFilters = false;
                        break;
                    }
                }
            }

            return matchesGlobalSearch && matchesColumnFilters;
        });

        // Apply sorting
        if (this.sortColumn) {
            this.applySorting();
        }
    }

    /**
     * Update table content
     */
    updateTable() {
        this.renderTableRows();
        this.renderPagination();
        this.updateCounters();
    }

    /**
     * Render table rows
     */
    renderTableRows() {
        const tbody = document.getElementById(`${this.containerId}_tbody`);
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${this.options.columns.length + (this.options.actions.length > 0 ? 1 : 0)}"
                        class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        لا توجد بيانات للعرض
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageData.map((row, index) => this.renderTableRow(row, startIndex + index + 1)).join('');
        this.attachRowEventListeners();
    }

    /**
     * Render a single table row
     */
    renderTableRow(row, rowNumber = null) {
        const cells = this.options.columns.map(col => {
            if (col.field === 'row_number' && rowNumber !== null) {
                return `<td class="text-center fw-bold">${rowNumber}</td>`;
            }
            const value = this.getCellValue(row, col);
            const formattedValue = this.formatCellValue(value, col);
            return `<td>${formattedValue}</td>`;
        }).join('');

        const actions = this.options.actions.length > 0 ? `
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    ${this.options.actions.map(action => this.renderActionButton(action, row)).join('')}
                </div>
            </td>
        ` : '';

        return `<tr data-id="${row.id}">${cells}${actions}</tr>`;
    }

    /**
     * Render action button
     */
    renderActionButton(action, row) {
        const actionConfig = {
            edit: { icon: 'fas fa-edit', class: 'btn-primary', title: 'تعديل' },
            delete: { icon: 'fas fa-trash', class: 'btn-danger', title: 'حذف' },
            view: { icon: 'fas fa-eye', class: 'btn-info', title: 'عرض' },
            history: { icon: 'fas fa-history', class: 'btn-warning', title: 'سجل السائق' }
        };

        const config = actionConfig[action] || { icon: 'fas fa-cog', class: 'btn-secondary', title: action };

        return `
            <button class="btn ${config.class} btn-sm" 
                    data-action="${action}" 
                    data-id="${row.id}"
                    title="${config.title}">
                <i class="${config.icon}"></i>
            </button>
        `;
    }

    /**
     * Get cell value from row data
     */
    getCellValue(row, column) {
        if (!column.field) {
            return '';
        }

        const value = row[column.field];

        if (value === null || value === undefined) {
            return '';
        }

        switch (column.type) {
            case 'number':
                return value.toString();
            case 'currency':
                return value; // Return raw value, let formatCellValue handle formatting
            case 'date':
                return value; // Return raw value, let formatCellValue handle formatting
            case 'phone':
                return value; // Return raw value, let formatCellValue handle formatting
            case 'employment_type':
                return this.formatEmploymentType(value);
            case 'car_ownership':
                return this.formatCarOwnership(value);
            case 'order_count':
                return this.formatOrderCount(row);
            case 'advance_count':
                return this.formatAdvanceCount(row);
            case 'residency_status':
                return this.formatResidencyStatus(row.residence_status, row.residency_expiry_date);
            case 'breakdown_status':
                return this.formatBreakdownStatus(value);
            case 'vehicle_info':
                return this.getVehicleInfo(row);
            case 'status':
                // Handle both boolean and string status values
                const isActive = value === true || value === 'active' || value === 'نشط' || value === 1 || value === "true" || value === 'true';
                const statusClass = isActive ? 'success' : 'secondary';
                const statusText = isActive ? 'نشط' : 'غير نشط';
                return `<span class="badge bg-${statusClass}">${statusText}</span>`;
            default:
                return value.toString();
        }
    }

    /**
     * Get cell value for export (plain text without HTML)
     * This method returns clean text values suitable for CSV/Excel export
     */
    getExportValue(row, col) {
        const value = row[col.key];

        if (value === null || value === undefined) {
            return '';
        }

        switch (col.key) {
            case 'phone':
                return this.formatPhoneRTL(value);
            case 'order_count':
                return this.getOrderCount(row);
            case 'advance_count':
                return this.getAdvanceCount(row);
            case 'residency_status':
                return this.getResidencyStatusText(row.residence_status, row.residency_expiry_date);
            case 'breakdown_status':
                return this.getBreakdownStatusText(value);
            case 'status':
                // Return plain text for status (no HTML badges)
                const isActive = value === true || value === 'active' || value === 'نشط' || value === 1 || value === "true" || value === 'true';
                return isActive ? 'نشط' : 'غير نشط';
            case 'payment_terms':
                return this.getPaymentTermsText(value);
            case 'vehicle_info':
                return this.getVehicleInfo(row);
            default:
                return value.toString();
        }
    }

    /**
     * Get residency status as plain text (for export)
     */
    getResidencyStatusText(storedStatus, expiryDate) {
        // If we have a stored status, use it; otherwise calculate from expiry date
        let status = storedStatus;
        if (!status && expiryDate) {
            const today = new Date();
            const expiry = new Date(expiryDate);
            const diffTime = expiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                status = 'منتهية';
            } else if (diffDays < 30) {
                status = 'أقل من شهر';
            } else if (diffDays < 90) {
                status = 'أقل من 3 شهور';
            } else {
                status = 'صالحة';
            }
        }

        return status || 'غير محدد';
    }

    /**
     * Get breakdown status as plain text (for export)
     */
    getBreakdownStatusText(value) {
        if (!value) return '';

        switch (value) {
            case 'pending':
                return 'في الانتظار';
            case 'in_progress':
                return 'قيد الإصلاح';
            case 'completed':
                return 'مكتمل';
            case 'cancelled':
                return 'ملغي';
            default:
                return value.toString();
        }
    }

    /**
     * Get order count as plain number (for export)
     */
    getOrderCount(row) {
        // Return just the number without HTML formatting
        return row.order_count || 0;
    }

    /**
     * Get advance count as plain number (for export)
     */
    getAdvanceCount(row) {
        // Return just the number without HTML formatting
        return row.advance_count || 0;
    }

    /**
     * Format phone number for RTL display
     */
    formatPhoneRTL(phone) {
        if (!phone) return '';

        // Remove any existing formatting
        const cleanPhone = phone.replace(/[^\d+]/g, '');

        // Extract country code and number
        if (cleanPhone.startsWith('+965')) {
            const countryCode = '+965';
            const number = cleanPhone.substring(4);

            // Format as +96599887766 (no parentheses, no spaces)
            if (number.length === 8) {
                return `${countryCode}${number}`;
            }
        }

        return phone; // Return original if can't format
    }

    /**
     * Format employment type in Arabic
     */
    formatEmploymentType(type) {
        const typeMap = {
            'commission': 'بالعمولة',
            'salary': 'راتب ثابت',
            'mixed': 'مختلط'
        };
        return typeMap[type] || type;
    }

    /**
     * Format car ownership in Arabic
     */
    formatCarOwnership(ownership) {
        const ownershipMap = {
            'private': 'خاص',
            'company': 'شركة'
        };
        return ownershipMap[ownership] || ownership;
    }

    /**
     * Format vehicle information for company car drivers
     */
    formatVehicleInfo(vehicleInfo) {
        if (!vehicleInfo) return '';
        return `<span class="text-info small">${vehicleInfo}</span>`;
    }

    /**
     * Get vehicle information for a driver
     */
    getVehicleInfo(driver) {
        // Only show vehicle info for company car drivers
        if (driver.car_ownership !== 'company') {
            return '';
        }

        // Find vehicle assigned to this driver (reverse lookup)
        if (window.vehiclesData && Array.isArray(window.vehiclesData)) {
            const assignedVehicle = window.vehiclesData.find(v =>
                v.assigned_driver_id === driver.id && v.is_active
            );
            if (assignedVehicle) {
                return `${assignedVehicle.make} ${assignedVehicle.model} - ${assignedVehicle.license_plate}`;
            }
        }

        // No vehicle assigned or vehicle data not available
        return '';
    }

    /**
     * Format assigned driver by looking up driver name from ID
     */
    formatAssignedDriver(driverId) {
        if (!driverId) return '<span class="text-muted">غير مخصص</span>';

        // Try to get driver name from global drivers data if available
        if (window.driversData && Array.isArray(window.driversData)) {
            const driver = window.driversData.find(d => d.id === driverId);
            if (driver) {
                return `<span class="text-primary">${driver.full_name}</span>`;
            }
        }

        // Fallback to showing the ID if driver data not available
        return `<span class="text-muted">سائق (${driverId.substring(0, 8)})</span>`;
    }

    /**
     * Format order count for drivers
     */
    formatOrderCount(driver) {
        // Only show for commission and mixed employment types
        if (driver.employment_type === 'salary') {
            return '<span class="text-muted">غير مطبق</span>';
        }

        // Get order count from orders data (this would be calculated from actual orders)
        const orderCount = this.getDriverOrderCount(driver.id);
        return `<span class="badge bg-info">${orderCount}</span>`;
    }

    /**
     * Format advance count as clickable link
     */
    formatAdvanceCount(driver) {
        const advanceCount = this.getDriverAdvanceCount(driver.id);
        if (advanceCount === 0) {
            return '<span class="text-muted">0</span>';
        }

        return `<a href="#" class="advance-link text-primary fw-bold" data-driver-id="${driver.id}" onclick="window.app.showDriverAdvances('${driver.id}'); return false;">
            ${advanceCount}
        </a>`;
    }

    /**
     * Get driver order count (placeholder - would integrate with actual orders data)
     */
    getDriverOrderCount(driverId) {
        // This would be calculated from actual orders data
        // For now, return a random number for demonstration
        const counts = [5, 8, 12, 3, 15, 7, 20, 1, 9, 11];
        return counts[Math.abs(driverId.charCodeAt(driverId.length - 1)) % counts.length];
    }

    /**
     * Get driver advance count (placeholder - would integrate with actual advances data)
     */
    getDriverAdvanceCount(driverId) {
        // This would be calculated from actual advances data
        // For now, return a random number for demonstration
        const counts = [0, 1, 2, 0, 3, 1, 0, 2, 1, 0];
        return counts[Math.abs(driverId.charCodeAt(driverId.length - 1)) % counts.length];
    }

    /**
     * Format residency status based on stored status and expiry date
     */
    formatResidencyStatus(storedStatus, expiryDate) {
        // If we have a stored status, use it; otherwise calculate from expiry date
        let status = storedStatus;
        if (!status && expiryDate) {
            const today = new Date();
            const expiry = new Date(expiryDate);
            const diffTime = expiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                status = 'منتهية';
            } else if (diffDays < 30) {
                status = 'أقل من شهر';
            } else if (diffDays < 90) {
                status = 'أقل من 3 شهور';
            } else {
                status = 'صالحة';
            }
        }

        if (!status) return '<span class="text-muted">غير محدد</span>';

        // Format with appropriate badge colors
        switch (status) {
            case 'منتهية':
                return '<span class="badge bg-danger">منتهية</span>';
            case 'أقل من شهر':
                return '<span class="badge bg-warning">أقل من شهر</span>';
            case 'أقل من 3 شهور':
                return '<span class="badge bg-warning">أقل من 3 شهور</span>';
            case 'صالحة':
                return '<span class="badge bg-success">صالحة</span>';
            default:
                return `<span class="badge bg-secondary">${status}</span>`;
        }
    }

    /**
     * Format breakdown status
     */
    formatBreakdownStatus(status) {
        const statusMap = {
            'pending': { class: 'warning', text: 'في الانتظار' },
            'in_progress': { class: 'info', text: 'قيد الإصلاح' },
            'completed': { class: 'success', text: 'مكتمل' },
            'cancelled': { class: 'danger', text: 'ملغي' }
        };

        const statusInfo = statusMap[status] || { class: 'secondary', text: status };
        return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
    }

    /**
     * Format payment terms
     */
    formatPaymentTerms(value) {
        const paymentTermsMap = {
            'cash': 'نقداً',
            'credit_30': 'آجل 30 يوم',
            'credit_15': 'آجل 15 يوم',
            'credit_7': 'آجل 7 يوم'
        };

        return paymentTermsMap[value] || value;
    }

    /**
     * Get payment terms text for export
     */
    getPaymentTermsText(value) {
        const paymentTermsMap = {
            'cash': 'نقداً',
            'credit_30': 'آجل 30 يوم',
            'credit_15': 'آجل 15 يوم',
            'credit_7': 'آجل 7 يوم'
        };

        return paymentTermsMap[value] || value;
    }

    /**
     * Format cell value based on column type
     */
    formatCellValue(value, column) {
        if (!value && value !== 0) return '-';

        switch (column.type) {
            case 'currency':
                return formatCurrency(value);
            case 'date':
                return formatDateShort(value);
            case 'datetime':
                return formatDateTime(value);
            case 'phone':
                return this.formatPhoneRTL(value);
            case 'boolean':
                return value ?
                    '<span class="badge bg-success">نعم</span>' :
                    '<span class="badge bg-secondary">لا</span>';
            case 'order_status':
                const orderStatusMap = {
                    'pending': { class: 'warning', text: 'في الانتظار' },
                    'in_progress': { class: 'info', text: 'قيد التنفيذ' },
                    'completed': { class: 'success', text: 'مكتمل' },
                    'cancelled': { class: 'danger', text: 'ملغي' }
                };
                const orderStatus = orderStatusMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${orderStatus.class}">${orderStatus.text}</span>`;
            case 'advance_status':
                const advanceStatusMap = {
                    'active': { class: 'warning', text: 'نشطة' },
                    'partial': { class: 'info', text: 'مدفوعة جزئياً' },
                    'paid': { class: 'success', text: 'مدفوعة بالكامل' },
                    'cancelled': { class: 'danger', text: 'ملغية' }
                };
                const advanceStatus = advanceStatusMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${advanceStatus.class}">${advanceStatus.text}</span>`;
            case 'payroll_status':
                const payrollStatusMap = {
                    'pending': { class: 'warning', text: 'في الانتظار' },
                    'approved': { class: 'success', text: 'معتمدة' },
                    'closed': { class: 'secondary', text: 'مغلقة' }
                };
                const payrollStatus = payrollStatusMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${payrollStatus.class}">${payrollStatus.text}</span>`;
            case 'maintenance_status':
                const maintenanceStatusMap = {
                    'scheduled': { class: 'info', text: 'مجدولة' },
                    'pending': { class: 'warning', text: 'في الانتظار' },
                    'in_progress': { class: 'primary', text: 'قيد التنفيذ' },
                    'completed': { class: 'success', text: 'مكتملة' },
                    'cancelled': { class: 'danger', text: 'ملغية' }
                };
                const maintenanceStatus = maintenanceStatusMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${maintenanceStatus.class}">${maintenanceStatus.text}</span>`;
            case 'maintenance_priority':
                const maintenancePriorityMap = {
                    'low': { class: 'secondary', text: 'منخفضة' },
                    'normal': { class: 'primary', text: 'عادية' },
                    'high': { class: 'warning', text: 'عالية' },
                    'urgent': { class: 'danger', text: 'عاجلة' }
                };
                const maintenancePriority = maintenancePriorityMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${maintenancePriority.class}">${maintenancePriority.text}</span>`;
            case 'status':
                // Status HTML is already formatted in getCellValue, return as-is
                return value;
            case 'residency_status':
                // Residency status HTML is already formatted in getCellValue, return as-is
                return value;
            case 'breakdown_status':
                // Breakdown status HTML is already formatted in getCellValue, return as-is
                return value;
            case 'registration_status':
                // Registration status badges with different colors
                const registrationStatusMap = {
                    'صالحة': { class: 'success', text: 'صالحة' },
                    'منتهية': { class: 'danger', text: 'منتهية' },
                    'أقل من 3 شهور': { class: 'warning', text: 'أقل من 3 شهور' },
                    'أقل من شهر': { class: 'warning', text: 'أقل من شهر' },
                    'غير محدد': { class: 'secondary', text: 'غير محدد' }
                };
                const regStatus = registrationStatusMap[value] || { class: 'secondary', text: value };
                return `<span class="badge bg-${regStatus.class}">${regStatus.text}</span>`;
            case 'assigned_driver':
                // Look up driver name by ID
                return this.formatAssignedDriver(value);
            case 'payment_terms':
                return this.formatPaymentTerms(value);
            case 'vehicle_info':
                return this.formatVehicleInfo(value);
            default:
                return escapeHtml(value.toString());
        }
    }

    /**
     * Attach event listeners to row actions
     */
    attachRowEventListeners() {
        const tbody = document.getElementById(`${this.containerId}_tbody`);
        if (!tbody) return;

        tbody.addEventListener('click', (e) => {
            if (e.target.matches('button[data-action]') || e.target.closest('button[data-action]')) {
                const button = e.target.closest('button[data-action]');
                const action = button.getAttribute('data-action');
                const id = button.getAttribute('data-id');
                const row = this.options.data.find(r => r.id === id);

                if (row) {
                    this.handleAction(action, row);
                }
            }
        });
    }

    /**
     * Handle action button clicks
     */
    handleAction(action, row) {
        switch (action) {
            case 'edit':
                if (this.options.onEdit) {
                    this.options.onEdit(row);
                }
                break;
            case 'delete':
                if (this.options.onDelete) {
                    this.options.onDelete(row);
                }
                break;
            case 'view':
                if (this.options.onView) {
                    this.options.onView(row);
                }
                break;
            case 'history':
                if (this.options.onHistory) {
                    this.options.onHistory(row);
                }
                break;
            default:
                if (this.options.onAction) {
                    this.options.onAction(action, row);
                }
        }
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = document.getElementById(`${this.containerId}_pagination`);
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">السابق</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">التالي</a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;

        // Attach pagination event listeners
        pagination.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.matches('a[data-page]')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                if (page >= 1 && page <= totalPages && page !== this.currentPage) {
                    this.currentPage = page;
                    this.updateTable();
                }
            }
        });
    }

    /**
     * Update counters and page info
     */
    updateCounters() {
        // Update total count
        const countElement = document.getElementById(`${this.containerId}_count`);
        if (countElement) {
            countElement.textContent = `إجمالي السجلات: ${this.filteredData.length}`;
        }

        // Update page info
        const pageInfoElement = document.getElementById(`${this.containerId}_pageInfo`);
        if (pageInfoElement) {
            const startIndex = (this.currentPage - 1) * this.options.pageSize + 1;
            const endIndex = Math.min(this.currentPage * this.options.pageSize, this.filteredData.length);
            const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
            
            if (this.filteredData.length > 0) {
                pageInfoElement.textContent = `عرض ${startIndex} إلى ${endIndex} من ${this.filteredData.length} (صفحة ${this.currentPage} من ${totalPages})`;
            } else {
                pageInfoElement.textContent = 'لا توجد بيانات';
            }
        }
    }

    /**
     * Update table data
     */
    updateData(newData) {
        this.options.data = newData;
        this.filterData();
        this.currentPage = 1;
        this.updateTable();

        // Force refresh of dynamic columns that depend on external data
        this.refreshDynamicColumns();
    }

    /**
     * Refresh table
     */
    refresh() {
        this.updateTable();
        this.refreshDynamicColumns();
    }

    /**
     * Refresh dynamic columns that depend on external data
     * This is particularly important for vehicle_info columns that change based on car_ownership
     */
    refreshDynamicColumns() {
        // Check if we have dynamic columns that need refreshing
        const hasDynamicColumns = this.options.columns.some(col =>
            col.type === 'vehicle_info' || col.type === 'assigned_driver'
        );

        if (hasDynamicColumns) {
            // Small delay to ensure external data (like window.vehiclesData) is updated
            setTimeout(() => {
                this.renderTableRows();
            }, 50);
        }
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.searchTerm = '';
        this.columnFilters = {};
        this.sortColumn = null;
        this.sortDirection = 'asc';

        // Clear input fields
        const searchInput = document.getElementById(`${this.containerId}_search`);
        if (searchInput) searchInput.value = '';

        const columnFilters = document.querySelectorAll(`#${this.containerId} .column-filter`);
        columnFilters.forEach(filter => filter.value = '');

        // Update sort icons
        const sortIcons = document.querySelectorAll(`#${this.containerId} .sort-icon`);
        sortIcons.forEach(icon => {
            icon.className = 'fas fa-sort ms-1 sort-icon';
        });

        this.filterData();
        this.currentPage = 1;
        this.updateTable();
    }

    /**
     * Handle column sorting
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort icons
        const sortIcons = document.querySelectorAll(`#${this.containerId} .sort-icon`);
        sortIcons.forEach(icon => {
            const iconColumn = icon.getAttribute('data-column');
            if (iconColumn === column) {
                icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ms-1 sort-icon`;
            } else {
                icon.className = 'fas fa-sort ms-1 sort-icon';
            }
        });

        this.filterData();
        this.updateTable();
    }

    /**
     * Apply sorting to filtered data
     */
    applySorting() {
        if (!this.sortColumn) return;

        this.filteredData.sort((a, b) => {
            const aValue = this.getCellValue(a, { field: this.sortColumn });
            const bValue = this.getCellValue(b, { field: this.sortColumn });

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;

            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        try {
            const headers = this.options.columns.map(col => col.label);
            const csvContent = [
                headers.join(','),
                ...this.filteredData.map(row =>
                    this.options.columns.map(col => {
                        const value = this.getExportValue(row, col);
                        // Escape commas and quotes in CSV
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            // Add BOM for proper Arabic encoding
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

            this.downloadFile(blob, `${this.options.title}_${new Date().toISOString().split('T')[0]}.csv`);

            if (window.showSuccess) {
                showSuccess('تم تصدير البيانات بنجاح');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (window.showError) {
                showError('حدث خطأ أثناء تصدير البيانات');
            }
        }
    }

    /**
     * Export data to Excel (simplified CSV with .xlsx extension)
     */
    exportToExcel() {
        try {
            const headers = this.options.columns.map(col => col.label);
            const csvContent = [
                headers.join('\t'), // Use tabs for better Excel compatibility
                ...this.filteredData.map(row =>
                    this.options.columns.map(col => {
                        const value = this.getExportValue(row, col);
                        return value.toString().replace(/\t/g, ' ');
                    }).join('\t')
                )
            ].join('\n');

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });

            this.downloadFile(blob, `${this.options.title}_${new Date().toISOString().split('T')[0]}.xlsx`);

            if (window.showSuccess) {
                showSuccess('تم تصدير البيانات بنجاح');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (window.showError) {
                showError('حدث خطأ أثناء تصدير البيانات');
            }
        }
    }

    /**
     * Download template file
     */
    downloadTemplate() {
        try {
            const headers = this.options.columns.map(col => col.label);
            const sampleRow = this.options.columns.map(col => {
                // Provide sample data based on field type
                switch (col.type) {
                    case 'text': return 'نص تجريبي';
                    case 'phone': return '+96512345678';
                    case 'email': return 'example@domain.com';
                    case 'date': return '2025-01-01';
                    case 'currency': return '100.000';
                    case 'number': return '123';
                    case 'status': return 'نشط';
                    default: return 'قيمة تجريبية';
                }
            });

            const csvContent = [
                headers.join(','),
                sampleRow.map(value => `"${value}"`).join(',')
            ].join('\n');

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

            this.downloadFile(blob, `قالب_${this.options.title}.csv`);

            if (window.showSuccess) {
                showSuccess('تم تحميل القالب بنجاح');
            }
        } catch (error) {
            console.error('Template download error:', error);
            if (window.showError) {
                showError('حدث خطأ أثناء تحميل القالب');
            }
        }
    }

    /**
     * Handle file import
     */
    async handleImport(file) {
        if (!file) return;

        try {
            if (window.showLoading) {
                showLoading('جاري استيراد البيانات...');
            }

            const text = await this.readFileAsText(file);
            const rows = text.split('\n').filter(row => row.trim());

            if (rows.length < 2) {
                throw new Error('الملف يجب أن يحتوي على رأس الجدول وسجل واحد على الأقل');
            }

            const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
            const dataRows = rows.slice(1);

            const importedData = dataRows.map(row => {
                const values = row.split(',').map(v => v.replace(/"/g, '').trim());
                const rowData = {};

                headers.forEach((header, index) => {
                    const column = this.options.columns.find(col => col.label === header);
                    if (column) {
                        rowData[column.field] = values[index] || '';
                    }
                });

                return rowData;
            });

            if (this.options.onImport) {
                await this.options.onImport(importedData);
            }

            if (window.hideLoading) {
                hideLoading();
            }

            // Success message is now handled by the onImport callback
            // This prevents showing success when validation actually fails

        } catch (error) {
            if (window.hideLoading) {
                hideLoading();
            }

            console.error('Import error:', error);
            if (window.showError) {
                showError('حدث خطأ أثناء استيراد البيانات: ' + error.message);
            }
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('خطأ في قراءة الملف'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Download file helper
     */
    downloadFile(blob, filename) {
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
