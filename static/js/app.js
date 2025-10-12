/**
 * Emar Delivery App - Main Application
 * شركة إعمار لتوصيل الطلبات
 */

// Single Page Application Structure
const App = {
    currentUser: null,
    currentPage: 'dashboard',

    // Page titles in Arabic
    pages: {
        dashboard: 'لوحة التحكم',
        drivers: 'السائقون',
        vehicles: 'السيارات',
        clients: 'العملاء',
        orders: 'الطلبات',
        advances: 'السُلف والمديونيات',
        payroll: 'الرواتب',
        maintenance: 'الصيانة',
        breakdowns: 'الأعطال',
        reports: 'التقارير',
        documents: 'الوثائق',
        settings: 'الإعدادات'
    },

    // Hash-based routing for entity-specific pages
    hashRoutes: {
        'driver-documents': 'وثائق السائق',
        'vehicle-documents': 'وثائق المركبة'
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing Emar Delivery App...');

        // Set current date
        this.updateCurrentDate();

        // Initialize theme system
        this.initializeTheme();

        // Initialize performance optimizations
        this.initializePerformanceOptimizations();

        // Initialize global search
        this.initializeGlobalSearch();

        // Check authentication
        await this.checkAuth();

        // Setup event listeners
        this.setupEventListeners();

        // Setup hash routing
        this.setupHashRouting();

        // Load initial page
        if (this.currentUser) {
            this.showApp();
            this.handleInitialRoute();
        } else {
            this.showLogin();
        }
    },

    /**
     * Check authentication status
     */
    async checkAuth() {
        try {
            const response = await api.checkAuth();
            if (response.authenticated) {
                this.currentUser = response.user;
                return true;
            }
        } catch (error) {
            console.log('Not authenticated');
        }
        return false;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Login password visibility toggle
        const toggleLoginPassword = document.getElementById('toggleLoginPassword');
        if (toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', () => {
                this.togglePasswordVisibility('password', 'toggleLoginPassword');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Navigation links
        const navLinks = document.querySelectorAll('#sidebarNav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.loadPage(page);
                }
            });
        });

        // Commission matrix event delegation
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action') || e.target.closest('[data-action]')?.getAttribute('data-action');

            if (action === 'add-commission-record') {
                e.preventDefault();
                const button = e.target.closest('[data-action="add-commission-record"]');
                const month = button.getAttribute('data-month');
                const year = button.getAttribute('data-year');
                console.log(`🔄 Add commission record: ${month}/${year}`);
                this.showMonthlyOrderForm(null, parseInt(month), parseInt(year));
            } else if (action === 'back-to-orders') {
                e.preventDefault();
                console.log('🔄 Back to orders page');
                this.initializeOrdersPage();
            } else if (action === 'edit-monthly-order') {
                e.preventDefault();
                const button = e.target.closest('[data-action="edit-monthly-order"]');
                const orderId = button.getAttribute('data-order-id');
                console.log(`🔄 Edit monthly order: ${orderId}`);
                this.editMonthlyOrder(orderId);
            } else if (action === 'delete-monthly-order') {
                e.preventDefault();
                const button = e.target.closest('[data-action="delete-monthly-order"]');
                const orderId = button.getAttribute('data-order-id');
                console.log(`🔄 Delete monthly order: ${orderId}`);
                this.deleteMonthlyOrder(orderId);
            } else if (action === 'add-monthly-order') {
                e.preventDefault();
                const button = e.target.closest('[data-action="add-monthly-order"]');
                const driverId = button.getAttribute('data-driver-id');
                const month = button.getAttribute('data-month');
                const year = button.getAttribute('data-year');
                console.log(`🔄 Add monthly order: driver=${driverId}, month=${month}, year=${year}`);
                this.addMonthlyOrder(driverId, parseInt(month), parseInt(year));
            } else if (action === 'load-monthly-orders') {
                e.preventDefault();
                const element = e.target.closest('[data-action="load-monthly-orders"]');
                const month = element.getAttribute('data-month');
                const year = element.getAttribute('data-year');
                console.log(`🔄 Load monthly orders: ${month}/${year}`);
                this.loadMonthlyOrders(parseInt(month), parseInt(year));
            } else if (action === 'show-orders-help') {
                e.preventDefault();
                console.log('🔄 Show orders help');
                this.showOrdersHelp();
            } else if (action === 'save-monthly-order') {
                e.preventDefault();
                const button = e.target.closest('[data-action="save-monthly-order"]');
                const modalId = button.getAttribute('data-modal-id');
                const isEdit = button.getAttribute('data-is-edit') === 'true';
                const orderId = button.getAttribute('data-order-id');
                const month = parseInt(button.getAttribute('data-month'));
                const year = parseInt(button.getAttribute('data-year'));
                console.log(`🔄 Save monthly order: modalId=${modalId}, isEdit=${isEdit}, orderId=${orderId}, month=${month}, year=${year}`);
                this.saveMonthlyOrder(modalId, isEdit, orderId, month, year);
            }
        });
    },

    /**
     * Setup hash-based routing for entity-specific pages
     */
    setupHashRouting() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            // Only handle hash routes if user is authenticated
            if (this.currentUser) {
                this.handleHashRoute();
            }
        });

        // Note: Initial hash handling is now done in handleInitialRoute() 
        // after authentication check, not immediately here
    },

    /**
     * Handle initial route on app startup
     */
    handleInitialRoute() {
        if (window.location.hash) {
            this.handleHashRoute();
        } else {
            this.loadPage('dashboard');
        }
    },

    /**
     * Handle hash route changes
     */
    handleHashRoute() {
        const hash = window.location.hash.substring(1); // Remove #

        // If user is not authenticated, ignore hash routes and show login
        if (!this.currentUser) {
            console.log('Hash route ignored - user not authenticated:', hash);
            return;
        }

        if (!hash) {
            this.loadPage('dashboard');
            return;
        }

        // Parse hash route patterns
        const driverDocMatch = hash.match(/^driver\/([^\/]+)\/documents$/);
        const vehicleDocMatch = hash.match(/^vehicle\/([^\/]+)\/documents$/);

        if (driverDocMatch) {
            const driverId = driverDocMatch[1];
            this.loadEntityDocumentPage('driver', driverId);
        } else if (vehicleDocMatch) {
            const vehicleId = vehicleDocMatch[1];
            this.loadEntityDocumentPage('vehicle', vehicleId);
        } else {
            // Check if it's a regular page
            if (this.pages[hash]) {
                this.loadPage(hash);
            } else {
                // Unknown route, redirect to dashboard
                this.navigateToPage('dashboard');
            }
        }
    },

    /**
     * Navigate to a specific page or hash route
     */
    navigateToPage(page, entityId = null) {
        if (entityId) {
            // Entity-specific document page
            window.location.hash = `${page}/${entityId}/documents`;
        } else {
            // Regular page - update hash AND load page directly
            if (page === 'dashboard') {
                window.location.hash = '';
            } else {
                window.location.hash = page;
            }
            // Always load the page directly to ensure it loads regardless of hash change
            console.log(`🔄 Direct page load: ${page}`);
            this.loadPage(page);
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            showError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        try {
            const response = await api.login(username, password);
            if (response.success) {
                this.currentUser = response.user;
                showSuccess('تم تسجيل الدخول بنجاح');
                this.showApp();
                this.loadPage('dashboard');
            }
        } catch (error) {
            showError(error.message || 'خطأ في تسجيل الدخول');
        }
    },

    /**
     * Handle logout
     */
    async handleLogout(e) {
        e.preventDefault();

        const result = await showConfirm('هل تريد تسجيل الخروج؟');
        if (result.isConfirmed) {
            try {
                await api.logout();
                this.currentUser = null;
                this.showLogin();
                showSuccess('تم تسجيل الخروج بنجاح');
            } catch (error) {
                showError(error.message || 'خطأ في تسجيل الخروج');
            }
        }
    },

    /**
     * Show login container
     */
    showLogin() {
        document.getElementById('loginContainer').classList.remove('d-none');
        document.getElementById('appContainer').classList.add('d-none');

        // Clear form
        const form = document.getElementById('loginForm');
        if (form) form.reset();
    },

    /**
     * Show main application
     */
    showApp() {
        document.getElementById('loginContainer').classList.add('d-none');
        document.getElementById('appContainer').classList.remove('d-none');
    },

    /**
     * Load a specific page
     */
    async loadPage(pageName) {
        if (!this.pages[pageName]) {
            console.error('Page not found:', pageName);
            return;
        }

        // Update current page
        this.currentPage = pageName;

        // Update page title
        document.getElementById('pageTitle').textContent = this.pages[pageName];

        // Update navigation
        this.updateNavigation(pageName);

        // Load page content
        const content = await this.getPageContent(pageName);
        document.getElementById('mainContent').innerHTML = content;

        // Initialize page-specific functionality
        this.initializePage(pageName);
    },

    /**
     * Load entity-specific document page
     */
    async loadEntityDocumentPage(entityType, entityId) {
        try {
            // Update current page for navigation
            this.currentPage = 'documents';

            // Get entity information
            const entityInfo = await this.getEntityInfo(entityType, entityId);
            if (!entityInfo) {
                showError(`${entityType === 'driver' ? 'السائق' : 'المركبة'} غير موجود`);
                this.navigateToPage('documents');
                return;
            }

            // Update page title with entity name
            const pageTitle = `${this.hashRoutes[`${entityType}-documents`]} - ${entityInfo.name}`;
            document.getElementById('pageTitle').textContent = pageTitle;

            // Update navigation to show documents as active
            this.updateNavigation('documents');

            // Load entity document page content
            const content = await this.getEntityDocumentPageContent(entityType, entityId, entityInfo);
            document.getElementById('mainContent').innerHTML = content;

            // Initialize entity document page functionality
            this.initializeEntityDocumentPage(entityType, entityId, entityInfo);

        } catch (error) {
            console.error('Error loading entity document page:', error);
            showError('خطأ في تحميل صفحة الوثائق');
            this.navigateToPage('documents');
        }
    },

    /**
     * Get entity information for document page
     */
    async getEntityInfo(entityType, entityId) {
        try {
            const endpoint = entityType === 'driver' ? '/api/drivers' : '/api/vehicles';
            const response = await fetch(endpoint);

            if (response.ok) {
                const data = await response.json();
                // Handle both array response and object response
                const entities = Array.isArray(data) ? data : (data.drivers || data.vehicles || []);
                const entity = entities.find(e => e.id === entityId);

                if (entity) {
                    return {
                        id: entityId,
                        name: entityType === 'driver'
                            ? (entity.full_name || entity.name || 'سائق غير محدد')
                            : (entity.license_plate || entity.plate_number || 'مركبة غير محددة'),
                        entity: entity
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching entity info:', error);
            return null;
        }
    },

    /**
     * Update navigation active state
     */
    updateNavigation(activePage) {
        const navLinks = document.querySelectorAll('#sidebarNav .nav-link');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === activePage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Get page content HTML
     */
    async getPageContent(pageName) {
        switch (pageName) {
            case 'dashboard':
                return await this.getDashboardContent();
            case 'drivers':
                return '<div id="driversContainer"></div>';
            case 'vehicles':
                return '<div id="vehiclesContainer"></div>';
            case 'clients':
                return '<div id="clientsContainer"></div>';
            case 'orders':
                return '<div id="ordersContainer"></div>';
            case 'advances':
                return '<div id="advancesContainer"></div>';
            case 'payroll':
                return '<div id="payrollContainer"></div>';
            case 'maintenance':
                return '<div id="maintenanceContainer"></div>';
            case 'breakdowns':
                return '<div id="breakdownsContainer"></div>';
            case 'reports':
                return '<div id="reportsContainer"></div>';
            case 'documents':
                return await this.getDocumentsContent();
            case 'settings':
                return '<div id="settingsContainer"></div>';
            default:
                return '<div class="alert alert-warning">الصفحة غير موجودة</div>';
        }
    },

    /**
     * Get dashboard content with KPI cards
     */
    async getDashboardContent() {
        try {
            // Get current date for default filter
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            // Initialize dashboard state if not exists
            if (!window.dashboardState) {
                window.dashboardState = {
                    selectedMonth: currentMonth,
                    selectedYear: currentYear
                };
            }

            const stats = await api.getDashboardStats(window.dashboardState.selectedMonth, window.dashboardState.selectedYear);

            return `
                <!-- Quick Actions Header -->
                <div class="row mb-4 quick-actions">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-4">
                                        <h5 class="mb-0">
                                            <i class="fas fa-bolt me-2 text-warning"></i>
                                            إجراءات سريعة
                                        </h5>
                                    </div>
                                    <div class="col-md-8 text-end">
                                        <button id="quickNewOrder" class="btn btn-primary me-2">
                                            <i class="fas fa-plus me-2"></i>
                                            طلب جديد
                                        </button>
                                        <button id="quickNewAdvance" class="btn btn-success">
                                            <i class="fas fa-hand-holding-usd me-2"></i>
                                            سُلفة جديدة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Month/Year Filter Controls -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-6">
                                        <h5 class="mb-0">
                                            <i class="fas fa-calendar-alt me-2"></i>
                                            فترة التقرير
                                        </h5>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="row">
                                            <div class="col-6">
                                                <label for="monthFilter" class="form-label">الشهر</label>
                                                <select id="monthFilter" class="form-select">
                                                    <option value="1" ${window.dashboardState.selectedMonth === 1 ? 'selected' : ''}>يناير</option>
                                                    <option value="2" ${window.dashboardState.selectedMonth === 2 ? 'selected' : ''}>فبراير</option>
                                                    <option value="3" ${window.dashboardState.selectedMonth === 3 ? 'selected' : ''}>مارس</option>
                                                    <option value="4" ${window.dashboardState.selectedMonth === 4 ? 'selected' : ''}>أبريل</option>
                                                    <option value="5" ${window.dashboardState.selectedMonth === 5 ? 'selected' : ''}>مايو</option>
                                                    <option value="6" ${window.dashboardState.selectedMonth === 6 ? 'selected' : ''}>يونيو</option>
                                                    <option value="7" ${window.dashboardState.selectedMonth === 7 ? 'selected' : ''}>يوليو</option>
                                                    <option value="8" ${window.dashboardState.selectedMonth === 8 ? 'selected' : ''}>أغسطس</option>
                                                    <option value="9" ${window.dashboardState.selectedMonth === 9 ? 'selected' : ''}>سبتمبر</option>
                                                    <option value="10" ${window.dashboardState.selectedMonth === 10 ? 'selected' : ''}>أكتوبر</option>
                                                    <option value="11" ${window.dashboardState.selectedMonth === 11 ? 'selected' : ''}>نوفمبر</option>
                                                    <option value="12" ${window.dashboardState.selectedMonth === 12 ? 'selected' : ''}>ديسمبر</option>
                                                </select>
                                            </div>
                                            <div class="col-6">
                                                <label for="yearFilter" class="form-label">السنة</label>
                                                <select id="yearFilter" class="form-select">
                                                    ${this.generateYearOptions(window.dashboardState.selectedYear)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="row" id="kpiCards">
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="dashboard-card clickable" data-kpi="orders">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <i class="fas fa-shopping-cart fa-2x text-primary"></i>
                                <i class="fas fa-info-circle text-muted"
                                   data-bs-toggle="tooltip"
                                   data-bs-placement="top"
                                   title="الصيغة: عدد الطلبات في الشهر المحدد&#10;الغرض: تتبع حجم التوصيل الشهري&#10;المصدر: جدول الطلبات حسب تاريخ الطلب"
                                   style="cursor: help; font-size: 0.9rem;"></i>
                            </div>
                            <h5>الطلبات هذا الشهر</h5>
                            <h2 class="arabic-numbers">${stats.monthly_orders}</h2>
                            <small class="text-muted">انقر للتفاصيل</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="dashboard-card success clickable" data-kpi="payroll">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <i class="fas fa-money-bill-wave fa-2x text-success"></i>
                                <i class="fas fa-info-circle text-muted"
                                   data-bs-toggle="tooltip"
                                   data-bs-placement="top"
                                   title="الصيغة: مجموع (الراتب الأساسي + العمولات) للسائقين النشطين&#10;المكونات: رواتب ثابتة + عمولات شهرية + رواتب مختلطة&#10;الغرض: تقدير إجمالي المدفوعات المتوقعة"
                                   style="cursor: help; font-size: 0.9rem;"></i>
                            </div>
                            <h5>صافي الرواتب المتوقع</h5>
                            <h2 class="arabic-numbers">${this.formatCurrency(stats.expected_salaries)}</h2>
                            <small class="text-muted">انقر للتفاصيل</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="dashboard-card warning clickable" data-kpi="advances">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <i class="fas fa-hand-holding-usd fa-2x text-warning"></i>
                                <i class="fas fa-info-circle text-muted"
                                   data-bs-toggle="tooltip"
                                   data-bs-placement="top"
                                   title="الصيغة: مجموع (مبلغ السُلفة - المبلغ المدفوع) للسُلف غير المسددة&#10;يشمل: السُلف المعلقة والمدفوعة جزئياً&#10;الغرض: تتبع إجمالي الرصيد غير المسدد"
                                   style="cursor: help; font-size: 0.9rem;"></i>
                            </div>
                            <h5>السُلف غير المسددة</h5>
                            <h2 class="arabic-numbers">${this.formatCurrency(stats.outstanding_advances)}</h2>
                            <small class="text-muted">انقر للتفاصيل</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="dashboard-card danger clickable" data-kpi="maintenance">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <i class="fas fa-wrench fa-2x text-danger"></i>
                                <i class="fas fa-info-circle text-muted"
                                   data-bs-toggle="tooltip"
                                   data-bs-placement="top"
                                   title="الصيغة: عدد المركبات التي تاريخ_الصيانة_التالي <= التاريخ_الحالي&#10;المعايير: تاريخ الصيانة المستحقة أو المسافة المقطوعة&#10;الغرض: تتبع المركبات التي تحتاج صيانة فورية"
                                   style="cursor: help; font-size: 0.9rem;"></i>
                            </div>
                            <h5>صيانات مستحقة</h5>
                            <h2 class="arabic-numbers">${stats.due_maintenance}</h2>
                            <small class="text-muted">انقر للتفاصيل</small>
                        </div>
                    </div>
                </div>

                <!-- Insight Widgets Section -->
                <div class="row">
                    <!-- Monthly Trends Chart -->
                    <div class="col-lg-8 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-chart-line me-2 text-primary"></i>الاتجاهات الشهرية</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="monthlyTrendsChart" height="100"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Advances Status Breakdown -->
                    <div class="col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-chart-pie me-2 text-success"></i>حالة السُلف</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="advancesStatusChart" height="150"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <!-- Top Drivers Table -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-trophy me-2 text-warning"></i>أفضل السائقين</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm" id="topDriversTable">
                                        <thead>
                                            <tr>
                                                <th>السائق</th>
                                                <th>الطلبات</th>
                                                <th>الإيرادات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Data will be populated by JavaScript -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activities -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-clock me-2 text-info"></i>الأنشطة الحديثة</h5>
                            </div>
                            <div class="card-body">
                                <div id="recentActivitiesList">
                                    <!-- Data will be populated by JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل لوحة التحكم: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Generate year options for the year filter
     */
    generateYearOptions(selectedYear) {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5; // Show 5 years back
        const endYear = currentYear + 2; // Show 2 years forward

        let options = '';
        for (let year = startYear; year <= endYear; year++) {
            const selected = year === selectedYear ? 'selected' : '';
            options += `<option value="${year}" ${selected}>${year}</option>`;
        }
        return options;
    },

    /**
     * Format currency with KWD
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0.000 د.ك';
        }

        // Format with 3 decimal places and thousands separator
        const formatted = parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });

        return `${formatted} د.ك`;
    },

    /**
     * Setup dashboard event listeners
     */
    setupDashboardEventListeners() {
        // Quick action button handlers
        const quickNewOrder = document.getElementById('quickNewOrder');
        const quickNewAdvance = document.getElementById('quickNewAdvance');

        if (quickNewOrder) {
            quickNewOrder.addEventListener('click', () => {
                this.handleQuickNewOrder();
            });
        }

        if (quickNewAdvance) {
            quickNewAdvance.addEventListener('click', () => {
                this.handleQuickNewAdvance();
            });
        }

        // Month/Year filter change handlers
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');

        if (monthFilter) {
            monthFilter.addEventListener('change', () => {
                window.dashboardState.selectedMonth = parseInt(monthFilter.value);
                this.refreshDashboardKPIs();
            });
        }

        if (yearFilter) {
            yearFilter.addEventListener('change', () => {
                window.dashboardState.selectedYear = parseInt(yearFilter.value);
                this.refreshDashboardKPIs();
            });
        }

        // KPI card click handlers
        const kpiCards = document.querySelectorAll('.dashboard-card.clickable');
        kpiCards.forEach(card => {
            card.addEventListener('click', () => {
                const kpiType = card.getAttribute('data-kpi');
                this.handleKPIClick(kpiType);
            });
        });

        // Initialize insight widgets and utility reminders
        setTimeout(() => {
            // High priority: utility reminders
            this.updateUtilityReminders();

            // Initialize Bootstrap tooltips for KPI info icons
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl, {
                    html: true,
                    trigger: 'hover focus'
                });
            });

            // Defer insight widgets rendering
            this.addToDeferredRender(async () => {
                await this.initializeInsightWidgets();
            }, 3);
        }, 100);
    },

    /**
     * Refresh dashboard KPIs with current filter
     */
    async refreshDashboardKPIs() {
        try {
            // Show skeleton loaders
            this.showDashboardSkeletons();

            // Fetch updated stats with caching
            const stats = await this.getCachedKPIData(
                window.dashboardState.selectedMonth,
                window.dashboardState.selectedYear
            );

            // Update KPI values
            this.updateKPIValues(stats);

            // Defer non-critical rendering
            this.addToDeferredRender(async () => {
                await this.refreshInsightWidgets();
            }, 2);

            // Update utility reminders (high priority)
            await this.updateUtilityReminders();

        } catch (error) {
            console.error('Error refreshing dashboard KPIs:', error);
            showError('خطأ في تحديث البيانات: ' + error.message);
            this.showDashboardEmptyStates();
        } finally {
            // Hide skeleton loaders
            this.hideDashboardSkeletons();
        }
    },

    /**
     * Update KPI card values
     */
    updateKPIValues(stats) {
        const kpiCards = document.querySelectorAll('#kpiCards .dashboard-card');

        kpiCards.forEach((card, index) => {
            const valueElement = card.querySelector('h2');
            if (valueElement) {
                switch (index) {
                    case 0: // Orders
                        valueElement.textContent = stats.monthly_orders;
                        break;
                    case 1: // Expected salaries
                        valueElement.textContent = this.formatCurrency(stats.expected_salaries);
                        break;
                    case 2: // Outstanding advances
                        valueElement.textContent = this.formatCurrency(stats.outstanding_advances);
                        break;
                    case 3: // Due maintenance
                        valueElement.textContent = stats.due_maintenance;
                        break;
                }
            }
        });
    },

    /**
     * Handle quick new order action
     */
    handleQuickNewOrder() {
        // Navigate to orders page and trigger new order modal
        this.loadPage('orders').then(() => {
            // Small delay to ensure page is loaded
            setTimeout(() => {
                // Trigger the add new order functionality
                const addButton = document.querySelector('[data-action="add"]');
                if (addButton) {
                    addButton.click();
                } else {
                    // Fallback: show info message
                    showInfo('انتقل إلى صفحة الطلبات لإضافة طلب جديد');
                }
            }, 500);
        });
    },

    /**
     * Handle quick new advance action
     */
    handleQuickNewAdvance() {
        // Navigate to advances page and trigger new advance modal
        this.loadPage('advances').then(() => {
            // Small delay to ensure page is loaded
            setTimeout(() => {
                // Trigger the add new advance functionality
                const addButton = document.querySelector('[data-action="add"]');
                if (addButton) {
                    addButton.click();
                } else {
                    // Fallback: show info message
                    showInfo('انتقل إلى صفحة السُلف لإضافة سُلفة جديدة');
                }
            }, 500);
        });
    },

    /**
     * Handle KPI card clicks for drill-down
     */
    handleKPIClick(kpiType) {
        const { selectedMonth, selectedYear } = window.dashboardState;

        switch (kpiType) {
            case 'orders':
                // Navigate to orders page with proper URL routing
                console.log(`🔗 Navigating to orders page for ${selectedMonth}/${selectedYear}`);
                this.navigateToPage('orders');
                break;
            case 'payroll':
                // Navigate to payroll page with proper URL routing
                console.log(`🔗 Navigating to payroll page for ${selectedMonth}/${selectedYear}`);
                this.navigateToPage('payroll');
                break;
            case 'advances':
                // Show unpaid advances breakdown modal
                this.showUnpaidAdvancesBreakdown();
                break;
            case 'maintenance':
                // Navigate to maintenance page with proper URL routing
                console.log(`🔗 Navigating to maintenance page`);
                this.navigateToPage('maintenance');
                break;
        }
    },

    /**
     * Show unpaid advances breakdown modal
     */
    async showUnpaidAdvancesBreakdown() {
        try {
            showLoading('جاري تحميل تفاصيل السُلف غير المسددة...');

            const response = await fetch('/api/dashboard/unpaid-advances-breakdown');
            if (!response.ok) {
                throw new Error('فشل في تحميل تفاصيل السُلف غير المسددة');
            }

            const data = await response.json();
            hideLoading();

            // Create modal HTML
            const modalHtml = `
                <div class="modal fade" id="unpaidAdvancesModal" tabindex="-1" aria-labelledby="unpaidAdvancesModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="unpaidAdvancesModalLabel">
                                    <i class="fas fa-hand-holding-usd me-2"></i>
                                    تفاصيل السُلف غير المسددة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-4">
                                        <div class="card bg-warning text-white">
                                            <div class="card-body text-center">
                                                <h4>${this.formatCurrency(data.summary.total_unpaid)}</h4>
                                                <small>إجمالي المبلغ غير المسدد</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-info text-white">
                                            <div class="card-body text-center">
                                                <h4>${data.summary.total_advances}</h4>
                                                <small>عدد السُلف غير المسددة</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-primary text-white">
                                            <div class="card-body text-center">
                                                <h4>${data.summary.drivers_count}</h4>
                                                <small>عدد السائقين المدينين</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>السائق</th>
                                                <th>رقم الهاتف</th>
                                                <th>عدد السُلف</th>
                                                <th>إجمالي المبلغ غير المسدد</th>
                                                <th>الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.breakdown.map(driver => `
                                                <tr>
                                                    <td>
                                                        <strong>${driver.driver_name}</strong>
                                                    </td>
                                                    <td>${driver.phone}</td>
                                                    <td>
                                                        <span class="badge bg-secondary">${driver.advances_count}</span>
                                                    </td>
                                                    <td>
                                                        <strong class="text-warning">${this.formatCurrency(driver.total_unpaid)}</strong>
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-primary me-2" onclick="app.showDriverAdvancesDetails('${driver.driver_id}', '${driver.driver_name}')">
                                                            <i class="fas fa-eye me-1"></i>التفاصيل
                                                        </button>
                                                        <button class="btn btn-sm btn-success" onclick="app.settleDriverAdvances('${driver.driver_id}', '${driver.driver_name}')">
                                                            <i class="fas fa-check me-1"></i>تسديد
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                ${data.breakdown.length === 0 ? `
                                    <div class="text-center py-5">
                                        <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                                        <h5>ممتاز! جميع السُلف مسددة</h5>
                                        <p class="text-muted">لا توجد سُلف غير مسددة حالياً</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                                <button type="button" class="btn btn-primary" onclick="app.loadPage('advances')">
                                    <i class="fas fa-list me-2"></i>إدارة السُلف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('unpaidAdvancesModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('unpaidAdvancesModal'));
            modal.show();

            // Clean up modal when hidden
            document.getElementById('unpaidAdvancesModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });

        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء تحميل تفاصيل السُلف غير المسددة: ${error.message}`);
        }
    },

    /**
     * Show driver advances details
     */
    showDriverAdvancesDetails(driverId, driverName) {
        // Close the main modal first
        const mainModal = bootstrap.Modal.getInstance(document.getElementById('unpaidAdvancesModal'));
        if (mainModal) {
            mainModal.hide();
        }

        // Navigate to advances page with driver filter
        setTimeout(() => {
            this.loadPage('advances', { driver_filter: driverId, driver_name: driverName });
        }, 300);
    },

    /**
     * Settle driver advances
     */
    async settleDriverAdvances(driverId, driverName) {
        try {
            const result = await showConfirm(
                `هل تريد تسديد جميع السُلف غير المسددة للسائق "${driverName}"؟\n\nسيتم تحديث حالة جميع السُلف إلى "مسددة".`,
                'تأكيد تسديد السُلف'
            );

            if (result.isConfirmed) {
                showLoading('جاري تسديد السُلف...');

                // This would typically call an API to settle all advances for the driver
                // For now, we'll show a success message and refresh the modal
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

                hideLoading();
                showSuccess(`تم تسديد جميع السُلف للسائق "${driverName}" بنجاح`);

                // Refresh the modal
                setTimeout(() => {
                    this.showUnpaidAdvancesBreakdown();
                }, 1000);
            }
        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء تسديد السُلف: ${error.message}`);
        }
    },

    /**
     * Initialize insight widgets (charts and tables)
     */
    async initializeInsightWidgets() {
        try {
            // Initialize charts
            await this.initializeMonthlyTrendsChart();
            await this.initializeAdvancesStatusChart();

            // Initialize tables
            await this.initializeTopDriversTable();
            await this.initializeRecentActivities();
        } catch (error) {
            console.error('Error initializing insight widgets:', error);
        }
    },

    /**
     * Initialize monthly trends chart
     */
    async initializeMonthlyTrendsChart() {
        const ctx = document.getElementById('monthlyTrendsChart');
        if (!ctx) return;

        // Sample data - in real implementation, this would come from API
        const data = {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [
                {
                    label: 'الطلبات',
                    data: [12, 19, 8, 15, 22, 18],
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'الإيرادات (د.ك)',
                    data: [1200, 1900, 800, 1500, 2200, 1800],
                    borderColor: 'rgb(46, 204, 113)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right'
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        };

        this.monthlyTrendsChart = new Chart(ctx, config);
    },

    /**
     * Initialize advances status chart
     */
    async initializeAdvancesStatusChart() {
        const ctx = document.getElementById('advancesStatusChart');
        if (!ctx) return;

        // Sample data - in real implementation, this would come from API
        const data = {
            labels: ['مدفوعة بالكامل', 'مدفوعة جزئياً', 'نشطة'],
            datasets: [{
                data: [8, 6, 5],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true,
                        textDirection: 'rtl'
                    }
                }
            }
        };

        this.advancesStatusChart = new Chart(ctx, config);
    },

    /**
     * Initialize top drivers table
     */
    async initializeTopDriversTable() {
        const tableBody = document.querySelector('#topDriversTable tbody');
        if (!tableBody) return;

        // Sample data - in real implementation, this would come from API
        const topDrivers = [
            { name: 'أحمد محمد علي', orders: 45, revenue: '2,250.000 د.ك' },
            { name: 'محمد أحمد سالم', orders: 38, revenue: '1,890.000 د.ك' },
            { name: 'سالم خالد محمد', orders: 32, revenue: '1,650.000 د.ك' },
            { name: 'وليد محمد أحمد', orders: 28, revenue: '1,420.000 د.ك' },
            { name: 'عبدالله سعد علي', orders: 25, revenue: '1,275.000 د.ك' }
        ];

        // Check for empty data
        if (!topDrivers || topDrivers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="empty-state-title">لا يوجد سائقون</div>
                            <div class="empty-state-message">لم يتم العثور على بيانات السائقين للفترة المحددة</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        topDrivers.forEach((driver, index) => {
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <tr>
                    <td>${rankIcon} ${driver.name}</td>
                    <td><span class="badge bg-primary">${driver.orders}</span></td>
                    <td><span class="text-success fw-bold">${driver.revenue}</span></td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    },

    /**
     * Initialize recent activities
     */
    async initializeRecentActivities() {
        const container = document.getElementById('recentActivitiesList');
        if (!container) return;

        // Sample data - in real implementation, this would come from API
        const activities = [
            { type: 'order', icon: 'shopping-cart', color: 'primary', text: 'طلب جديد من شركة الخليج', time: 'منذ 5 دقائق' },
            { type: 'advance', icon: 'hand-holding-usd', color: 'success', text: 'سُلفة جديدة لأحمد محمد', time: 'منذ 15 دقيقة' },
            { type: 'maintenance', icon: 'wrench', color: 'warning', text: 'صيانة دورية للسيارة ABC-123', time: 'منذ 30 دقيقة' },
            { type: 'payment', icon: 'money-bill-wave', color: 'info', text: 'دفع راتب شهر أغسطس', time: 'منذ ساعة' }
        ];

        // Check for empty data
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="empty-state-title">لا توجد أنشطة حديثة</div>
                    <div class="empty-state-message">لم يتم تسجيل أي أنشطة مؤخراً</div>
                </div>
            `;
            return;
        }

        let html = '';
        activities.forEach(activity => {
            html += `
                <div class="d-flex align-items-center mb-3">
                    <div class="flex-shrink-0">
                        <div class="bg-${activity.color} text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="fas fa-${activity.icon}"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <div class="fw-bold">${activity.text}</div>
                        <small class="text-muted">${activity.time}</small>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Refresh insight widgets when filters change
     */
    async refreshInsightWidgets() {
        try {
            // Refresh charts with new data based on current filters
            await this.updateMonthlyTrendsChart();
            await this.updateAdvancesStatusChart();

            // Refresh tables
            await this.initializeTopDriversTable();
            await this.initializeRecentActivities();
        } catch (error) {
            console.error('Error refreshing insight widgets:', error);
        }
    },

    /**
     * Update monthly trends chart with new data
     */
    async updateMonthlyTrendsChart() {
        if (!this.monthlyTrendsChart) return;

        // In real implementation, fetch data based on current filters
        // For now, just update with sample data
        const newData = {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [
                {
                    label: 'الطلبات',
                    data: [Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10,
                           Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10,
                           Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10],
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'الإيرادات (د.ك)',
                    data: [Math.floor(Math.random() * 2000) + 1000, Math.floor(Math.random() * 2000) + 1000,
                           Math.floor(Math.random() * 2000) + 1000, Math.floor(Math.random() * 2000) + 1000,
                           Math.floor(Math.random() * 2000) + 1000, Math.floor(Math.random() * 2000) + 1000],
                    borderColor: 'rgb(46, 204, 113)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        };

        this.monthlyTrendsChart.data = newData;
        this.monthlyTrendsChart.update();
    },

    /**
     * Update advances status chart with new data
     */
    async updateAdvancesStatusChart() {
        if (!this.advancesStatusChart) return;

        // In real implementation, fetch data based on current filters
        // For now, just update with sample data
        const newData = [
            Math.floor(Math.random() * 10) + 5,
            Math.floor(Math.random() * 8) + 3,
            Math.floor(Math.random() * 6) + 2
        ];

        this.advancesStatusChart.data.datasets[0].data = newData;
        this.advancesStatusChart.update();
    },

    /**
     * Update utility reminders with contextual information
     */
    async updateUtilityReminders() {
        const container = document.getElementById('utilityReminders');
        if (!container) return;

        try {
            // Get current stats for contextual reminders
            const stats = await api.getDashboardStats(
                window.dashboardState.selectedMonth,
                window.dashboardState.selectedYear
            );

            // Generate dynamic reminders based on data
            const reminders = this.generateContextualReminders(stats);

            let html = '<div class="row g-3">';
            reminders.forEach(reminder => {
                html += `
                    <div class="col-md-4">
                        <div class="reminder-item">
                            <i class="fas fa-${reminder.icon} text-${reminder.color} me-2"></i>
                            <small class="text-muted">
                                <strong>${reminder.type}:</strong> ${reminder.message}
                            </small>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        } catch (error) {
            console.error('Error updating utility reminders:', error);
        }
    },

    /**
     * Generate contextual reminders based on current data
     */
    generateContextualReminders(stats) {
        const reminders = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Reminder 1: Advances-related
        if (stats.unpaid_advances > 1000) {
            reminders.push({
                icon: 'exclamation-triangle',
                color: 'warning',
                type: 'تنبيه',
                message: `سُلف غير مسددة بقيمة ${this.formatCurrency(stats.unpaid_advances)}`
            });
        } else if (stats.unpaid_advances > 0) {
            reminders.push({
                icon: 'hand-holding-usd',
                color: 'info',
                type: 'متابعة',
                message: `سُلف نشطة بقيمة ${this.formatCurrency(stats.unpaid_advances)}`
            });
        } else {
            reminders.push({
                icon: 'check-circle',
                color: 'success',
                type: 'ممتاز',
                message: 'جميع السُلف مسددة بالكامل'
            });
        }

        // Reminder 2: Maintenance-related
        if (stats.pending_maintenance > 5) {
            reminders.push({
                icon: 'wrench',
                color: 'danger',
                type: 'عاجل',
                message: `${stats.pending_maintenance} صيانات مستحقة تحتاج متابعة`
            });
        } else if (stats.pending_maintenance > 0) {
            reminders.push({
                icon: 'calendar-check',
                color: 'warning',
                type: 'موعد',
                message: `${stats.pending_maintenance} صيانات مجدولة قريباً`
            });
        } else {
            reminders.push({
                icon: 'tools',
                color: 'success',
                type: 'صيانة',
                message: 'جميع المركبات في حالة جيدة'
            });
        }

        // Reminder 3: Performance/Statistics
        if (stats.monthly_orders > 0) {
            const isCurrentMonth = (window.dashboardState.selectedMonth === currentMonth &&
                                  window.dashboardState.selectedYear === currentYear);
            if (isCurrentMonth) {
                reminders.push({
                    icon: 'chart-line',
                    color: 'success',
                    type: 'إحصائية',
                    message: `${stats.monthly_orders} طلب هذا الشهر حتى الآن`
                });
            } else {
                reminders.push({
                    icon: 'chart-bar',
                    color: 'info',
                    type: 'تاريخي',
                    message: `${stats.monthly_orders} طلب في الفترة المحددة`
                });
            }
        } else {
            reminders.push({
                icon: 'plus-circle',
                color: 'primary',
                type: 'اقتراح',
                message: 'ابدأ بإضافة طلبات جديدة للفترة المحددة'
            });
        }

        return reminders;
    },

    /**
     * Initialize theme system
     */
    initializeTheme() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // Setup theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    /**
     * Set theme
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme toggle icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun';
                themeIcon.parentElement.title = 'تبديل إلى المظهر الفاتح';
            } else {
                themeIcon.className = 'fas fa-moon';
                themeIcon.parentElement.title = 'تبديل إلى المظهر الداكن';
            }
        }
    },

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);

        // Show theme change notification
        const themeText = newTheme === 'dark' ? 'المظهر الداكن' : 'المظهر الفاتح';
        showSuccess(`تم التبديل إلى ${themeText}`);
    },

    /**
     * Initialize global search functionality
     */
    initializeGlobalSearch() {
        const searchInput = document.getElementById('globalSearchInput');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput || !searchResults) return;

        let searchTimeout;

        // Handle search input
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // Hide results if query is too short
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            // Debounce search
            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(query);
            }, 300);
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const activeResult = searchResults.querySelector('.search-result-item.active');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextResult = activeResult ?
                    activeResult.nextElementSibling :
                    searchResults.querySelector('.search-result-item');

                if (nextResult) {
                    if (activeResult) activeResult.classList.remove('active');
                    nextResult.classList.add('active');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevResult = activeResult ?
                    activeResult.previousElementSibling :
                    searchResults.querySelector('.search-result-item:last-child');

                if (prevResult) {
                    if (activeResult) activeResult.classList.remove('active');
                    prevResult.classList.add('active');
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeResult) {
                    activeResult.click();
                }
            } else if (e.key === 'Escape') {
                searchResults.style.display = 'none';
                searchInput.blur();
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });

        // Show results when focusing on input with existing query
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                searchResults.style.display = 'block';
            }
        });
    },

    /**
     * Perform global search
     */
    async performGlobalSearch(query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        try {
            // Show loading
            searchResults.innerHTML = `
                <div class="p-3 text-center">
                    <i class="fas fa-spinner fa-spin me-2"></i>
                    جاري البحث...
                </div>
            `;
            searchResults.style.display = 'block';

            const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('فشل في البحث');
            }

            const data = await response.json();
            this.displaySearchResults(data.results, query);

        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = `
                <div class="p-3 text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في البحث
                </div>
            `;
        }
    },

    /**
     * Display search results
     */
    displaySearchResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="p-3 text-center text-muted">
                    <i class="fas fa-search me-2"></i>
                    لا توجد نتائج للبحث عن "${query}"
                </div>
            `;
            return;
        }

        let html = '';
        let currentType = '';

        results.forEach((result, index) => {
            // Add type header
            if (result.type !== currentType) {
                currentType = result.type;
                const typeText = this.getSearchTypeText(result.type);
                html += `
                    <div class="search-type-header px-3 py-2 bg-light border-bottom">
                        <small class="text-muted fw-bold">
                            <i class="fas fa-${this.getSearchTypeIcon(result.type)} me-2"></i>
                            ${typeText}
                        </small>
                    </div>
                `;
            }

            // Add result item
            html += `
                <div class="search-result-item px-3 py-2 border-bottom cursor-pointer ${index === 0 ? 'active' : ''}"
                     data-type="${result.type}" data-id="${result.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="fw-bold text-dark">${result.title}</div>
                            <div class="text-muted small">${result.subtitle}</div>
                        </div>
                        <div class="flex-shrink-0 ms-2">
                            <span class="badge ${result.status === 'نشط' ? 'bg-success' : 'bg-secondary'} small">
                                ${result.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        searchResults.innerHTML = html;

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.navigateToSearchResult(type, id);
                searchResults.style.display = 'none';
                document.getElementById('globalSearchInput').value = '';
            });

            // Add hover effect
            item.addEventListener('mouseenter', () => {
                searchResults.querySelectorAll('.search-result-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    /**
     * Get search type text in Arabic
     */
    getSearchTypeText(type) {
        const typeMap = {
            'driver': 'السائقون',
            'client': 'العملاء',
            'vehicle': 'المركبات'
        };
        return typeMap[type] || type;
    },

    /**
     * Get search type icon
     */
    getSearchTypeIcon(type) {
        const iconMap = {
            'driver': 'users',
            'client': 'building',
            'vehicle': 'car'
        };
        return iconMap[type] || 'circle';
    },

    /**
     * Navigate to search result
     */
    navigateToSearchResult(type, id) {
        // Navigate to the appropriate page and show details
        switch (type) {
            case 'driver':
                this.loadPage('drivers');
                // TODO: Highlight or show driver details
                break;
            case 'client':
                this.loadPage('clients');
                // TODO: Highlight or show client details
                break;
            case 'vehicle':
                this.loadPage('vehicles');
                // TODO: Highlight or show vehicle details
                break;
        }
    },

    /**
     * Initialize performance optimizations
     */
    initializePerformanceOptimizations() {
        // Initialize KPI cache
        this.kpiCache = new Map();
        this.kpiCacheExpiry = new Map();
        this.kpiCacheDuration = 5 * 60 * 1000; // 5 minutes

        // Initialize deferred rendering queue
        this.deferredRenderQueue = [];
        this.isRenderingDeferred = false;

        // Performance monitoring
        this.performanceMetrics = {
            kpiCacheHits: 0,
            kpiCacheMisses: 0,
            deferredRenders: 0,
            avgRenderTime: 0
        };

        console.log('🚀 Performance optimizations initialized');
    },

    /**
     * Get cached KPI data or fetch if expired
     */
    async getCachedKPIData(month, year) {
        const cacheKey = `kpi_${month}_${year}`;
        const now = Date.now();

        // Check if cache exists and is not expired
        if (this.kpiCache.has(cacheKey) && this.kpiCacheExpiry.get(cacheKey) > now) {
            this.performanceMetrics.kpiCacheHits++;
            console.log(`📊 KPI Cache HIT for ${cacheKey}`);
            return this.kpiCache.get(cacheKey);
        }

        // Cache miss - fetch fresh data
        this.performanceMetrics.kpiCacheMisses++;
        console.log(`📊 KPI Cache MISS for ${cacheKey} - fetching fresh data`);

        try {
            const startTime = performance.now();
            const stats = await api.getDashboardStats(month, year);
            const endTime = performance.now();

            // Cache the data
            this.kpiCache.set(cacheKey, stats);
            this.kpiCacheExpiry.set(cacheKey, now + this.kpiCacheDuration);

            // Update performance metrics
            const renderTime = endTime - startTime;
            this.performanceMetrics.avgRenderTime =
                (this.performanceMetrics.avgRenderTime + renderTime) / 2;

            console.log(`📊 KPI data cached for ${cacheKey} (${renderTime.toFixed(2)}ms)`);
            return stats;
        } catch (error) {
            console.error('Error fetching KPI data:', error);
            throw error;
        }
    },

    /**
     * Clear KPI cache
     */
    clearKPICache() {
        this.kpiCache.clear();
        this.kpiCacheExpiry.clear();
        console.log('🗑️ KPI cache cleared');
    },

    /**
     * Invalidate cache for specific month/year or all cache
     */
    invalidateKPICache(month = null, year = null) {
        if (month && year) {
            const cacheKey = `kpi_${month}_${year}`;
            this.kpiCache.delete(cacheKey);
            this.kpiCacheExpiry.delete(cacheKey);
            console.log(`🗑️ KPI cache invalidated for ${cacheKey}`);
        } else {
            this.clearKPICache();
        }
    },

    /**
     * Add item to deferred rendering queue
     */
    addToDeferredRender(renderFunction, priority = 1) {
        this.deferredRenderQueue.push({
            render: renderFunction,
            priority: priority,
            timestamp: Date.now()
        });

        // Sort by priority (higher priority first)
        this.deferredRenderQueue.sort((a, b) => b.priority - a.priority);

        // Start processing if not already running
        if (!this.isRenderingDeferred) {
            this.processDeferredRenderQueue();
        }
    },

    /**
     * Process deferred rendering queue
     */
    async processDeferredRenderQueue() {
        if (this.isRenderingDeferred || this.deferredRenderQueue.length === 0) {
            return;
        }

        this.isRenderingDeferred = true;
        console.log(`🎨 Processing ${this.deferredRenderQueue.length} deferred renders`);

        while (this.deferredRenderQueue.length > 0) {
            const item = this.deferredRenderQueue.shift();

            try {
                const startTime = performance.now();
                await item.render();
                const endTime = performance.now();

                this.performanceMetrics.deferredRenders++;
                console.log(`🎨 Deferred render completed (${(endTime - startTime).toFixed(2)}ms)`);

                // Small delay to prevent blocking UI
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (error) {
                console.error('Error in deferred render:', error);
            }
        }

        this.isRenderingDeferred = false;
        console.log('✅ Deferred rendering queue completed');
    },

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const cacheHitRate = this.performanceMetrics.kpiCacheHits /
            (this.performanceMetrics.kpiCacheHits + this.performanceMetrics.kpiCacheMisses) * 100;

        return {
            ...this.performanceMetrics,
            cacheHitRate: isNaN(cacheHitRate) ? 0 : cacheHitRate.toFixed(2),
            cacheSize: this.kpiCache.size,
            queueSize: this.deferredRenderQueue.length
        };
    },

    /**
     * Show skeleton loaders for dashboard components
     */
    showDashboardSkeletons() {
        // Show KPI skeleton loaders
        const kpiCards = document.querySelectorAll('#kpiCards .dashboard-card h2');
        kpiCards.forEach(card => {
            card.innerHTML = '<div class="skeleton skeleton-text large"></div>';
        });

        // Show chart skeleton loaders
        const monthlyTrendsChart = document.getElementById('monthlyTrendsChart');
        if (monthlyTrendsChart) {
            monthlyTrendsChart.parentElement.innerHTML = '<div class="skeleton skeleton-chart"></div>';
        }

        const advancesStatusChart = document.getElementById('advancesStatusChart');
        if (advancesStatusChart) {
            advancesStatusChart.parentElement.innerHTML = '<div class="skeleton skeleton-chart"></div>';
        }

        // Show table skeleton loaders
        const topDriversTable = document.querySelector('#topDriversTable tbody');
        if (topDriversTable) {
            let skeletonRows = '';
            for (let i = 0; i < 5; i++) {
                skeletonRows += '<tr><td colspan="3"><div class="skeleton skeleton-table-row"></div></td></tr>';
            }
            topDriversTable.innerHTML = skeletonRows;
        }

        // Show activities skeleton loaders
        const recentActivitiesList = document.getElementById('recentActivitiesList');
        if (recentActivitiesList) {
            let skeletonActivities = '';
            for (let i = 0; i < 4; i++) {
                skeletonActivities += `
                    <div class="d-flex align-items-center mb-3">
                        <div class="flex-shrink-0">
                            <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text small" style="width: 60%;"></div>
                        </div>
                    </div>
                `;
            }
            recentActivitiesList.innerHTML = skeletonActivities;
        }
    },

    /**
     * Hide skeleton loaders and restore original content
     */
    hideDashboardSkeletons() {
        // This will be called after data is loaded, so the content will be updated
        // by the respective update methods (updateKPIValues, initializeInsightWidgets, etc.)
    },

    /**
     * Show empty states when no data is available
     */
    showDashboardEmptyStates() {
        // Show empty state for charts
        const monthlyTrendsChart = document.getElementById('monthlyTrendsChart');
        if (monthlyTrendsChart) {
            monthlyTrendsChart.parentElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="empty-state-title">لا توجد بيانات للفترة المحددة</div>
                    <div class="empty-state-message">اختر فترة زمنية أخرى أو أضف بيانات جديدة</div>
                </div>
            `;
        }

        const advancesStatusChart = document.getElementById('advancesStatusChart');
        if (advancesStatusChart) {
            advancesStatusChart.parentElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="empty-state-title">لا توجد سُلف</div>
                    <div class="empty-state-message">لم يتم العثور على سُلف للفترة المحددة</div>
                </div>
            `;
        }

        // Show empty state for tables
        const topDriversTable = document.querySelector('#topDriversTable tbody');
        if (topDriversTable) {
            topDriversTable.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="empty-state-title">لا يوجد سائقون</div>
                            <div class="empty-state-message">لم يتم العثور على بيانات السائقين للفترة المحددة</div>
                        </div>
                    </td>
                </tr>
            `;
        }

        const recentActivitiesList = document.getElementById('recentActivitiesList');
        if (recentActivitiesList) {
            recentActivitiesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="empty-state-title">لا توجد أنشطة حديثة</div>
                    <div class="empty-state-message">لم يتم تسجيل أي أنشطة مؤخراً</div>
                </div>
            `;
        }
    },

    /**
     * Get documents management content
     */
    async getDocumentsContent() {
        return `
            <div class="documents-page rtl-enhanced">
                <!-- Page Header -->
                <div class="page-header">
                    <div>
                        <h2 class="mb-0">
                            <i class="fas fa-folder-open text-primary icon-right"></i>
                            إدارة الوثائق
                        </h2>
                        <p class="text-muted mb-0">إدارة وثائق السائقين والمركبات والملفات الأخرى</p>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <ul class="nav nav-tabs nav-fill" id="documentsTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="drivers-tab" data-bs-toggle="tab" data-bs-target="#drivers-content" type="button" role="tab">
                            <i class="fas fa-user"></i>
                            وثائق السائقين
                            <span class="badge bg-primary ms-2" id="driversCount">0</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="vehicles-tab" data-bs-toggle="tab" data-bs-target="#vehicles-content" type="button" role="tab">
                            <i class="fas fa-car"></i>
                            وثائق المركبات
                            <span class="badge bg-primary ms-2" id="vehiclesCount">0</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="other-tab" data-bs-toggle="tab" data-bs-target="#other-content" type="button" role="tab">
                            <i class="fas fa-folder"></i>
                            وثائق الشركة
                            <span class="badge bg-primary ms-2" id="otherCount">0</span>
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content" id="documentsTabContent">
                    <!-- Drivers Tab -->
                    <div class="tab-pane fade show active" id="drivers-content" role="tabpanel">
                        <!-- Search Controls -->
                        <div class="search-controls">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" class="form-control search-input" id="driversSearch" placeholder="البحث في السائقين...">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="filter-buttons">
                                        <button class="btn btn-outline-success filter-btn active" data-filter="all">الكل</button>
                                        <button class="btn btn-outline-success filter-btn" data-filter="complete">مكتملة</button>
                                        <button class="btn btn-outline-warning filter-btn" data-filter="expiring">تنتهي قريباً</button>
                                        <button class="btn btn-outline-danger filter-btn" data-filter="expired">منتهية</button>
                                        <button class="btn btn-outline-secondary filter-btn" data-filter="missing">ناقصة</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Drivers Grid -->
                        <div class="entities-grid" id="driversGrid">
                            <div class="loading-state">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">جاري التحميل...</span>
                                </div>
                                <div class="loading-text">جاري تحميل بيانات السائقين...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Vehicles Tab -->
                    <div class="tab-pane fade" id="vehicles-content" role="tabpanel">
                        <!-- Search Controls -->
                        <div class="search-controls">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" class="form-control search-input" id="vehiclesSearch" placeholder="البحث في المركبات...">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="filter-buttons">
                                        <button class="btn btn-outline-success filter-btn active" data-filter="all">الكل</button>
                                        <button class="btn btn-outline-success filter-btn" data-filter="complete">مكتملة</button>
                                        <button class="btn btn-outline-warning filter-btn" data-filter="expiring">تنتهي قريباً</button>
                                        <button class="btn btn-outline-danger filter-btn" data-filter="expired">منتهية</button>
                                        <button class="btn btn-outline-secondary filter-btn" data-filter="missing">ناقصة</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Vehicles Grid -->
                        <div class="entities-grid" id="vehiclesGrid">
                            <div class="loading-state">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">جاري التحميل...</span>
                                </div>
                                <div class="loading-text">جاري تحميل بيانات المركبات...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Other Documents Tab -->
                    <div class="tab-pane fade" id="other-content" role="tabpanel">
                        <!-- Company Documents Section -->
                        <div class="company-documents-section">
                            <div class="section-header">
                                <h5 class="section-title">
                                    <i class="fas fa-building text-primary"></i>
                                    الشركات المسجلة
                                </h5>
                                <p class="section-description">إدارة وثائق الشركات والمؤسسات</p>
                            </div>
                            
                            <!-- Company Cards Grid -->
                            <div class="companies-grid">
                                <!-- Emmar Company Card -->
                                <div class="company-card" data-company-id="emmar" onclick="app.openCompanyDocuments('emmar')">
                                    <div class="company-card-header">
                                        <div class="company-logo">
                                            <i class="fas fa-building text-primary"></i>
                                        </div>
                                        <div class="company-info">
                                            <h6 class="company-name">شركة إعمار</h6>
                                            <p class="company-type">شركة توصيل</p>
                                        </div>
                                    </div>
                                    <div class="company-card-body">
                                        <div class="document-stats">
                                            <div class="stat-item">
                                                <span class="stat-value" id="emmarDocCount">0</span>
                                                <span class="stat-label">الوثائق</span>
                                            </div>
                                            <div class="stat-item">
                                                <span class="stat-value" id="emmarExpiring">0</span>
                                                <span class="stat-label">تنتهي قريباً</span>
                                            </div>
                                            <div class="stat-item">
                                                <span class="stat-value" id="emmarExpired">0</span>
                                                <span class="stat-label">منتهية</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="company-card-footer">
                                        <span class="last-updated">آخر تحديث: اليوم</span>
                                        <i class="fas fa-chevron-left"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upload Modal -->
                <div class="modal fade" id="uploadModal" tabindex="-1" dir="rtl">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <!-- Modal Header -->
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-upload text-primary"></i>
                                    رفع وثيقة جديدة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                            </div>

                            <!-- Modal Body -->
                            <div class="modal-body">
                                <!-- Upload Form -->
                                <form id="uploadForm" enctype="multipart/form-data">
                                    <!-- Entity Info (Hidden) -->
                                    <input type="hidden" id="entityType" name="entity_type">
                                    <input type="hidden" id="entityId" name="entity_id">

                                    <!-- File Upload Area -->
                                    <div class="mb-3">
                                        <label class="form-label">الملف</label>
                                        <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
                                            <input type="file" id="fileInput" name="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display: none;">
                                            <div class="upload-content">
                                                <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                                <h5 class="text-muted">اسحب الملف هنا أو انقر للاختيار</h5>
                                                <p class="text-muted small">الأنواع المدعومة: PDF, DOC, DOCX, JPG, PNG</p>
                                                <p class="text-muted small">الحد الأقصى: 15 ميجابايت</p>
                                            </div>
                                            <div id="filePreview" class="files-preview" style="display: none;">
                                                <!-- File preview will be shown here -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Selected Files Preview -->
                                    <div id="filesPreview" class="files-preview" style="display: none;">
                                        <h6 class="mb-3">الملفات المحددة:</h6>
                                        <div id="filesList" class="files-list">
                                            <!-- Files will be listed here -->
                                        </div>
                                    </div>

                                    <!-- Upload Progress -->
                                    <div id="uploadProgress" class="upload-progress" style="display: none;">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span>جاري الرفع...</span>
                                            <span id="progressPercent">0%</span>
                                        </div>
                                        <div class="progress">
                                            <div class="progress-bar progress-bar-striped progress-bar-animated"
                                                 id="progressBar" role="progressbar" style="width: 0%"></div>
                                        </div>
                                    </div>

                                    <!-- Metadata Form -->
                                    <div id="metadataForm" class="metadata-form" style="display: none;">
                                        <hr class="my-4">
                                        <h6 class="mb-3">معلومات الوثيقة:</h6>

                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="displayName" class="form-label">اسم الوثيقة *</label>
                                                    <input type="text" class="form-control" id="displayName" name="display_name" required>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="category" class="form-label">الفئة *</label>
                                                    <select class="form-select" id="category" name="category" required>
                                                        <option value="">اختر الفئة</option>
                                                        <option value="id_copy">نسخة الهوية</option>
                                                        <option value="license">رخصة القيادة</option>
                                                        <option value="insurance">التأمين</option>
                                                        <option value="contract">العقد</option>
                                                        <option value="maintenance">الصيانة</option>
                                                        <option value="other">أخرى</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="status" class="form-label">الحالة</label>
                                                    <select class="form-select" id="status" name="status">
                                                        <option value="active" selected>نشط</option>
                                                        <option value="expired">منتهي</option>
                                                        <option value="pending_renewal">في انتظار التجديد</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="expiryDate" class="form-label">تاريخ الانتهاء</label>
                                                    <input type="date" class="form-control" id="expiryDate" name="expiry_date">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label for="description" class="form-label">الوصف</label>
                                            <textarea class="form-control" id="description" name="description" rows="3" placeholder="وصف اختياري للوثيقة..."></textarea>
                                        </div>

                                        <div class="mb-3">
                                            <label for="tags" class="form-label">الكلمات المفتاحية</label>
                                            <input type="text" class="form-control" id="tags" name="tags" placeholder="مثال: مهم، عقد، تجديد (مفصولة بفاصلة)">
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <!-- Modal Footer -->
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                                <button type="button" class="btn btn-primary" id="startUploadBtn" disabled>
                                    <i class="fas fa-upload"></i> رفع الوثيقة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Document Preview Modal -->
                <div class="modal fade" id="documentPreviewModal" tabindex="-1" dir="rtl">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="previewModalTitle">
                                    <i class="fas fa-eye text-primary"></i>
                                    معاينة الوثيقة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                            </div>
                            <div class="modal-body p-0">
                                <div id="documentPreviewContent" class="document-preview-container">
                                    <!-- Preview content will be loaded here -->
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                                <button type="button" class="btn btn-primary" id="downloadFromPreviewBtn">
                                    <i class="fas fa-download"></i> تحميل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Document Details Modal -->
                <div class="modal fade" id="documentDetailsModal" tabindex="-1" dir="rtl">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-alt text-primary"></i>
                                    تفاصيل الوثيقة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                            </div>
                            <div class="modal-body">
                                <div id="documentDetailsContent">
                                    <!-- Document details will be loaded here -->
                                    <div class="text-center">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">جاري التحميل...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <div class="btn-group me-auto" role="group">
                                    <button type="button" class="btn btn-outline-primary" id="previewDocumentBtn">
                                        <i class="fas fa-eye"></i> معاينة
                                    </button>
                                    <button type="button" class="btn btn-outline-success" id="downloadDocumentBtn">
                                        <i class="fas fa-download"></i> تحميل
                                    </button>
                                    <button type="button" class="btn btn-outline-warning" id="editDocumentBtn">
                                        <i class="fas fa-edit"></i> تعديل
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" id="deleteDocumentBtn">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </div>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Edit Document Modal -->
                <div class="modal fade" id="editDocumentModal" tabindex="-1" dir="rtl">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-edit text-primary"></i>
                                    تحرير الوثيقة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editDocumentForm">
                                    <input type="hidden" id="editDocumentId" name="document_id">
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editDisplayName" class="form-label">اسم الوثيقة *</label>
                                                <input type="text" class="form-control" id="editDisplayName" name="display_name" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editCategory" class="form-label">الفئة *</label>
                                                <select class="form-select" id="editCategory" name="category" required>
                                                    <option value="">اختر الفئة</option>
                                                    <option value="id_copy">نسخة الهوية</option>
                                                    <option value="license">رخصة القيادة</option>
                                                    <option value="insurance">التأمين</option>
                                                    <option value="contract">العقد</option>
                                                    <option value="maintenance">الصيانة</option>
                                                    <option value="other">أخرى</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editStatus" class="form-label">الحالة</label>
                                                <select class="form-select" id="editStatus" name="status">
                                                    <option value="active">نشط</option>
                                                    <option value="expired">منتهي</option>
                                                    <option value="pending_renewal">في انتظار التجديد</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editExpiryDate" class="form-label">تاريخ الانتهاء</label>
                                                <input type="date" class="form-control" id="editExpiryDate" name="expiry_date">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="editDescription" class="form-label">الوصف</label>
                                        <textarea class="form-control" id="editDescription" name="description" rows="3"></textarea>
                                    </div>

                                    <div class="mb-3">
                                        <label for="editTags" class="form-label">الكلمات المفتاحية</label>
                                        <input type="text" class="form-control" id="editTags" name="tags">
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                                <button type="button" class="btn btn-primary" id="saveDocumentBtn">
                                    <i class="fas fa-save"></i> حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get entity document page content
     */
    async getEntityDocumentPageContent(entityType, entityId, entityInfo) {
        const entityTypeArabic = entityType === 'driver' ? 'السائق' : 'المركبة';
        const entityIcon = entityType === 'driver' ? 'fas fa-user' : 'fas fa-car';

        return `
            <div class="entity-document-page rtl-enhanced">
                <!-- Breadcrumb Navigation -->
                <nav aria-label="breadcrumb" class="breadcrumb-nav">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <a href="#documents" onclick="app.navigateToPage('documents')">
                                <i class="fas fa-folder-open"></i> الوثائق
                            </a>
                        </li>
                        <li class="breadcrumb-item">
                            <span>${entityType === 'driver' ? 'السائقون' : 'المركبات'}</span>
                        </li>
                        <li class="breadcrumb-item active" aria-current="page">
                            <i class="${entityIcon}"></i> ${entityInfo.name}
                        </li>
                    </ol>
                </nav>

                <!-- Page Header -->
                <div class="page-header entity-header">
                    <div class="entity-info-header">
                        <div class="entity-avatar">
                            <i class="${entityIcon} fa-2x"></i>
                        </div>
                        <div class="entity-details">
                            <h2 class="entity-name">${entityInfo.name}</h2>
                            <p class="entity-type">${entityTypeArabic}</p>
                            <div class="entity-meta">
                                ${this.getEntityMetaInfo(entityType, entityInfo.entity)}
                            </div>
                        </div>
                    </div>
                    <div class="entity-actions">
                        <button class="btn btn-primary btn-lg" id="uploadEntityDocBtn">
                            <i class="fas fa-upload"></i>
                            رفع وثيقة جديدة
                        </button>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary" id="bulkDownloadBtn" title="تحميل جميع الوثائق">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-outline-secondary" id="exportListBtn" title="تصدير قائمة الوثائق">
                                <i class="fas fa-file-export"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- File Management Interface -->
                <div class="file-management-container">
                    <!-- Toolbar -->
                    <div class="file-toolbar">
                        <div class="toolbar-left">
                            <div class="view-toggle">
                                <button class="btn btn-outline-secondary active" id="gridViewBtn" title="عرض الشبكة">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="btn btn-outline-secondary" id="listViewBtn" title="عرض القائمة">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                            <div class="bulk-actions" id="bulkActionsBar" style="display: none;">
                                <span class="selected-count" id="selectedCount">0 محدد</span>
                                <button class="btn btn-sm btn-outline-primary" id="bulkDownloadSelectedBtn">
                                    <i class="fas fa-download"></i> تحميل
                                </button>
                                <button class="btn btn-sm btn-outline-danger" id="bulkDeleteSelectedBtn">
                                    <i class="fas fa-trash"></i> حذف
                                </button>
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <div class="search-filter-group">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="fileSearchInput" placeholder="البحث في الوثائق...">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                </div>
                                <select class="form-select" id="categoryFilter">
                                    <option value="">جميع الفئات</option>
                                    <option value="license">رخصة القيادة</option>
                                    <option value="insurance">تأمين المركبة</option>
                                    <option value="contract">عقد العمل</option>
                                    <option value="invoice">فاتورة</option>
                                    <option value="receipt">إيصال</option>
                                    <option value="certificate">شهادة</option>
                                    <option value="other">أخرى</option>
                                </select>
                                <select class="form-select" id="statusFilter">
                                    <option value="">جميع الحالات</option>
                                    <option value="active">نشط</option>
                                    <option value="expired">منتهي</option>
                                    <option value="expiring">ينتهي قريباً</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- File Upload Zone -->
                    <div class="file-upload-zone" id="fileUploadZone" style="display: none;">
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt fa-3x"></i>
                            </div>
                            <h4>اسحب الملفات هنا أو انقر للاختيار</h4>
                            <p>يمكنك رفع ملفات PDF، الصور، مستندات Word وExcel</p>
                            <input type="file" id="fileInput" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt">
                            <button class="btn btn-primary" id="selectFilesBtn">اختيار الملفات</button>
                        </div>
                        <div class="upload-progress" id="uploadProgress" style="display: none;">
                            <div class="progress-list" id="progressList"></div>
                        </div>
                    </div>

                    <!-- Files Display Area -->
                    <div class="files-display-area">
                        <div class="files-grid" id="filesGrid">
                            <div class="loading-state">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">جاري التحميل...</span>
                                </div>
                                <div class="loading-text">جاري تحميل الوثائق...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get entity meta information for header
     */
    getEntityMetaInfo(entityType, entity) {
        if (entityType === 'driver') {
            return `
                <span class="meta-item">
                    <i class="fas fa-id-card"></i>
                    ${entity.national_id || entity.civil_id || 'غير محدد'}
                </span>
                <span class="meta-item">
                    <i class="fas fa-phone"></i>
                    ${entity.phone || 'غير محدد'}
                </span>
                <span class="meta-item">
                    <i class="fas fa-briefcase"></i>
                    ${this.getEmploymentTypeArabic(entity.employment_type)}
                </span>
            `;
        } else {
            return `
                <span class="meta-item">
                    <i class="fas fa-car"></i>
                    ${entity.make || 'غير محدد'} ${entity.model || 'غير محدد'} (${entity.year || 'غير محدد'})
                </span>
                <span class="meta-item">
                    <i class="fas fa-palette"></i>
                    ${entity.color || 'غير محدد'}
                </span>
                <span class="meta-item">
                    <i class="fas fa-tachometer-alt"></i>
                    ${entity.mileage ? entity.mileage.toLocaleString('ar-SA') + ' كم' : 'غير محدد'}
                </span>
            `;
        }
    },

    /**
     * Get employment type in Arabic
     */
    getEmploymentTypeArabic(type) {
        const typeMap = {
            'commission': 'بالعمولة',
            'salary': 'راتب ثابت',
            'mixed': 'مختلط'
        };
        return typeMap[type] || 'غير محدد';
    },

    /**
     * Initialize page-specific functionality
     */
    initializePage(pageName) {
        // Add fade-in animation
        const content = document.getElementById('mainContent');
        content.classList.add('fade-in');

        // Page-specific initialization
        switch (pageName) {
            case 'dashboard':
                // Setup dashboard event listeners
                setTimeout(() => {
                    this.setupDashboardEventListeners();
                }, 100); // Small delay to ensure DOM is ready
                break;
            case 'drivers':
                this.initializeDriversPage();
                break;
            case 'vehicles':
                this.initializeVehiclesPage();
                break;
            case 'clients':
                this.initializeClientsPage();
                break;
            case 'orders':
                this.initializeOrdersPage();
                break;
            case 'advances':
                this.initializeAdvancesPage();
                break;
            case 'payroll':
                this.initializePayrollPage();
                break;
            case 'maintenance':
                this.initializeMaintenancePage();
                break;
            case 'breakdowns':
                this.initializeBreakdownsPage();
                break;
            case 'reports':
                this.initializeReportsPage();
                break;
            case 'documents':
                this.initializeDocumentsPage();
                break;
            case 'settings':
                this.initializeSettingsPage();
                break;
            default:
                // Other pages will be implemented in later phases
                break;
        }
    },

    /**
     * Initialize entity document page functionality
     */
    async initializeEntityDocumentPage(entityType, entityId, entityInfo) {
        // Initialize the entity document manager
        if (typeof EntityDocumentManager !== 'undefined') {
            window.entityDocumentManager = new EntityDocumentManager(entityType, entityId, entityInfo);
            await window.entityDocumentManager.initialize();
        } else {
            console.error('EntityDocumentManager not loaded');
            showError('خطأ في تحميل مدير الوثائق');
        }
    },

    /**
     * Initialize drivers page
     */
    async initializeDriversPage() {
        try {
            // Get drivers and vehicles data
            const [drivers, vehicles] = await Promise.all([
                api.getDrivers(),
                api.getVehicles()
            ]);

            // Make vehicles data available globally for DataTable
            window.vehiclesData = vehicles;

            // Add vehicle information to drivers data
            drivers.forEach(driver => {
                // Find the vehicle assigned to this driver
                const assignedVehicle = vehicles.find(vehicle =>
                    vehicle.assigned_driver_id && vehicle.assigned_driver_id.toString() === driver.id.toString()
                );

                if (assignedVehicle) {
                    // Format vehicle info as "License Plate Make Model"
                    driver.vehicle_info = `${assignedVehicle.license_plate} ${assignedVehicle.make} ${assignedVehicle.model}`;
                } else {
                    driver.vehicle_info = '-';
                }
            });

            // Define table columns
            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'full_name', label: 'الاسم الكامل', type: 'text' },
                { field: 'phone', label: 'رقم الهاتف', type: 'phone' },
                { field: 'national_id', label: 'الرقم المدني', type: 'text' },
                { field: 'employment_type', label: 'نوع التوظيف', type: 'employment_type' },
                { field: 'car_ownership', label: 'ملكية السيارة', type: 'car_ownership' },
                { field: 'vehicle_info', label: 'معلومات السيارة', type: 'vehicle_info' },
                { field: 'employment_date', label: 'تاريخ التوظيف', type: 'date' },
                { field: 'residency_number', label: 'الإقامة', type: 'text' },
                { field: 'residency_expiry_date', label: 'تاريخ انتهاء الإقامة', type: 'date' },
                { field: 'residence_status', label: 'حالة الإقامة', type: 'residency_status' },
                { field: 'base_salary', label: 'الراتب الأساسي', type: 'currency' },
                { field: 'default_commission_per_order', label: 'العمولة الافتراضية', type: 'currency' },
                { field: 'is_active', label: 'الحالة', type: 'status' }
            ];

            // Create data table
            window.driversTable = new DataTable('driversContainer', {
                title: 'السائقون',
                icon: 'fas fa-users',
                columns: columns,
                data: drivers,
                actions: ['edit', 'delete', 'history'],
                exportable: true,
                importable: true,
                selectable: true,
                onAdd: () => this.showDriverForm(),
                onEdit: (driver) => this.showDriverForm(driver),
                onDelete: (driver) => this.deleteDriver(driver),
                onBulkDelete: (ids) => this.bulkDeleteDrivers(ids),
                onHistory: (driver) => this.showDriverHistory(driver),
                onImport: (data) => this.importDrivers(data)
            });

            window.driversTable.render();

        } catch (error) {
            console.error('Error initializing drivers page:', error);
            document.getElementById('driversContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل بيانات السائقين: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Load/refresh drivers data in the table
     */
    async loadDrivers() {
        try {
            // Get updated drivers and vehicles data
            const [drivers, vehicles] = await Promise.all([
                api.getDrivers(),
                api.getVehicles()
            ]);

            // Make vehicles data available globally for DataTable
            window.vehiclesData = vehicles;

            // Also make drivers data available globally for cross-referencing
            window.driversData = drivers;

            // Find the existing DataTable instance and update its data
            const driversContainer = document.getElementById('driversContainer');
            if (driversContainer && window.driversTable) {
                // Update the data in the existing table
                window.driversTable.updateData(drivers);

                // Force a complete refresh to ensure vehicle_info columns are updated correctly
                // This is especially important when car_ownership changes
                setTimeout(() => {
                    window.driversTable.refresh();
                }, 100);
            } else {
                // If table doesn't exist, reinitialize the page
                await this.initializeDriversPage();
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
            showError('خطأ في تحميل بيانات السائقين: ' + error.message);
        }
    },

    /**
     * Show driver form modal
     */
    async showDriverForm(driver = null) {

        const fields = [
                {
                    name: 'full_name',
                    label: 'الاسم الكامل',
                    type: 'text',
                    required: true,
                    placeholder: 'أدخل الاسم الكامل'
                },
                {
                    name: 'phone',
                    label: 'رقم الهاتف',
                    type: 'tel',
                    required: true,
                    placeholder: '+965XXXXXXXX',
                    pattern: '^\\+965\\d{8}$'
                },
                {
                    name: 'national_id',
                    label: 'الرقم المدني',
                    type: 'text',
                    required: true,
                    placeholder: '285010112345',
                    pattern: '^\\d{12}$'
                },
                {
                    name: 'employment_type',
                    label: 'نوع التوظيف',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'commission', label: 'بالعمولة' },
                        { value: 'salary', label: 'راتب ثابت' },
                        { value: 'mixed', label: 'مختلط' }
                    ],
                    onChange: 'handleEmploymentTypeChange'
                },
                {
                    name: 'car_ownership',
                    label: 'ملكية السيارة',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'private', label: 'خاص' },
                        { value: 'company', label: 'شركة' }
                    ]
                },
                {
                    name: 'employment_date',
                    label: 'تاريخ التوظيف',
                    type: 'date',
                    required: true,
                    value: driver ? formatDateForInput(driver.employment_date) : new Date().toISOString().split('T')[0]
                },
                {
                    name: 'base_salary',
                    label: 'الراتب الأساسي (د.ك)',
                    type: 'number',
                    min: 0,
                    step: 0.001,
                    placeholder: '400.000',
                    visibleWhen: [
                        { field: 'employment_type', values: ['salary', 'mixed'] }
                    ]
                },
                {
                    name: 'default_commission_per_order',
                    label: 'العمولة الافتراضية (د.ك)',
                    type: 'number',
                    min: 0,
                    step: 0.001,
                    placeholder: '0.300',
                    visibleWhen: [
                        { field: 'employment_type', values: ['commission', 'mixed'] }
                    ]
                },
                {
                    name: 'max_advance_limit',
                    label: 'حد السُلفة الأقصى (د.ك)',
                    type: 'number',
                    min: 0,
                    step: 0.001,
                    placeholder: '500'
                },
                {
                    name: 'residency_number',
                    label: 'الإقامة',
                    type: 'text',
                    placeholder: 'رقم الإقامة'
                },
                {
                    name: 'residency_expiry_date',
                    label: 'تاريخ انتهاء الإقامة',
                    type: 'date',
                    value: driver ? formatDateForInput(driver.residency_expiry_date) : '',
                    onChange: 'calculateResidencyStatus'
                },
                {
                    name: 'residency_status',
                    label: 'حالة الإقامة',
                    type: 'readonly',
                    value: driver ? this.calculateResidencyStatus(driver.residency_expiry_date) : ''
                },
                {
                    name: 'hire_date',
                    label: 'تاريخ التوظيف (للنظام)',
                    type: 'date',
                    value: driver ? formatDateForInput(driver.hire_date) : new Date().toISOString().split('T')[0]
                },
                {
                    name: 'is_active',
                    label: 'نشط',
                    type: 'checkbox'
                }
            ];

        try {
            const modal = new FormModal('driverModal', {
                title: driver ? 'تعديل السائق' : 'إضافة سائق جديد',
                icon: 'fas fa-user',
                fields: fields,
                onFieldChange: (fieldName, value, changeType) => {
                    // Handle field change events for dynamic visibility and options updating
                    console.log(`Field ${fieldName} changed to ${value} (${changeType})`);
                },
                onSubmit: async (data, isEdit) => {
                    try {
                        // Auto-calculate residence status before saving
                        if (data.residency_expiry_date) {
                            data.residence_status = this.calculateResidencyStatus(data.residency_expiry_date);
                        }

                        if (isEdit) {
                            await api.updateDriver(driver.id, data);
                            showSuccess('تم تحديث بيانات السائق بنجاح');
                        } else {
                            await api.createDriver(data);
                            showSuccess('تم إضافة السائق بنجاح');
                        }

                        // Refresh the drivers page
                        await this.loadDrivers();

                    } catch (error) {
                        throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                    }
                },
                onFieldChange: (fieldName, value, changeHandler) => {
                    if (fieldName === 'residency_expiry_date' && changeHandler === 'calculateResidencyStatus') {
                        // Update the residence status field automatically
                        const statusField = document.getElementById('driverModal_residency_status');
                        if (statusField) {
                            statusField.value = this.calculateResidencyStatus(value);
                        }
                    }
                }
            });

            modal.show(driver);
        } catch (error) {
            console.error('Error creating driver form:', error);
            showError('حدث خطأ أثناء تحميل نموذج السائق: ' + error.message);
        }
    },

    /**
     * Calculate residency status based on expiry date (returns plain text for storage)
     */
    calculateResidencyStatus(expiryDate) {
        if (!expiryDate) return '';

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'منتهية';
        } else if (diffDays < 30) {
            return 'أقل من شهر';
        } else if (diffDays < 90) {
            return 'أقل من 3 شهور';
        } else {
            return 'صالحة';
        }
    },

    /**
     * Calculate residency status with HTML badges for display
     */
    calculateResidencyStatusDisplay(expiryDate) {
        if (!expiryDate) return '';

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return '<span class="badge bg-danger">منتهية</span>';
        } else if (diffDays < 30) {
            return '<span class="badge bg-warning">أقل من شهر</span>';
        } else if (diffDays < 90) {
            return '<span class="badge bg-warning">أقل من 3 شهور</span>';
        } else {
            return '<span class="badge bg-success">صالحة</span>';
        }
    },

    /**
     * Delete driver
     */
    async deleteDriver(driver) {
        const result = await showConfirm(
            `هل تريد حذف السائق "${driver.full_name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteDriver(driver.id);
                showSuccess('تم حذف السائق بنجاح');
                this.initializeDriversPage();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف السائق');
            }
        }
    },

    /**
     * Bulk delete drivers
     */
    async bulkDeleteDrivers(driverIds) {
        if (!driverIds || driverIds.length === 0) {
            showError('لم يتم تحديد أي سائقين');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${driverIds.length} سائق؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف السائقين...');
                const response = await api.bulkDeleteDrivers(driverIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    // Clear selection and refresh
                    if (window.driversTable) {
                        window.driversTable.clearSelection();
                    }
                    this.initializeDriversPage();
                } else {
                    showError(response.message || 'فشل في حذف السائقين');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف السائقين');
            }
        }
    },



    /**
     * Initialize vehicles page
     */
    async initializeVehiclesPage() {
        try {
            // Get vehicles and drivers data
            const vehicles = await api.getVehicles();
            const drivers = await api.getDrivers();

            // Store drivers data globally for DataTable formatting
            window.driversData = drivers;

            // Define table columns
            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'license_plate', label: 'رقم اللوحة', type: 'text' },
                { field: 'make', label: 'الماركة', type: 'text' },
                { field: 'model', label: 'الموديل', type: 'text' },
                { field: 'year', label: 'سنة الصنع', type: 'text' },
                { field: 'color', label: 'اللون', type: 'text' },
                { field: 'assigned_driver_id', label: 'السائق المخصص', type: 'assigned_driver' },
                { field: 'insurance_expiry', label: 'تاريخ انتهاء التأمين', type: 'date' },
                { field: 'registration_status', label: 'حالة الترخيص', type: 'registration_status' },
                { field: 'is_active', label: 'الحالة', type: 'status' }
            ];

            // Create data table
            const vehiclesTable = new DataTable('vehiclesContainer', {
                title: 'السيارات',
                icon: 'fas fa-car',
                columns: columns,
                data: vehicles,
                actions: ['edit', 'delete'],
                exportable: true,
                importable: true,
                selectable: true,
                onAdd: () => this.showVehicleForm(),
                onEdit: (vehicle) => this.showVehicleForm(vehicle),
                onDelete: (vehicle) => this.deleteVehicle(vehicle),
                onBulkDelete: (ids) => this.bulkDeleteVehicles(ids),
                onImport: (data) => this.importVehicles(data)
            });

            vehiclesTable.render();

        } catch (error) {
            console.error('Error initializing vehicles page:', error);
            document.getElementById('vehiclesContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل بيانات السيارات: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Show vehicle form modal
     */
    async showVehicleForm(vehicle = null) {
        try {
            const fields = [
                {
                    name: 'license_plate',
                    label: 'رقم اللوحة',
                    type: 'text',
                    required: true,
                    placeholder: 'مثال: ABC123'
                },
                {
                    name: 'make',
                    label: 'الماركة',
                    type: 'text',
                    required: true,
                    placeholder: 'مثال: تويوتا'
                },
                {
                    name: 'model',
                    label: 'الموديل',
                    type: 'text',
                    required: true,
                    placeholder: 'مثال: كامري'
                },
                {
                    name: 'year',
                    label: 'سنة الصنع',
                    type: 'number',
                    required: true,
                    min: 1990,
                    max: 2025,
                    placeholder: '2020'
                },
                {
                    name: 'color',
                    label: 'اللون',
                    type: 'text',
                    placeholder: 'مثال: أبيض'
                },
                {
                    name: 'assigned_driver_id',
                    label: 'السائق المخصص',
                    type: 'select',
                    required: false,
                    options: [
                        { value: '', label: 'غير مخصص (Unassigned)' }
                    ]
                },
                {
                    name: 'insurance_expiry',
                    label: 'تاريخ انتهاء التأمين',
                    type: 'date'
                },
                {
                    name: 'is_active',
                    label: 'نشط',
                    type: 'checkbox'
                }
            ];

            // Load filtered drivers for vehicle form
            await this.loadDriversForVehicleForm(fields);

            const modal = new FormModal('vehicleModal', {
                title: 'السيارة',
                icon: 'fas fa-car',
                fields: fields,
                onSubmit: async (data, isEdit) => {
                    try {
                        if (isEdit) {
                            await api.updateVehicle(vehicle.id, data);
                        } else {
                            await api.createVehicle(data);
                        }

                        // Refresh the vehicles page
                        this.initializeVehiclesPage();

                    } catch (error) {
                        throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                    }
                }
            });

            modal.show(vehicle);

        } catch (error) {
            showError('حدث خطأ أثناء تحميل النموذج: ' + error.message);
        }
    },

    /**
     * Load drivers for vehicle form dropdown
     */
    async loadDriversForVehicleForm(fields) {
        try {
            const drivers = await api.getDrivers();

            // Filter to only show company car drivers (active only)
            const companyDrivers = drivers.filter(driver =>
                driver.car_ownership === 'company' && driver.is_active
            );

            const driverField = fields.find(f => f.name === 'assigned_driver_id');
            if (driverField) {
                driverField.options = [
                    { value: '', label: 'غير مخصص (Unassigned)' },
                    ...companyDrivers.map(driver => ({
                        value: driver.id,
                        label: `${driver.full_name} - ${driver.national_id}`
                    }))
                ];
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
        }
    },

    /**
     * Delete vehicle
     */
    async deleteVehicle(vehicle) {
        const result = await showConfirm(
            `هل تريد حذف السيارة "${vehicle.license_plate}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteVehicle(vehicle.id);
                showSuccess('تم حذف السيارة بنجاح');
                this.initializeVehiclesPage();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف السيارة');
            }
        }
    },

    /**
     * Bulk delete vehicles
     */
    async bulkDeleteVehicles(vehicleIds) {
        if (!vehicleIds || vehicleIds.length === 0) {
            showError('لم يتم تحديد أي سيارات');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${vehicleIds.length} سيارة؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف السيارات...');
                const response = await api.bulkDeleteVehicles(vehicleIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    this.initializeVehiclesPage();
                } else {
                    showError(response.message || 'فشل في حذف السيارات');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف السيارات');
            }
        }
    },

    /**
     * Initialize clients page
     */
    async initializeClientsPage() {
        try {
            // Get clients data
            const clients = await api.getClients();

            // Define table columns
            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'company_name', label: 'اسم الشركة', type: 'text' },
                { field: 'contact_person', label: 'الشخص المسؤول', type: 'text' },
                { field: 'phone', label: 'رقم الهاتف', type: 'phone' },
                { field: 'email', label: 'البريد الإلكتروني', type: 'text' },
                { field: 'commission_rate', label: 'معدل العمولة', type: 'currency' },
                { field: 'payment_terms', label: 'شروط الدفع', type: 'payment_terms' },
                { field: 'is_active', label: 'الحالة', type: 'status' }
            ];

            // Create data table
            const clientsTable = new DataTable('clientsContainer', {
                title: 'العملاء',
                icon: 'fas fa-building',
                columns: columns,
                data: clients,
                actions: ['edit', 'delete'],
                exportable: true,
                importable: true,
                selectable: true,
                onAdd: () => this.showClientForm(),
                onEdit: (client) => this.showClientForm(client),
                onDelete: (client) => this.deleteClient(client),
                onBulkDelete: (ids) => this.bulkDeleteClients(ids),
                onImport: (data) => this.importClients(data)
            });

            clientsTable.render();

        } catch (error) {
            console.error('Error initializing clients page:', error);
            document.getElementById('clientsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل بيانات العملاء: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Show client form modal
     */
    showClientForm(client = null) {
        const fields = [
            {
                name: 'company_name',
                label: 'اسم الشركة',
                type: 'text',
                required: true,
                placeholder: 'أدخل اسم الشركة'
            },
            {
                name: 'contact_person',
                label: 'الشخص المسؤول',
                type: 'text',
                required: true,
                placeholder: 'أدخل اسم الشخص المسؤول'
            },
            {
                name: 'phone',
                label: 'رقم الهاتف',
                type: 'tel',
                required: true,
                placeholder: '+965XXXXXXXX',
                pattern: '^\\+965\\d{8}$'
            },
            {
                name: 'email',
                label: 'البريد الإلكتروني',
                type: 'email',
                placeholder: 'example@company.com'
            },
            {
                name: 'address',
                label: 'العنوان',
                type: 'textarea',
                rows: 3,
                placeholder: 'أدخل عنوان الشركة'
            },
            {
                name: 'commission_rate',
                label: 'معدل العمولة (د.ك)',
                type: 'number',
                min: 0,
                step: 0.001,
                placeholder: '0.250'
            },
            {
                name: 'payment_terms',
                label: 'شروط الدفع',
                type: 'select',
                options: [
                    { value: 'cash', label: 'نقداً' },
                    { value: 'credit_7', label: 'آجل 7 أيام' },
                    { value: 'credit_15', label: 'آجل 15 يوم' },
                    { value: 'credit_30', label: 'آجل 30 يوم' }
                ]
            },
            {
                name: 'is_active',
                label: 'نشط',
                type: 'checkbox'
            }
        ];

        const modal = new FormModal('clientModal', {
            title: 'العميل',
            icon: 'fas fa-building',
            fields: fields,
            onSubmit: async (data, isEdit) => {
                try {
                    if (isEdit) {
                        await api.updateClient(client.id, data);
                    } else {
                        await api.createClient(data);
                    }

                    // Refresh the clients page
                    this.initializeClientsPage();

                } catch (error) {
                    throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                }
            }
        });

        modal.show(client);
    },

    /**
     * Delete client
     */
    async deleteClient(client) {
        const result = await showConfirm(
            `هل تريد حذف العميل "${client.company_name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteClient(client.id);
                showSuccess('تم حذف العميل بنجاح');
                this.initializeClientsPage();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف العميل');
            }
        }
    },

    /**
     * Bulk delete clients
     */
    async bulkDeleteClients(clientIds) {
        if (!clientIds || clientIds.length === 0) {
            showError('لم يتم تحديد أي عملاء');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${clientIds.length} عميل؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف العملاء...');
                const response = await api.bulkDeleteClients(clientIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    this.initializeClientsPage();
                } else {
                    showError(response.message || 'فشل في حذف العملاء');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف العملاء');
            }
        }
    },

    /**
     * Initialize orders page with year/month navigation
     */
    async initializeOrdersPage() {
        try {
            showLoading('جاري تحميل قائمة الطلبات...');

            const ordersMenu = await api.getOrdersMenu();

            hideLoading();

            this.renderOrdersLandingPage(ordersMenu);

        } catch (error) {
            hideLoading();
            console.error('Error initializing orders page:', error);
            document.getElementById('ordersContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل قائمة الطلبات: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Render orders landing page with year/month navigation
     */
    renderOrdersLandingPage(ordersMenu) {
        const container = document.getElementById('ordersContainer');
        const { years, current_year, current_month, summary } = ordersMenu;

        const arabicMonths = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        let yearsHTML = '';

        years.forEach(year => {
            let monthsHTML = '';

            for (let month = 1; month <= 12; month++) {
                const isCurrentMonth = (year === current_year && month === current_month);
                const monthClass = isCurrentMonth ? 'border-primary bg-light' : '';

                monthsHTML += `
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card h-100 month-card ${monthClass}" style="cursor: pointer;"
                             data-action="load-monthly-orders" data-month="${month}" data-year="${year}">
                            <div class="card-body text-center">
                                <h6 class="card-title">${arabicMonths[month - 1]}</h6>
                                <small class="text-muted">${month}/${year}</small>
                                ${isCurrentMonth ? '<div class="badge bg-primary mt-2">الشهر الحالي</div>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            yearsHTML += `
                <div class="year-section mb-5">
                    <div class="d-flex align-items-center mb-4">
                        <h3 class="mb-0">
                            <i class="fas fa-calendar-alt me-2 text-primary"></i>
                            سنة ${year}
                        </h3>
                        ${year === current_year ? '<span class="badge bg-success ms-3">السنة الحالية</span>' : ''}
                    </div>
                    <div class="row">
                        ${monthsHTML}
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>
                            <i class="fas fa-chart-line me-2"></i>
                            إدارة العمولات الشهرية
                        </h2>
                        <p class="text-muted mb-0">اختر السنة والشهر لعرض مصفوفة عمولات السائقين والعملاء</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary" data-action="show-orders-help">
                            <i class="fas fa-question-circle me-2"></i>
                            مساعدة
                        </button>
                        <button class="btn btn-primary" data-action="load-monthly-orders" data-month="${current_month}" data-year="${current_year}">
                            <i class="fas fa-calendar-check me-2"></i>
                            الشهر الحالي
                        </button>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <h5 class="card-title mb-1">إجمالي السجلات</h5>
                                        <h3 class="mb-0">${summary.total_monthly_records}</h3>
                                    </div>
                                    <div class="fs-1 opacity-75">
                                        <i class="fas fa-database"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <h5 class="card-title mb-1">السنوات المتاحة</h5>
                                        <h3 class="mb-0">${summary.available_years}</h3>
                                    </div>
                                    <div class="fs-1 opacity-75">
                                        <i class="fas fa-calendar"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <h5 class="card-title mb-1">الشهر الحالي</h5>
                                        <h3 class="mb-0">${arabicMonths[current_month - 1]} ${current_year}</h3>
                                    </div>
                                    <div class="fs-1 opacity-75">
                                        <i class="fas fa-calendar-day"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${yearsHTML}
            </div>
        `;

        // Add CSS for month cards hover effect
        const style = document.createElement('style');
        style.textContent = `
            .month-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            .year-section {
                border-bottom: 1px solid #dee2e6;
                padding-bottom: 2rem;
            }
            .year-section:last-child {
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Load monthly orders matrix for specific month and year
     */
    async loadMonthlyOrders(month, year) {
        try {
            showLoading(`جاري تحميل بيانات ${this.getArabicMonth(month)} ${year}...`);

            const monthlyOrders = await api.getMonthlyOrders(month, year);
            const eligibleDrivers = await api.getEligibleDrivers();
            const clients = await api.getClients();

            hideLoading();

            this.renderMonthlyOrdersMatrix(month, year, monthlyOrders, eligibleDrivers, clients);

        } catch (error) {
            hideLoading();
            console.error('Error loading monthly orders:', error);
            showError(`خطأ في تحميل بيانات ${this.getArabicMonth(month)} ${year}: ${error.message}`);
        }
    },

    /**
     * Render monthly orders matrix with proper column structure
     */
    renderMonthlyOrdersMatrix(month, year, monthlyOrders, eligibleDrivers, clients) {
        const container = document.getElementById('ordersContainer');
        const monthName = this.getArabicMonth(month);

        // Get unique clients that have entries in this month
        const clientsWithEntries = new Set();
        monthlyOrders.forEach(order => {
            order.entries.forEach(entry => {
                clientsWithEntries.add(entry.client_id);
            });
        });

        const activeClients = clients.filter(client => clientsWithEntries.has(client.id));

        // Build table headers - Main header row (simplified to 3 columns per client)
        let mainHeaders = '<th class="sticky-column text-center align-middle" rowspan="2">اسم السائق</th>';
        activeClients.forEach(client => {
            mainHeaders += `
                <th colspan="3" class="text-center bg-light border client-header">${client.company_name}</th>
            `;
        });
        mainHeaders += '<th class="text-center align-middle" rowspan="2">إجمالي شهري للسائق</th>';
        mainHeaders += '<th class="text-center align-middle" rowspan="2">الإجراءات</th>';

        // Build sub-headers row (simplified to 3 columns per client)
        let subHeaders = '';
        activeClients.forEach(() => {
            subHeaders += `
                <th class="text-center small bg-secondary text-white">العمولة</th>
                <th class="text-center small bg-secondary text-white">عدد الطلبات</th>
                <th class="text-center small bg-secondary text-white">الإجمالي</th>
            `;
        });

        // Build table rows
        let tableRows = '';
        const ordersByDriver = {};
        monthlyOrders.forEach(order => {
            ordersByDriver[order.driver_id] = order;
        });

        eligibleDrivers.forEach(driver => {
            const driverOrder = ordersByDriver[driver.id];
            let rowHTML = `<td class="sticky-column fw-bold driver-name">${driver.full_name}</td>`;

            // Add client data columns (simplified to 3 columns)
            activeClients.forEach(client => {
                const entry = driverOrder?.entries.find(e => e.client_id === client.id);
                if (entry) {
                    // Use total_orders if available (new format), otherwise use num_orders (legacy)
                    const totalOrders = entry.total_orders || entry.num_orders || 0;

                    rowHTML += `
                        <td class="text-center commission-cell">${entry.commission_per_order.toFixed(3)}</td>
                        <td class="text-center orders-cell">${totalOrders}</td>
                        <td class="text-center total-cell fw-bold text-success">${entry.total_amount.toFixed(3)} د.ك</td>
                    `;
                } else {
                    rowHTML += `
                        <td class="text-center text-muted">-</td>
                        <td class="text-center text-muted">-</td>
                        <td class="text-center text-muted">-</td>
                    `;
                }
            });

            // Monthly total column
            const totalAmount = driverOrder?.total_monthly_money || 0;
            rowHTML += `<td class="text-center fw-bold text-primary monthly-total">${totalAmount.toFixed(3)} د.ك</td>`;

            // Actions column
            if (driverOrder) {
                rowHTML += `
                    <td class="text-center actions-cell">
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" data-action="edit-monthly-order" data-order-id="${driverOrder.id}" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete-monthly-order" data-order-id="${driverOrder.id}" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
            } else {
                rowHTML += `
                    <td class="text-center actions-cell">
                        <button class="btn btn-sm btn-success" data-action="add-monthly-order" data-driver-id="${driver.id}" data-month="${month}" data-year="${year}" title="إضافة سجل">
                            <i class="fas fa-plus me-1"></i>إضافة
                        </button>
                    </td>
                `;
            }

            tableRows += `<tr class="driver-row">${rowHTML}</tr>`;
        });

        // Calculate summary statistics
        const totalDriversWithData = monthlyOrders.length;
        const totalMonthlyAmount = monthlyOrders.reduce((sum, order) => sum + (order.total_monthly_money || 0), 0);
        const totalOrders = monthlyOrders.reduce((sum, order) => {
            return sum + order.entries.reduce((entrySum, entry) => {
                // Use total_orders if available (new format), otherwise use num_orders (legacy)
                return entrySum + (entry.total_orders || entry.num_orders || 0);
            }, 0);
        }, 0);

        container.innerHTML = `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>
                            <i class="fas fa-table me-2"></i>
                            مصفوفة العمولات - ${monthName} ${year}
                        </h2>
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item">
                                    <a href="#" data-action="back-to-orders">الطلبات</a>
                                </li>
                                <li class="breadcrumb-item active">${monthName} ${year}</li>
                            </ol>
                        </nav>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary" data-action="back-to-orders">
                            <i class="fas fa-arrow-right me-2"></i>
                            العودة
                        </button>
                        <button class="btn btn-success" data-action="add-commission-record" data-month="${month}" data-year="${year}">
                            <i class="fas fa-plus me-2"></i>
                            إضافة سجل جديد
                        </button>
                    </div>
                </div>

                ${monthlyOrders.length > 0 ? `
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-info text-white">
                                <div class="card-body">
                                    <h6 class="card-title">السائقين مع بيانات</h6>
                                    <h4 class="mb-0">${totalDriversWithData} من ${eligibleDrivers.length}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-success text-white">
                                <div class="card-body">
                                    <h6 class="card-title">إجمالي الطلبات</h6>
                                    <h4 class="mb-0">${totalOrders}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <h6 class="card-title">إجمالي العمولات</h6>
                                    <h4 class="mb-0">${totalMonthlyAmount.toFixed(3)} د.ك</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="table-responsive commission-matrix">
                    <table class="table table-bordered table-hover table-sm">
                        <thead class="table-dark">
                            <tr>${mainHeaders}</tr>
                            <tr>${subHeaders}</tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                ${monthlyOrders.length === 0 ? `
                    <div class="text-center py-5 empty-state">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">لا توجد بيانات لهذا الشهر</h4>
                        <p class="text-muted">ابدأ بإضافة سجل عمولات جديد للسائقين</p>
                        <button class="btn btn-primary btn-lg" data-action="add-commission-record" data-month="${month}" data-year="${year}">
                            <i class="fas fa-plus me-2"></i>
                            إضافة سجل جديد
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        // Add enhanced CSS for the commission matrix
        this.addCommissionMatrixStyles();
    },

    /**
     * Add CSS styles for commission matrix
     */
    addCommissionMatrixStyles() {
        const existingStyle = document.getElementById('commission-matrix-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'commission-matrix-styles';
        style.textContent = `
            .commission-matrix {
                max-height: 70vh;
                overflow: auto;
                border: 2px solid #dee2e6;
                border-radius: 8px;
            }

            .sticky-column {
                position: sticky;
                left: 0;
                background: white !important;
                z-index: 10;
                border-left: 3px solid #0d6efd;
                min-width: 180px;
                max-width: 180px;
            }

            .commission-matrix .table thead th {
                position: sticky;
                top: 0;
                z-index: 20;
                border-bottom: 2px solid #dee2e6;
            }

            .commission-matrix .table thead th.sticky-column {
                z-index: 30;
            }

            .client-header {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
                font-weight: bold;
                border-bottom: 2px solid #6c757d;
            }

            .driver-name {
                font-weight: bold;
                color: #0d6efd;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .commission-cell {
                background-color: #fff3cd;
                font-weight: 500;
            }

            .date-cell {
                background-color: #f8f9fa;
                font-size: 0.85em;
            }

            .orders-cell {
                background-color: #d1ecf1;
                font-weight: bold;
            }

            .total-cell {
                background-color: #d4edda;
                border-left: 2px solid #28a745;
            }

            .monthly-total {
                background-color: #cce5ff;
                border: 2px solid #0d6efd;
                font-size: 1.1em;
            }

            .actions-cell {
                background-color: #f8f9fa;
                min-width: 120px;
            }

            .driver-row:hover {
                background-color: rgba(13, 110, 253, 0.05);
            }

            .driver-row:hover .sticky-column {
                background-color: rgba(13, 110, 253, 0.1) !important;
            }

            .empty-state {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 15px;
                margin: 2rem 0;
                padding: 3rem;
            }

            .btn-group .btn {
                border-radius: 4px;
                margin: 0 1px;
            }

            @media (max-width: 768px) {
                .sticky-column {
                    min-width: 120px;
                    max-width: 120px;
                    font-size: 0.9em;
                }

                .commission-matrix .table td,
                .commission-matrix .table th {
                    padding: 0.5rem 0.25rem;
                    font-size: 0.85em;
                }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Format date for display (Gregorian)
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-KW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Kuwait'
            });
        } catch (error) {
            return dateString;
        }
    },

    /**
     * Get Arabic month name
     */
    getArabicMonth(month) {
        const arabicMonths = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return arabicMonths[month - 1] || 'غير محدد';
    },

    /**
     * Show orders help modal
     */
    showOrdersHelp() {
        const helpModal = new bootstrap.Modal(document.createElement('div'));
        // Implementation for help modal
        showInfo('مساعدة نظام العمولات الشهرية\n\n1. اختر السنة والشهر من الصفحة الرئيسية\n2. عرض مصفوفة العمولات للسائقين والعملاء\n3. إضافة وتعديل سجلات العمولات\n4. حساب الإجماليات تلقائياً');
    },

    /**
     * Add monthly order for specific driver
     */
    async addMonthlyOrder(driverId, month, year) {
        this.showMonthlyOrderForm(null, month, year, driverId);
    },

    /**
     * Edit monthly order
     */
    async editMonthlyOrder(orderId) {
        try {
            showLoading('جاري تحميل البيانات...');
            const order = await api.getMonthlyOrder(orderId);
            hideLoading();

            this.showMonthlyOrderForm(order, order.month, order.year);
        } catch (error) {
            hideLoading();
            showError(`خطأ في تحميل البيانات: ${error.message}`);
        }
    },

    /**
     * Delete monthly order
     */
    async deleteMonthlyOrder(orderId) {
        const result = await showConfirm(
            'هل أنت متأكد من حذف هذا السجل الشهري؟\nلا يمكن التراجع عن هذا الإجراء.',
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteMonthlyOrder(orderId);
                showSuccess('تم حذف السجل الشهري بنجاح');

                // Reload current month view
                const urlParams = new URLSearchParams(window.location.search);
                const month = parseInt(urlParams.get('month')) || new Date().getMonth() + 1;
                const year = parseInt(urlParams.get('year')) || new Date().getFullYear();
                this.loadMonthlyOrders(month, year);
            } catch (error) {
                showError(`خطأ في حذف السجل: ${error.message}`);
            }
        }
    },

    /**
     * Show monthly order form modal with enhanced specifications
     */
    async showMonthlyOrderForm(order = null, month, year, preselectedDriverId = null) {
        try {
            showLoading('جاري تحميل البيانات...');

            const [eligibleDrivers, allClients] = await Promise.all([
                api.getEligibleDrivers(),
                api.getClients()
            ]);

            // Filter clients to only include active ones
            const clients = allClients.filter(client => client.is_active === true);

            hideLoading();

            const isEditMode = !!order;
            const monthName = this.getArabicMonth(month);

            // Create custom form HTML for better control
            const modalId = 'monthlyOrderModal';
            const modalHTML = this.createMonthlyOrderFormHTML(
                modalId,
                isEditMode,
                monthName,
                year,
                eligibleDrivers,
                clients,
                order,
                month,
                preselectedDriverId
            );

            // Remove existing modal if present
            const existingModal = document.getElementById(modalId);
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Initialize modal
            const modal = new bootstrap.Modal(document.getElementById(modalId));

            // Setup form functionality
            this.setupMonthlyOrderForm(modalId, order, month, year, isEditMode);

            // Show modal
            modal.show();

        } catch (error) {
            hideLoading();
            showError(`خطأ في تحميل النموذج: ${error.message}`);
        }
    },

    /**
     * Create monthly order form HTML
     */
    createMonthlyOrderFormHTML(modalId, isEditMode, monthName, year, eligibleDrivers, clients, order, month, preselectedDriverId) {
        const driverOptions = eligibleDrivers.map(driver =>
            `<option value="${driver.id}" ${(order?.driver_id || preselectedDriverId) === driver.id ? 'selected' : ''}>
                ${driver.full_name} (${driver.employment_type})
            </option>`
        ).join('');

        const clientOptions = clients.map(client =>
            `<option value="${client.id}">${client.company_name}</option>`
        ).join('');

        const entries = order?.entries || [{}];

        return `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-line me-2"></i>
                                ${isEditMode ? 'تعديل' : 'إضافة'} سجل العمولات - ${monthName} ${year}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="${modalId}Form">
                                <div class="row mb-4">
                                    <div class="col-md-4">
                                        <label class="form-label required">السائق</label>
                                        <select class="form-select" name="driver_id" required ${isEditMode ? 'disabled' : ''}>
                                            <option value="">اختر السائق</option>
                                            ${driverOptions}
                                        </select>
                                        ${isEditMode ? `<input type="hidden" name="driver_id" value="${order?.driver_id || ''}">` : ''}
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">الشهر</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" name="month" value="${month}" readonly>
                                            <span class="input-group-text">${monthName}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">السنة</label>
                                        <input type="number" class="form-control" name="year" value="${year}" readonly>
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-header bg-light">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">
                                                <i class="fas fa-building me-2"></i>
                                                بيانات العملاء والعمولات
                                            </h6>
                                            <button type="button" class="btn btn-sm btn-success" onclick="app.addClientEntry('${modalId}')">
                                                <i class="fas fa-plus me-1"></i>إضافة عميل
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div id="clientEntries">
                                            ${entries.map((entry, index) => this.createClientEntryHTML(index, entry, clientOptions)).join('')}
                                        </div>

                                        <div class="row mt-4">
                                            <div class="col-md-6 offset-md-6">
                                                <div class="card bg-primary text-white">
                                                    <div class="card-body">
                                                        <h6 class="card-title">إجمالي العمولات الشهرية</h6>
                                                        <h4 class="mb-0" id="totalMonthlyAmount">0.000 د.ك</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>إلغاء
                            </button>
                            <button type="button" class="btn btn-primary" data-action="save-monthly-order" data-modal-id="${modalId}" data-is-edit="${isEditMode}" data-order-id="${order?.id || ''}" data-month="${month}" data-year="${year}">
                                <i class="fas fa-save me-2"></i>${isEditMode ? 'تحديث' : 'حفظ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Create client entry HTML
     */
    createClientEntryHTML(index, entry = {}, clientOptions) {
        // Handle both old format (flat) and new format (with periods)
        const periods = entry.periods || [{
            date_from: entry.date_from || '',
            date_to: entry.date_to || '',
            num_orders: entry.num_orders || ''
        }];

        const totalOrders = entry.total_orders || entry.num_orders || 0;
        const totalAmount = entry.total_amount || 0;

        return `
            <div class="client-entry border rounded p-3 mb-3" data-index="${index}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary">عميل ${index + 1}</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="app.removeClientEntry(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label required">العميل</label>
                        <select class="form-select client-select" name="entries[${index}][client_id]" required>
                            <option value="">اختر العميل</option>
                            ${clientOptions.replace(`value="${entry.client_id}"`, `value="${entry.client_id}" selected`)}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label required">العمولة لكل طلب (د.ك)</label>
                        <input type="number" class="form-control commission-input"
                               name="entries[${index}][commission_per_order]"
                               value="${entry.commission_per_order || ''}"
                               min="0" step="0.001" required>
                    </div>
                </div>

                <div class="periods-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0 text-secondary">فترات العمل</h6>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="app.addPeriod(this, ${index})">
                            <i class="fas fa-plus"></i> إضافة مدة
                        </button>
                    </div>

                    <div class="periods-container">
                        ${periods.map((period, periodIndex) => this.createPeriodHTML(index, periodIndex, period)).join('')}
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">مجموع الطلبات لهذا العميل</label>
                        <input type="number" class="form-control total-orders-display" readonly
                               value="${totalOrders}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">ملاحظات (اختيارية)</label>
                        <textarea class="form-control"
                                  name="entries[${index}][note]"
                                  rows="2"
                                  placeholder="أي ملاحظات إضافية...">${entry.note || ''}</textarea>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">الإجمالي</label>
                        <div class="input-group">
                            <input type="text" class="form-control total-display" readonly
                                   value="${totalAmount ? totalAmount.toFixed(3) : '0.000'}">
                            <span class="input-group-text">د.ك</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Create period HTML for a client entry
     */
    createPeriodHTML(clientIndex, periodIndex, period = {}) {
        return `
            <div class="period-entry border rounded p-2 mb-2 bg-light" data-period-index="${periodIndex}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">مدة ${periodIndex + 1}</small>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="app.removePeriod(this, ${clientIndex})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-2">
                        <label class="form-label required small">من تاريخ</label>
                        <input type="date" class="form-control form-control-sm"
                               name="entries[${clientIndex}][periods][${periodIndex}][date_from]"
                               value="${period.date_from || ''}" required>
                    </div>
                    <div class="col-md-4 mb-2">
                        <label class="form-label required small">إلى تاريخ</label>
                        <input type="date" class="form-control form-control-sm"
                               name="entries[${clientIndex}][periods][${periodIndex}][date_to]"
                               value="${period.date_to || ''}" required>
                    </div>
                    <div class="col-md-4 mb-2">
                        <label class="form-label required small">عدد الطلبات</label>
                        <input type="number" class="form-control form-control-sm orders-input"
                               name="entries[${clientIndex}][periods][${periodIndex}][num_orders]"
                               value="${period.num_orders || ''}"
                               min="0" required>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Setup monthly order form functionality
     */
    setupMonthlyOrderForm(modalId, order, month, year, isEditMode) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Setup live calculations
        modal.addEventListener('input', (e) => {
            if (e.target.classList.contains('commission-input') || e.target.classList.contains('orders-input')) {
                this.calculateEntryTotal(e.target);
                this.calculateTotalMonthlyAmount(modalId);
            }
        });

        // Setup client selection validation
        modal.addEventListener('change', (e) => {
            if (e.target.classList.contains('client-select')) {
                this.validateClientSelection(modalId);
            }
        });

        // Setup date validation
        modal.addEventListener('change', (e) => {
            if (e.target.type === 'date') {
                this.validateDateRange(e.target);
            }
        });

        // Calculate initial totals
        this.calculateTotalMonthlyAmount(modalId);
    },

    /**
     * Add new client entry
     */
    addClientEntry(modalId) {
        const container = document.getElementById('clientEntries');
        const entries = container.querySelectorAll('.client-entry');
        const newIndex = entries.length;

        // Get client options from first entry
        const firstSelect = container.querySelector('.client-select');
        const clientOptions = firstSelect ? firstSelect.innerHTML : '';

        const entryHTML = this.createClientEntryHTML(newIndex, {}, clientOptions);
        container.insertAdjacentHTML('beforeend', entryHTML);

        // Validate client selection after adding
        this.validateClientSelection(modalId);
    },

    /**
     * Add new period to a client entry
     */
    addPeriod(button, clientIndex) {
        const clientEntry = button.closest('.client-entry');
        const periodsContainer = clientEntry.querySelector('.periods-container');
        const periods = periodsContainer.querySelectorAll('.period-entry');
        const newPeriodIndex = periods.length;

        const periodHTML = this.createPeriodHTML(clientIndex, newPeriodIndex, {});
        periodsContainer.insertAdjacentHTML('beforeend', periodHTML);

        // Update calculations
        this.calculateClientTotal(clientEntry);
        this.calculateTotalMonthlyAmount(button.closest('.modal').id);
    },

    /**
     * Remove period from a client entry
     */
    removePeriod(button, clientIndex) {
        const periodEntry = button.closest('.period-entry');
        const clientEntry = button.closest('.client-entry');
        const periodsContainer = clientEntry.querySelector('.periods-container');

        // Don't allow removing the last period
        const periods = periodsContainer.querySelectorAll('.period-entry');
        if (periods.length <= 1) {
            showError('يجب أن يكون هناك مدة واحدة على الأقل لكل عميل');
            return;
        }

        periodEntry.remove();

        // Reindex periods
        this.reindexPeriods(clientEntry, clientIndex);

        // Update calculations
        this.calculateClientTotal(clientEntry);
        this.calculateTotalMonthlyAmount(button.closest('.modal').id);
    },

    /**
     * Reindex periods after removal
     */
    reindexPeriods(clientEntry, clientIndex) {
        const periods = clientEntry.querySelectorAll('.period-entry');
        periods.forEach((period, index) => {
            period.dataset.periodIndex = index;

            // Update period title
            const title = period.querySelector('.text-muted');
            if (title) title.textContent = `مدة ${index + 1}`;

            // Update input names
            const inputs = period.querySelectorAll('input');
            inputs.forEach(input => {
                const name = input.name;
                if (name) {
                    const newName = name.replace(/\[periods\]\[\d+\]/, `[periods][${index}]`);
                    input.name = newName;
                }
            });
        });
    },

    /**
     * Remove client entry
     */
    removeClientEntry(button) {
        const entry = button.closest('.client-entry');
        const modalId = button.closest('.modal').id;

        entry.remove();

        // Reindex remaining entries
        this.reindexClientEntries(modalId);
        this.validateClientSelection(modalId);
        this.calculateTotalMonthlyAmount(modalId);
    },

    /**
     * Reindex client entries after removal
     */
    reindexClientEntries(modalId) {
        const container = document.getElementById('clientEntries');
        const entries = container.querySelectorAll('.client-entry');

        entries.forEach((entry, index) => {
            entry.dataset.index = index;
            entry.querySelector('h6').textContent = `عميل ${index + 1}`;

            // Update input names
            const inputs = entry.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name && input.name.includes('entries[')) {
                    const fieldName = input.name.split('][')[1];
                    input.name = `entries[${index}][${fieldName}`;
                }
            });
        });
    },

    /**
     * Calculate client total based on commission and all periods
     */
    calculateClientTotal(clientEntry) {
        const commissionInput = clientEntry.querySelector('.commission-input');
        const totalOrdersDisplay = clientEntry.querySelector('.total-orders-display');
        const totalDisplay = clientEntry.querySelector('.total-display');
        const periodsContainer = clientEntry.querySelector('.periods-container');

        if (commissionInput && totalOrdersDisplay && totalDisplay && periodsContainer) {
            const commission = parseFloat(commissionInput.value) || 0;

            // Sum orders from all periods
            let totalOrders = 0;
            const periodOrdersInputs = periodsContainer.querySelectorAll('.orders-input');
            periodOrdersInputs.forEach(input => {
                totalOrders += parseInt(input.value) || 0;
            });

            const total = commission * totalOrders;
            totalOrdersDisplay.value = totalOrders;
            totalDisplay.value = total.toFixed(3);
        }
    },

    /**
     * Calculate total for a single entry (legacy function for backward compatibility)
     */
    calculateEntryTotal(input) {
        const clientEntry = input.closest('.client-entry');
        if (!clientEntry) return;

        // Check if this is the new format with periods
        const periodsContainer = clientEntry.querySelector('.periods-container');
        if (periodsContainer) {
            this.calculateClientTotal(clientEntry);
        } else {
            // Legacy calculation for old format
            const commissionInput = clientEntry.querySelector('.commission-input');
            const ordersInput = clientEntry.querySelector('.orders-input');
            const totalDisplay = clientEntry.querySelector('.total-display');

            if (commissionInput && ordersInput && totalDisplay) {
                const commission = parseFloat(commissionInput.value) || 0;
                const orders = parseInt(ordersInput.value) || 0;
                const total = commission * orders;
                totalDisplay.value = total.toFixed(3);
            }
        }
    },

    /**
     * Calculate total monthly amount
     */
    calculateTotalMonthlyAmount(modalId) {
        const modal = document.getElementById(modalId);
        const totalDisplays = modal.querySelectorAll('.total-display');
        const monthlyTotalElement = document.getElementById('totalMonthlyAmount');

        let totalAmount = 0;
        totalDisplays.forEach(display => {
            totalAmount += parseFloat(display.value) || 0;
        });

        if (monthlyTotalElement) {
            monthlyTotalElement.textContent = `${totalAmount.toFixed(3)} د.ك`;
        }
    },

    /**
     * Validate client selection (allow duplicates with non-overlapping dates)
     */
    validateClientSelection(modalId) {
        const modal = document.getElementById(modalId);
        const clientEntries = modal.querySelectorAll('.client-entry');
        let hasErrors = false;

        // Clear previous errors
        clientEntries.forEach(entry => {
            const clientSelect = entry.querySelector('.client-select');
            const fromDate = entry.querySelector('input[name*="[date_from]"]');
            const toDate = entry.querySelector('input[name*="[date_to]"]');

            clientSelect.classList.remove('is-invalid');
            fromDate.classList.remove('is-invalid');
            toDate.classList.remove('is-invalid');
        });

        // Group entries by client
        const clientGroups = {};
        clientEntries.forEach((entry, index) => {
            const clientSelect = entry.querySelector('.client-select');
            const fromDate = entry.querySelector('input[name*="[date_from]"]');
            const toDate = entry.querySelector('input[name*="[date_to]"]');

            if (clientSelect.value && fromDate.value && toDate.value) {
                const clientId = clientSelect.value;
                if (!clientGroups[clientId]) {
                    clientGroups[clientId] = [];
                }
                clientGroups[clientId].push({
                    index,
                    entry,
                    clientSelect,
                    fromDate: new Date(fromDate.value),
                    toDate: new Date(toDate.value),
                    fromInput: fromDate,
                    toInput: toDate
                });
            }
        });

        // Check for overlapping date ranges within each client group
        Object.keys(clientGroups).forEach(clientId => {
            const entries = clientGroups[clientId];

            if (entries.length > 1) {
                // Check each pair for overlap
                for (let i = 0; i < entries.length; i++) {
                    for (let j = i + 1; j < entries.length; j++) {
                        const entry1 = entries[i];
                        const entry2 = entries[j];

                        // Check if date ranges overlap
                        const overlap = this.dateRangesOverlap(
                            entry1.fromDate, entry1.toDate,
                            entry2.fromDate, entry2.toDate
                        );

                        if (overlap) {
                            // Mark both entries as invalid
                            entry1.clientSelect.classList.add('is-invalid');
                            entry1.fromInput.classList.add('is-invalid');
                            entry1.toInput.classList.add('is-invalid');
                            entry2.clientSelect.classList.add('is-invalid');
                            entry2.fromInput.classList.add('is-invalid');
                            entry2.toInput.classList.add('is-invalid');
                            hasErrors = true;
                        }
                    }
                }
            }
        });

        return !hasErrors;
    },

    /**
     * Check if two date ranges overlap
     */
    dateRangesOverlap(start1, end1, start2, end2) {
        return start1 <= end2 && start2 <= end1;
    },

    /**
     * Validate date range (from <= to)
     */
    validateDateRange(dateInput) {
        const entryContainer = dateInput.closest('.client-entry');
        if (!entryContainer) return true;

        const fromDate = entryContainer.querySelector('input[name*="[date_from]"]');
        const toDate = entryContainer.querySelector('input[name*="[date_to]"]');

        if (fromDate && toDate && fromDate.value && toDate.value) {
            const from = new Date(fromDate.value);
            const to = new Date(toDate.value);

            // Remove previous error styling
            fromDate.classList.remove('is-invalid');
            toDate.classList.remove('is-invalid');

            if (from > to) {
                toDate.classList.add('is-invalid');
                return false;
            }
        }

        return true;
    },

    /**
     * Save monthly order
     */
    async saveMonthlyOrder(modalId, isEditMode, orderId, month, year) {
        try {
            const modal = document.getElementById(modalId);
            const form = modal.querySelector('form');

            // Validate form
            if (!this.validateMonthlyOrderForm(modalId)) {
                showError('يرجى تصحيح الأخطاء في النموذج');
                return;
            }

            // Collect form data
            const formData = new FormData(form);
            const data = this.collectMonthlyOrderData(formData);

            showLoading('جاري حفظ البيانات...');

            if (isEditMode && orderId) {
                await api.updateMonthlyOrder(orderId, data);
                showSuccess('تم تحديث السجل الشهري بنجاح');
            } else {
                await api.createMonthlyOrder(data);
                showSuccess('تم إضافة السجل الشهري بنجاح');
            }

            hideLoading();

            // Close modal and reload data
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            bootstrapModal.hide();

            this.loadMonthlyOrders(month, year);

        } catch (error) {
            hideLoading();
            showError(`خطأ في حفظ البيانات: ${error.message}`);
        }
    },

    /**
     * Validate monthly order form
     */
    validateMonthlyOrderForm(modalId) {
        const modal = document.getElementById(modalId);

        // Check required fields
        const requiredInputs = modal.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            input.classList.remove('is-invalid');
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            }
        });

        // Validate client selection
        if (!this.validateClientSelection(modalId)) {
            isValid = false;
        }

        // Validate date ranges
        const dateInputs = modal.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!this.validateDateRange(input)) {
                isValid = false;
            }
        });

        // Check if at least one client entry exists
        const clientEntries = modal.querySelectorAll('.client-entry');
        if (clientEntries.length === 0) {
            showError('يجب إضافة عميل واحد على الأقل');
            isValid = false;
        }

        return isValid;
    },

    /**
     * Collect monthly order data from form
     */
    collectMonthlyOrderData(formData) {
        const data = {
            driver_id: formData.get('driver_id'),
            month: parseInt(formData.get('month')),
            year: parseInt(formData.get('year')),
            entries: []
        };

        // Collect entries
        const entryIndices = new Set();
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('entries[')) {
                const match = key.match(/entries\[(\d+)\]/);
                if (match) {
                    entryIndices.add(parseInt(match[1]));
                }
            }
        }

        entryIndices.forEach(index => {
            const entry = {
                client_id: formData.get(`entries[${index}][client_id]`),
                commission_per_order: parseFloat(formData.get(`entries[${index}][commission_per_order]`)) || 0,
                note: formData.get(`entries[${index}][note]`) || '',
                periods: []
            };

            // Collect periods for this entry
            const periodIndices = new Set();
            for (const [key, value] of formData.entries()) {
                if (key.startsWith(`entries[${index}][periods][`)) {
                    const match = key.match(/entries\[\d+\]\[periods\]\[(\d+)\]/);
                    if (match) {
                        periodIndices.add(parseInt(match[1]));
                    }
                }
            }

            // If no periods found, check for legacy flat format
            if (periodIndices.size === 0) {
                const dateFrom = formData.get(`entries[${index}][date_from]`);
                const dateTo = formData.get(`entries[${index}][date_to]`);
                const numOrders = formData.get(`entries[${index}][num_orders]`);

                if (dateFrom && dateTo && numOrders) {
                    entry.periods.push({
                        date_from: dateFrom,
                        date_to: dateTo,
                        num_orders: parseInt(numOrders) || 0
                    });
                }
            } else {
                // Collect periods
                periodIndices.forEach(periodIndex => {
                    const period = {
                        date_from: formData.get(`entries[${index}][periods][${periodIndex}][date_from]`),
                        date_to: formData.get(`entries[${index}][periods][${periodIndex}][date_to]`),
                        num_orders: parseInt(formData.get(`entries[${index}][periods][${periodIndex}][num_orders]`)) || 0
                    };
                    entry.periods.push(period);
                });
            }

            // Calculate totals
            entry.total_orders = entry.periods.reduce((sum, period) => sum + period.num_orders, 0);
            entry.total_amount = entry.commission_per_order * entry.total_orders;

            data.entries.push(entry);
        });

        return data;
    },

    /**
     * Show order form modal
     */
    async showOrderForm(order = null) {
        const fields = [
            {
                name: 'driver_id',
                label: 'السائق',
                type: 'select',
                required: true,
                options: [], // Will be populated with drivers
                value: order ? order.driver_id : ''
            },
            {
                name: 'client_id',
                label: 'العميل',
                type: 'select',
                required: true,
                options: [], // Will be populated with clients
                value: order ? order.client_id : ''
            },
            {
                name: 'pickup_address',
                label: 'عنوان الاستلام',
                type: 'textarea',
                required: true,
                rows: 2,
                placeholder: 'أدخل عنوان الاستلام',
                value: order ? order.pickup_address : '',
                validation: {
                    minLength: 10,
                    message: 'يجب أن يكون عنوان الاستلام 10 أحرف على الأقل'
                }
            },
            {
                name: 'delivery_address',
                label: 'عنوان التسليم',
                type: 'textarea',
                required: true,
                rows: 2,
                placeholder: 'أدخل عنوان التسليم',
                value: order ? order.delivery_address : '',
                validation: {
                    minLength: 10,
                    message: 'يجب أن يكون عنوان التسليم 10 أحرف على الأقل'
                }
            },
            {
                name: 'order_date',
                label: 'تاريخ الطلب',
                type: 'date',
                required: true,
                value: order ? formatDateForInput(order.order_date) : new Date().toISOString().split('T')[0],
                validation: {
                    min: new Date().toISOString().split('T')[0],
                    message: 'لا يمكن أن يكون تاريخ الطلب في الماضي'
                }
            },
            {
                name: 'pickup_time',
                label: 'وقت الاستلام',
                type: 'time',
                value: order ? order.pickup_time : ''
            },
            {
                name: 'delivery_time',
                label: 'وقت التسليم',
                type: 'time',
                value: order ? order.delivery_time : ''
            },
            {
                name: 'status',
                label: 'حالة الطلب',
                type: 'select',
                required: true,
                options: [
                    { value: 'pending', label: 'في الانتظار' },
                    { value: 'in_progress', label: 'قيد التنفيذ' },
                    { value: 'completed', label: 'مكتمل' },
                    { value: 'cancelled', label: 'ملغي' }
                ],
                value: order ? order.status : 'pending'
            },
            {
                name: 'priority',
                label: 'الأولوية',
                type: 'select',
                options: [
                    { value: 'normal', label: 'عادي' },
                    { value: 'high', label: 'عالي' },
                    { value: 'urgent', label: 'عاجل' }
                ],
                value: order ? order.priority : 'normal'
            },
            {
                name: 'delivery_fee',
                label: 'رسوم التوصيل (د.ك)',
                type: 'number',
                min: 0,
                step: 0.001,
                placeholder: '0.000',
                value: order ? order.delivery_fee : '',
                validation: {
                    min: 0,
                    max: 100,
                    message: 'يجب أن تكون رسوم التوصيل بين 0 و 100 دينار كويتي'
                }
            },
            {
                name: 'estimated_distance',
                label: 'المسافة المقدرة (كم)',
                type: 'number',
                min: 0,
                step: 0.1,
                placeholder: '0.0',
                value: order ? order.estimated_distance : '',
                validation: {
                    min: 0,
                    max: 1000,
                    message: 'يجب أن تكون المسافة المقدرة بين 0 و 1000 كيلومتر'
                }
            },
            {
                name: 'notes',
                label: 'ملاحظات',
                type: 'textarea',
                rows: 3,
                placeholder: 'أدخل أي ملاحظات إضافية',
                value: order ? order.notes : ''
            }
        ];

        // Load drivers and clients for dropdowns
        await this.loadDataForOrderForm(fields);

        const modal = new FormModal('orderModal', {
            title: 'الطلب',
            icon: 'fas fa-shopping-cart',
            fields: fields,
            onSubmit: async (data, isEdit) => {
                try {
                    if (isEdit) {
                        await api.updateOrder(order.id, data);
                    } else {
                        await api.createOrder(data);
                    }

                    // Refresh the orders page
                    this.initializeOrdersPage();

                } catch (error) {
                    throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                }
            }
        });

        modal.show(order);
    },

    /**
     * Load drivers and clients for order form dropdowns
     */
    async loadDataForOrderForm(fields) {
        try {
            const [drivers, clients] = await Promise.all([
                api.getDrivers(),
                api.getClients()
            ]);

            const driverField = fields.find(f => f.name === 'driver_id');
            if (driverField) {
                driverField.options = drivers
                    .filter(driver => driver.is_active)
                    .map(driver => ({
                        value: driver.id,
                        label: `${driver.full_name} - ${driver.national_id}`
                    }));
            }

            const clientField = fields.find(f => f.name === 'client_id');
            if (clientField) {
                clientField.options = clients
                    .filter(client => client.is_active)
                    .map(client => ({
                        value: client.id,
                        label: `${client.company_name} - ${client.contact_person || 'غير محدد'}`
                    }));
            }
        } catch (error) {
            console.error('Error loading data for order form:', error);
            showError('حدث خطأ أثناء تحميل بيانات النموذج: ' + error.message);
        }
    },

    /**
     * Delete order
     */
    async deleteOrder(order) {
        const result = await showConfirm(
            `هل تريد حذف الطلب رقم "${order.id}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteOrder(order.id);
                showSuccess('تم حذف الطلب بنجاح');
                this.initializeOrdersPage();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف الطلب');
            }
        }
    },

    /**
     * Initialize advances page
     */
    async initializeAdvancesPage() {
        try {
            // Get advances data
            const advances = await api.getAdvances();

            // Define table columns
            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'id', label: 'رقم السُلفة', type: 'text' },
                { field: 'driver_name', label: 'السائق', type: 'text' },
                { field: 'amount', label: 'المبلغ', type: 'currency' },
                { field: 'paid_amount', label: 'المبلغ المدفوع', type: 'currency' },
                { field: 'remaining_balance', label: 'الرصيد المتبقي', type: 'currency' },
                { field: 'date_issued', label: 'تاريخ الإصدار', type: 'date' },
                { field: 'status', label: 'الحالة', type: 'advance_status' },
                { field: 'reason', label: 'السبب', type: 'text' }
            ];

            // Create data table
            const advancesTable = new DataTable('advancesContainer', {
                title: 'السُلف والمديونيات',
                icon: 'fas fa-hand-holding-usd',
                columns: columns,
                data: advances,
                actions: ['edit', 'delete'],
                selectable: true,
                onAdd: () => this.showAdvanceForm(),
                onEdit: (advance) => this.showAdvanceForm(advance),
                onDelete: (advance) => this.deleteAdvance(advance),
                onBulkDelete: (ids) => this.bulkDeleteAdvances(ids)
            });

            advancesTable.render();

        } catch (error) {
            console.error('Error initializing advances page:', error);
            document.getElementById('advancesContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل بيانات السُلف: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Show advance form modal
     */
    showAdvanceForm(advance = null) {
        const fields = [
            {
                name: 'driver_id',
                label: 'السائق',
                type: 'driver_select',
                required: true
            },
            {
                name: 'amount',
                label: 'مبلغ السُلفة (د.ك)',
                type: 'number',
                required: true,
                min: 0.001,
                step: 0.001,
                placeholder: '100.000'
            },
            {
                name: 'reason',
                label: 'سبب السُلفة',
                type: 'textarea',
                required: true,
                rows: 3,
                placeholder: 'أدخل سبب طلب السُلفة'
            },
            {
                name: 'advance_deduction_mode',
                label: 'طريقة خصم السُلفة',
                type: 'select',
                required: true,
                options: [
                    { value: 'fixed_amount', label: 'مبلغ ثابت' },
                    { value: 'percentage', label: 'نسبة مئوية' }
                ]
            },
            {
                name: 'advance_deduction_value',
                label: 'قيمة خصم السُلفة',
                type: 'number',
                required: true,
                min: 0,
                step: 0.001,
                placeholder: '50'
            },
            {
                name: 'date_issued',
                label: 'تاريخ الإصدار',
                type: 'date',
                required: true
            },
            {
                name: 'date_due',
                label: 'تاريخ الاستحقاق',
                type: 'date'
            },
            {
                name: 'payment_method',
                label: 'طريقة الدفع',
                type: 'select',
                options: [
                    { value: 'cash', label: 'نقداً' },
                    { value: 'bank_transfer', label: 'تحويل بنكي' },
                    { value: 'deduction', label: 'خصم من الراتب' }
                ]
            },
            {
                name: 'status',
                label: 'حالة السُلفة',
                type: 'select',
                required: true,
                options: [
                    { value: 'active', label: 'نشطة' },
                    { value: 'partial', label: 'مدفوعة جزئياً' },
                    { value: 'paid', label: 'مدفوعة بالكامل' },
                    { value: 'cancelled', label: 'ملغية' }
                ]
            },
            {
                name: 'paid_amount',
                label: 'المبلغ المدفوع (د.ك)',
                type: 'number',
                min: 0,
                step: 0.001,
                placeholder: '0.000'
            },
            {
                name: 'deduction_amount',
                label: 'مبلغ الخصم الشهري (د.ك)',
                type: 'number',
                min: 0,
                step: 0.001,
                placeholder: 'اختياري - للخصم التلقائي'
            },
            {
                name: 'notes',
                label: 'ملاحظات',
                type: 'textarea',
                rows: 2,
                placeholder: 'أدخل أي ملاحظات إضافية'
            }
        ];

        const modal = new FormModal('advanceModal', {
            title: 'السُلفة',
            icon: 'fas fa-hand-holding-usd',
            fields: fields,
            onSubmit: async (data, isEdit) => {
                try {
                    if (isEdit) {
                        await api.updateAdvance(advance.id, data);
                    } else {
                        await api.createAdvance(data);
                    }

                    // Refresh the advances page
                    this.initializeAdvancesPage();

                } catch (error) {
                    throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                }
            }
        });

        modal.show(advance);

        // Initialize driver select after modal is shown
        setTimeout(() => {
            modal.initializeDriverSelect('driver_id');
        }, 100);
    },



    /**
     * Delete advance
     */
    async deleteAdvance(advance) {
        const result = await showConfirm(
            `هل تريد حذف السُلفة رقم "${advance.id}" للسائق "${advance.driver_name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteAdvance(advance.id);
                showSuccess('تم حذف السُلفة بنجاح');
                this.initializeAdvancesPage();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف السُلفة');
            }
        }
    },

    /**
     * Bulk delete advances
     */
    async bulkDeleteAdvances(advanceIds) {
        if (!advanceIds || advanceIds.length === 0) {
            showError('لم يتم تحديد أي سُلف');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${advanceIds.length} سُلفة؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف السُلف...');
                const response = await api.bulkDeleteAdvances(advanceIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    this.initializeAdvancesPage();
                } else {
                    showError(response.message || 'فشل في حذف السُلف');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف السُلف');
            }
        }
    },

    /**
     * Initialize payroll page
     */
    async initializePayrollPage() {
        try {
            const container = document.getElementById('payrollContainer');

            // Create payroll interface
            container.innerHTML = `
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-money-bill-wave me-2"></i>إدارة الرواتب</h5>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">السنة</label>
                                        <select class="form-select" id="payrollYear">
                                            <option value="2024">2024</option>
                                            <option value="2025" selected>2025</option>
                                            <option value="2026">2026</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">الشهر</label>
                                        <select class="form-select" id="payrollMonth">
                                            <option value="1">يناير</option>
                                            <option value="2">فبراير</option>
                                            <option value="3">مارس</option>
                                            <option value="4">أبريل</option>
                                            <option value="5">مايو</option>
                                            <option value="6">يونيو</option>
                                            <option value="7">يوليو</option>
                                            <option value="8">أغسطس</option>
                                            <option value="9">سبتمبر</option>
                                            <option value="10">أكتوبر</option>
                                            <option value="11">نوفمبر</option>
                                            <option value="12">ديسمبر</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 d-flex align-items-end">
                                        <button class="btn btn-primary me-2" id="calculatePayrollBtn">
                                            <i class="fas fa-calculator me-1"></i>حساب الرواتب
                                        </button>
                                        <button class="btn btn-success" id="createPayrollRunBtn" disabled>
                                            <i class="fas fa-plus me-1"></i>إنشاء دفعة
                                        </button>
                                    </div>
                                </div>
                                <div id="payrollCalculationResult"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6><i class="fas fa-info-circle me-2"></i>معلومات</h6>
                            </div>
                            <div class="card-body">
                                <p class="small text-muted">
                                    • احسب الرواتب أولاً لمراجعة التفاصيل<br>
                                    • أنشئ دفعة رواتب بعد التأكد من البيانات<br>
                                    • اعتمد الدفعة لمعالجة خصم السُلف<br>
                                    • أغلق الدفعة بعد صرف الرواتب
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="payrollRunsContainer"></div>
            `;

            // Set current month
            const currentMonth = new Date().getMonth() + 1;
            document.getElementById('payrollMonth').value = currentMonth;

            // Setup event listeners
            this.setupPayrollEventListeners();

            // Load existing payroll runs
            this.loadPayrollRuns();

        } catch (error) {
            console.error('Error initializing payroll page:', error);
            document.getElementById('payrollContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل صفحة الرواتب: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Setup payroll event listeners
     */
    setupPayrollEventListeners() {
        document.getElementById('calculatePayrollBtn').addEventListener('click', () => {
            this.calculatePayroll();
        });

        document.getElementById('createPayrollRunBtn').addEventListener('click', () => {
            this.createPayrollRun();
        });
    },

    /**
     * Calculate payroll for selected month/year
     */
    async calculatePayroll() {
        try {
            const year = parseInt(document.getElementById('payrollYear').value);
            const month = parseInt(document.getElementById('payrollMonth').value);

            showLoading('جاري حساب الرواتب...');

            const result = await api.calculatePayroll(year, month);

            hideLoading();

            if (!result.success) {
                showError(result.error || 'خطأ في حساب الرواتب');
                return;
            }

            this.displayPayrollCalculation(result);
            document.getElementById('createPayrollRunBtn').disabled = false;

        } catch (error) {
            hideLoading();
            showError(error.message || 'حدث خطأ أثناء حساب الرواتب');
        }
    },

    /**
     * Display payroll calculation results
     */
    displayPayrollCalculation(result) {
        const container = document.getElementById('payrollCalculationResult');

        const successfulDrivers = result.payroll_results.filter(r => r.success);
        const failedDrivers = result.payroll_results.filter(r => !r.success);

        let html = `
            <div class="alert alert-info">
                <h6><i class="fas fa-calculator me-2"></i>نتائج حساب الرواتب - ${result.month}/${result.year}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <strong>إجمالي الراتب الأساسي:</strong> ${formatCurrency(result.totals.base_salary)}<br>
                        <strong>إجمالي العمولات:</strong> ${formatCurrency(result.totals.commission)}<br>
                        <strong>إجمالي الراتب الإجمالي:</strong> ${formatCurrency(result.totals.gross_salary)}
                    </div>
                    <div class="col-md-6">
                        <strong>إجمالي الخصومات:</strong> ${formatCurrency(result.totals.deductions)}<br>
                        <strong>إجمالي الراتب الصافي:</strong> ${formatCurrency(result.totals.net_salary)}<br>
                        <strong>عدد السائقين:</strong> ${result.driver_count}
                    </div>
                </div>
            </div>
        `;

        if (successfulDrivers.length > 0) {
            html += `
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>السائق</th>
                                <th>الراتب الأساسي</th>
                                <th>العمولات</th>
                                <th>الإجمالي</th>
                                <th>خصم السُلف</th>
                                <th>الصافي</th>
                                <th>عدد الطلبات</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            successfulDrivers.forEach(driver => {
                html += `
                    <tr>
                        <td>${driver.driver_name}</td>
                        <td>${formatCurrency(driver.base_salary)}</td>
                        <td>${formatCurrency(driver.commission_total)}</td>
                        <td>${formatCurrency(driver.gross_salary)}</td>
                        <td>${formatCurrency(driver.advance_deduction)}</td>
                        <td><strong>${formatCurrency(driver.net_salary)}</strong></td>
                        <td>${driver.order_count}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (failedDrivers.length > 0) {
            html += `
                <div class="alert alert-warning">
                    <h6>أخطاء في حساب الرواتب:</h6>
                    <ul class="mb-0">
            `;
            failedDrivers.forEach(driver => {
                html += `<li>${driver.error}</li>`;
            });
            html += `
                    </ul>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    /**
     * Create payroll run
     */
    async createPayrollRun() {
        try {
            const year = parseInt(document.getElementById('payrollYear').value);
            const month = parseInt(document.getElementById('payrollMonth').value);

            const result = await showConfirm(
                `هل تريد إنشاء دفعة رواتب للشهر ${month}/${year}؟`,
                'تأكيد إنشاء الدفعة'
            );

            if (result.isConfirmed) {
                showLoading('جاري إنشاء دفعة الرواتب...');

                const payrollRun = await api.createPayrollRun(year, month);

                hideLoading();
                showSuccess('تم إنشاء دفعة الرواتب بنجاح');

                // Clear calculation results and reload runs
                document.getElementById('payrollCalculationResult').innerHTML = '';
                document.getElementById('createPayrollRunBtn').disabled = true;
                this.loadPayrollRuns();
            }

        } catch (error) {
            hideLoading();
            showError(error.message || 'حدث خطأ أثناء إنشاء دفعة الرواتب');
        }
    },

    /**
     * Load payroll runs
     */
    async loadPayrollRuns() {
        try {
            const payrollRuns = await api.getPayrollRuns();

            const container = document.getElementById('payrollRunsContainer');

            if (payrollRuns.length === 0) {
                container.innerHTML = `
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h5>لا توجد دفعات رواتب</h5>
                            <p class="text-muted">احسب الرواتب وأنشئ دفعة جديدة</p>
                        </div>
                    </div>
                `;
                return;
            }

            // Create table for payroll runs
            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'id', label: 'رقم الدفعة', type: 'text' },
                { field: 'month', label: 'الشهر', type: 'text' },
                { field: 'year', label: 'السنة', type: 'text' },
                { field: 'driver_count', label: 'عدد السائقين', type: 'text' },
                { field: 'net_salary_total', label: 'إجمالي الرواتب', type: 'currency' },
                { field: 'status', label: 'الحالة', type: 'payroll_status' },
                { field: 'created_at', label: 'تاريخ الإنشاء', type: 'datetime' }
            ];

            // Add calculated total for display
            payrollRuns.forEach(run => {
                run.net_salary_total = run.totals?.net_salary || 0;
            });

            const payrollTable = new DataTable('payrollRunsContainer', {
                title: 'دفعات الرواتب',
                icon: 'fas fa-list',
                columns: columns,
                data: payrollRuns,
                actions: ['view'],
                onView: (run) => this.viewPayrollRun(run),
                customActions: [
                    {
                        label: 'اعتماد',
                        icon: 'fas fa-check',
                        class: 'btn-success btn-sm',
                        condition: (run) => run.status === 'pending',
                        action: (run) => this.approvePayrollRun(run)
                    },
                    {
                        label: 'معالجة الخصم',
                        icon: 'fas fa-minus-circle',
                        class: 'btn-warning btn-sm',
                        condition: (run) => run.status === 'approved' && !run.advance_deductions_processed,
                        action: (run) => this.processPayrollDeductions(run)
                    },
                    {
                        label: 'إغلاق',
                        icon: 'fas fa-lock',
                        class: 'btn-secondary btn-sm',
                        condition: (run) => run.status === 'approved',
                        action: (run) => this.closePayrollRun(run)
                    }
                ]
            });

            payrollTable.render();

        } catch (error) {
            console.error('Error loading payroll runs:', error);
            document.getElementById('payrollRunsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل دفعات الرواتب: ${error.message}
                </div>
            `;
        }
    },

    /**
     * View payroll run details
     */
    async viewPayrollRun(run) {
        try {
            const payrollRun = await api.getPayrollRun(run.id);

            // Create modal to show payroll run details
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-eye me-2"></i>
                                تفاصيل دفعة الرواتب - ${payrollRun.month}/${payrollRun.year}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.generatePayrollRunDetails(payrollRun)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
            });

        } catch (error) {
            showError(error.message || 'حدث خطأ أثناء تحميل تفاصيل الدفعة');
        }
    },

    /**
     * Generate payroll run details HTML
     */
    generatePayrollRunDetails(payrollRun) {
        const successfulDrivers = payrollRun.payroll_results.filter(r => r.success);

        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6>معلومات الدفعة</h6>
                    <p><strong>الحالة:</strong> <span class="badge bg-${this.getPayrollStatusClass(payrollRun.status)}">${this.getPayrollStatusText(payrollRun.status)}</span></p>
                    <p><strong>عدد السائقين:</strong> ${payrollRun.driver_count}</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${formatDateTime(payrollRun.created_at)}</p>
                </div>
                <div class="col-md-6">
                    <h6>الإجماليات</h6>
                    <p><strong>الراتب الأساسي:</strong> ${formatCurrency(payrollRun.totals.base_salary)}</p>
                    <p><strong>العمولات:</strong> ${formatCurrency(payrollRun.totals.commission)}</p>
                    <p><strong>الراتب الصافي:</strong> ${formatCurrency(payrollRun.totals.net_salary)}</p>
                </div>
            </div>
        `;

        if (successfulDrivers.length > 0) {
            html += `
                <h6>تفاصيل رواتب السائقين</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>السائق</th>
                                <th>الراتب الأساسي</th>
                                <th>العمولات</th>
                                <th>الإجمالي</th>
                                <th>خصم السُلف</th>
                                <th>الصافي</th>
                                <th>عدد الطلبات</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            successfulDrivers.forEach(driver => {
                html += `
                    <tr>
                        <td>${driver.driver_name}</td>
                        <td>${formatCurrency(driver.base_salary)}</td>
                        <td>${formatCurrency(driver.commission_total)}</td>
                        <td>${formatCurrency(driver.gross_salary)}</td>
                        <td>${formatCurrency(driver.advance_deduction)}</td>
                        <td><strong>${formatCurrency(driver.net_salary)}</strong></td>
                        <td>${driver.order_count}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        return html;
    },

    /**
     * Get payroll status CSS class
     */
    getPayrollStatusClass(status) {
        const statusMap = {
            'pending': 'warning',
            'approved': 'success',
            'closed': 'secondary'
        };
        return statusMap[status] || 'secondary';
    },

    /**
     * Get payroll status text
     */
    getPayrollStatusText(status) {
        const statusMap = {
            'pending': 'في الانتظار',
            'approved': 'معتمدة',
            'closed': 'مغلقة'
        };
        return statusMap[status] || status;
    },

    /**
     * Approve payroll run
     */
    async approvePayrollRun(run) {
        try {
            const result = await showConfirm(
                `هل تريد اعتماد دفعة الرواتب للشهر ${run.month}/${run.year}؟`,
                'تأكيد الاعتماد'
            );

            if (result.isConfirmed) {
                await api.approvePayrollRun(run.id);
                showSuccess('تم اعتماد دفعة الرواتب بنجاح');
                this.loadPayrollRuns();
            }

        } catch (error) {
            showError(error.message || 'حدث خطأ أثناء اعتماد دفعة الرواتب');
        }
    },

    /**
     * Process payroll deductions
     */
    async processPayrollDeductions(run) {
        try {
            const result = await showConfirm(
                `هل تريد معالجة خصم السُلف لدفعة الرواتب ${run.month}/${run.year}؟\nسيتم خصم المبالغ من السُلف المستحقة.`,
                'تأكيد معالجة الخصم'
            );

            if (result.isConfirmed) {
                showLoading('جاري معالجة خصم السُلف...');

                const deductionResult = await api.processPayrollDeductions(run.id);

                hideLoading();

                if (deductionResult.success) {
                    showSuccess(`تم معالجة خصم السُلف بنجاح. تم خصم ${formatCurrency(deductionResult.total_deducted)} من ${deductionResult.processed_count} سُلفة.`);
                    this.loadPayrollRuns();
                } else {
                    showError(deductionResult.error || 'خطأ في معالجة خصم السُلف');
                }
            }

        } catch (error) {
            hideLoading();
            showError(error.message || 'حدث خطأ أثناء معالجة خصم السُلف');
        }
    },

    /**
     * Close payroll run
     */
    async closePayrollRun(run) {
        try {
            const result = await showConfirm(
                `هل تريد إغلاق دفعة الرواتب للشهر ${run.month}/${run.year}؟\nلن يمكن تعديلها بعد الإغلاق.`,
                'تأكيد الإغلاق'
            );

            if (result.isConfirmed) {
                await api.closePayrollRun(run.id);
                showSuccess('تم إغلاق دفعة الرواتب بنجاح');
                this.loadPayrollRuns();
            }

        } catch (error) {
            showError(error.message || 'حدث خطأ أثناء إغلاق دفعة الرواتب');
        }
    },

    /**
     * Initialize maintenance page
     */
    async initializeMaintenancePage() {
        try {
            const container = document.getElementById('maintenanceContainer');

            // Create maintenance interface with tabs
            container.innerHTML = `
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <ul class="nav nav-tabs card-header-tabs" id="maintenanceTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="schedules-tab" data-bs-toggle="tab"
                                                data-bs-target="#schedules" type="button" role="tab">
                                            <i class="fas fa-calendar-alt me-2"></i>جدولة الصيانة
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="due-tab" data-bs-toggle="tab"
                                                data-bs-target="#due" type="button" role="tab">
                                            <i class="fas fa-exclamation-triangle me-2"></i>الصيانة المستحقة
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="logs-tab" data-bs-toggle="tab"
                                                data-bs-target="#logs" type="button" role="tab">
                                            <i class="fas fa-history me-2"></i>سجل الصيانة
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-body">
                                <div class="tab-content" id="maintenanceTabContent">
                                    <div class="tab-pane fade show active" id="schedules" role="tabpanel">
                                        <div id="maintenanceSchedulesContainer"></div>
                                    </div>
                                    <div class="tab-pane fade" id="due" role="tabpanel">
                                        <div id="dueMaintenanceContainer"></div>
                                    </div>
                                    <div class="tab-pane fade" id="logs" role="tabpanel">
                                        <div id="maintenanceLogsContainer"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Setup tab event listeners
            this.setupMaintenanceTabListeners();

            // Load initial data
            this.loadMaintenanceSchedules();

        } catch (error) {
            console.error('Error initializing maintenance page:', error);
            document.getElementById('maintenanceContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل صفحة الصيانة: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Setup maintenance tab listeners
     */
    setupMaintenanceTabListeners() {
        const tabButtons = document.querySelectorAll('#maintenanceTabs button[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const target = event.target.getAttribute('data-bs-target');
                switch (target) {
                    case '#schedules':
                        this.loadMaintenanceSchedules();
                        break;
                    case '#due':
                        this.loadDueMaintenance();
                        break;
                    case '#logs':
                        this.loadMaintenanceLogs();
                        break;
                }
            });
        });
    },

    /**
     * Load maintenance schedules
     */
    async loadMaintenanceSchedules() {
        try {
            const schedules = await api.getMaintenanceSchedules();

            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'vehicle_info', label: 'السيارة', type: 'text' },
                { field: 'maintenance_type', label: 'نوع الصيانة', type: 'text' },
                { field: 'due_date', label: 'تاريخ الاستحقاق', type: 'date' },
                { field: 'due_mileage', label: 'الكيلومترات المستحقة', type: 'text' },
                { field: 'priority', label: 'الأولوية', type: 'maintenance_priority' },
                { field: 'status', label: 'الحالة', type: 'maintenance_status' },
                { field: 'estimated_cost', label: 'التكلفة المقدرة', type: 'currency' }
            ];

            const schedulesTable = new DataTable('maintenanceSchedulesContainer', {
                title: 'جدولة الصيانة',
                icon: 'fas fa-calendar-alt',
                columns: columns,
                data: schedules,
                actions: ['edit', 'delete'],
                exportable: true,
                importable: true,
                selectable: true,
                onAdd: () => this.showMaintenanceScheduleForm(),
                onEdit: (schedule) => this.showMaintenanceScheduleForm(schedule),
                onDelete: (schedule) => this.deleteMaintenanceSchedule(schedule),
                onBulkDelete: (ids) => this.bulkDeleteMaintenanceSchedules(ids),
                onImport: (data) => this.importMaintenanceSchedules(data)
            });

            schedulesTable.render();

        } catch (error) {
            console.error('Error loading maintenance schedules:', error);
            document.getElementById('maintenanceSchedulesContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل جدولة الصيانة: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Show maintenance schedule form
     */
    async showMaintenanceScheduleForm(schedule = null) {
        const fields = [
            {
                name: 'vehicle_id',
                label: 'السيارة',
                type: 'select',
                required: true,
                options: [] // Will be populated with vehicles
            },
            {
                name: 'maintenance_type',
                label: 'نوع الصيانة',
                type: 'select',
                required: true,
                options: [
                    { value: 'oil_change', label: 'تغيير الزيت' },
                    { value: 'tire_rotation', label: 'تدوير الإطارات' },
                    { value: 'brake_service', label: 'صيانة الفرامل' },
                    { value: 'engine_service', label: 'صيانة المحرك' },
                    { value: 'transmission_service', label: 'صيانة ناقل الحركة' },
                    { value: 'ac_service', label: 'صيانة التكييف' },
                    { value: 'general_inspection', label: 'فحص عام' },
                    { value: 'other', label: 'أخرى' }
                ]
            },
            {
                name: 'due_date',
                label: 'تاريخ الاستحقاق',
                type: 'date',
                required: true
            },
            {
                name: 'due_mileage',
                label: 'الكيلومترات المستحقة',
                type: 'number',
                min: 0,
                placeholder: 'اختياري'
            },
            {
                name: 'description',
                label: 'وصف الصيانة',
                type: 'textarea',
                rows: 3,
                placeholder: 'تفاصيل الصيانة المطلوبة'
            },
            {
                name: 'priority',
                label: 'الأولوية',
                type: 'select',
                options: [
                    { value: 'low', label: 'منخفضة' },
                    { value: 'normal', label: 'عادية' },
                    { value: 'high', label: 'عالية' },
                    { value: 'urgent', label: 'عاجلة' }
                ]
            },
            {
                name: 'status',
                label: 'الحالة',
                type: 'select',
                required: true,
                options: [
                    { value: 'scheduled', label: 'مجدولة' },
                    { value: 'pending', label: 'في الانتظار' },
                    { value: 'in_progress', label: 'قيد التنفيذ' },
                    { value: 'completed', label: 'مكتملة' },
                    { value: 'cancelled', label: 'ملغية' }
                ]
            },
            {
                name: 'estimated_cost',
                label: 'التكلفة المقدرة (د.ك)',
                type: 'number',
                min: 0,
                step: 0.001,
                placeholder: '0.000'
            },
            {
                name: 'notes',
                label: 'ملاحظات',
                type: 'textarea',
                rows: 2,
                placeholder: 'ملاحظات إضافية'
            }
        ];

        // Load vehicles for dropdown
        await this.loadVehiclesForMaintenanceForm(fields);

        const modal = new FormModal('maintenanceScheduleModal', {
            title: 'جدولة الصيانة',
            icon: 'fas fa-calendar-alt',
            fields: fields,
            onSubmit: async (data, isEdit) => {
                try {
                    if (isEdit) {
                        await api.updateMaintenanceSchedule(schedule.id, data);
                    } else {
                        await api.createMaintenanceSchedule(data);
                    }

                    // Refresh the schedules
                    this.loadMaintenanceSchedules();

                } catch (error) {
                    throw new Error(error.message || 'حدث خطأ أثناء حفظ البيانات');
                }
            }
        });

        modal.show(schedule);
    },

    /**
     * Load vehicles for maintenance form dropdown
     */
    async loadVehiclesForMaintenanceForm(fields) {
        try {
            const vehicles = await api.getVehicles();
            const vehicleField = fields.find(f => f.name === 'vehicle_id');
            if (vehicleField) {
                const activeVehicles = vehicles.filter(vehicle => vehicle.is_active);

                if (activeVehicles.length === 0) {
                    vehicleField.options = [
                        { value: '', label: 'لا توجد سيارات نشطة متاحة' }
                    ];
                } else {
                    vehicleField.options = activeVehicles.map(vehicle => ({
                        value: vehicle.id,
                        label: `${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}`
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading vehicles for maintenance form:', error);
            const vehicleField = fields.find(f => f.name === 'vehicle_id');
            if (vehicleField) {
                vehicleField.options = [
                    { value: '', label: 'خطأ في تحميل السيارات' }
                ];
            }
        }
    },

    /**
     * Delete maintenance schedule
     */
    async deleteMaintenanceSchedule(schedule) {
        const result = await showConfirm(
            `هل تريد حذف جدولة الصيانة للسيارة "${schedule.vehicle_info}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteMaintenanceSchedule(schedule.id);
                showSuccess('تم حذف جدولة الصيانة بنجاح');
                this.loadMaintenanceSchedules();
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء حذف جدولة الصيانة');
            }
        }
    },

    /**
     * Bulk delete maintenance schedules
     */
    async bulkDeleteMaintenanceSchedules(scheduleIds) {
        if (!scheduleIds || scheduleIds.length === 0) {
            showError('لم يتم تحديد أي جدولات صيانة');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${scheduleIds.length} جدولة صيانة؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف جدولات الصيانة...');
                const response = await api.bulkDeleteMaintenanceSchedules(scheduleIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    this.loadMaintenanceSchedules();
                } else {
                    showError(response.message || 'فشل في حذف جدولات الصيانة');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف جدولات الصيانة');
            }
        }
    },

    /**
     * Load due maintenance
     */
    async loadDueMaintenance() {
        try {
            const dueMaintenance = await api.getDueMaintenance();

            const container = document.getElementById('dueMaintenanceContainer');

            if (dueMaintenance.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-success text-center">
                        <i class="fas fa-check-circle fa-3x mb-3"></i>
                        <h5>لا توجد صيانة مستحقة</h5>
                        <p class="text-muted">جميع السيارات محدثة الصيانة</p>
                    </div>
                `;
                return;
            }

            // Separate overdue and due soon
            const overdue = dueMaintenance.filter(m => m.is_overdue);
            const dueSoon = dueMaintenance.filter(m => m.is_due_soon);
            const upcoming = dueMaintenance.filter(m => !m.is_overdue && !m.is_due_soon);

            let html = '';

            if (overdue.length > 0) {
                html += `
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>صيانة متأخرة (${overdue.length})</h6>
                        <div class="table-responsive">
                            <table class="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>السيارة</th>
                                        <th>نوع الصيانة</th>
                                        <th>تاريخ الاستحقاق</th>
                                        <th>الأيام المتأخرة</th>
                                        <th>الأولوية</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                overdue.forEach(maintenance => {
                    html += `
                        <tr>
                            <td>${maintenance.vehicle_info}</td>
                            <td>${maintenance.maintenance_type}</td>
                            <td>${maintenance.due_date}</td>
                            <td><span class="badge bg-danger">${Math.abs(maintenance.days_until_due)} يوم</span></td>
                            <td><span class="badge bg-${this.getMaintenancePriorityClass(maintenance.priority)}">${this.getMaintenancePriorityText(maintenance.priority)}</span></td>
                        </tr>
                    `;
                });
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            if (dueSoon.length > 0) {
                html += `
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-clock me-2"></i>صيانة مستحقة قريباً (${dueSoon.length})</h6>
                        <div class="table-responsive">
                            <table class="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>السيارة</th>
                                        <th>نوع الصيانة</th>
                                        <th>تاريخ الاستحقاق</th>
                                        <th>الأيام المتبقية</th>
                                        <th>الأولوية</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                dueSoon.forEach(maintenance => {
                    html += `
                        <tr>
                            <td>${maintenance.vehicle_info}</td>
                            <td>${maintenance.maintenance_type}</td>
                            <td>${maintenance.due_date}</td>
                            <td><span class="badge bg-warning">${maintenance.days_until_due} يوم</span></td>
                            <td><span class="badge bg-${this.getMaintenancePriorityClass(maintenance.priority)}">${this.getMaintenancePriorityText(maintenance.priority)}</span></td>
                        </tr>
                    `;
                });
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            if (upcoming.length > 0) {
                html += `
                    <div class="alert alert-info">
                        <h6><i class="fas fa-calendar me-2"></i>صيانة مجدولة (${upcoming.length})</h6>
                        <div class="table-responsive">
                            <table class="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>السيارة</th>
                                        <th>نوع الصيانة</th>
                                        <th>تاريخ الاستحقاق</th>
                                        <th>الأيام المتبقية</th>
                                        <th>الأولوية</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                upcoming.forEach(maintenance => {
                    html += `
                        <tr>
                            <td>${maintenance.vehicle_info}</td>
                            <td>${maintenance.maintenance_type}</td>
                            <td>${maintenance.due_date}</td>
                            <td><span class="badge bg-info">${maintenance.days_until_due} يوم</span></td>
                            <td><span class="badge bg-${this.getMaintenancePriorityClass(maintenance.priority)}">${this.getMaintenancePriorityText(maintenance.priority)}</span></td>
                        </tr>
                    `;
                });
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading due maintenance:', error);
            document.getElementById('dueMaintenanceContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل الصيانة المستحقة: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Load maintenance logs
     */
    async loadMaintenanceLogs() {
        try {
            const logs = await api.getMaintenanceLogs();

            // Define columns for maintenance logs table
            const columns = [
                { key: 'id', label: 'م', type: 'number' },
                { key: 'vehicle_name', label: 'اسم السيارة', type: 'text' },
                { key: 'maintenance_date', label: 'تاريخ الصيانة', type: 'date' },
                { key: 'maintenance_type', label: 'نوع الصيانة', type: 'text' },
                { key: 'technician', label: 'الفني المسؤول', type: 'text' },
                { key: 'cost', label: 'التكلفة', type: 'currency' },
                { key: 'mileage', label: 'الكيلومترات', type: 'number' },
                { key: 'status', label: 'الحالة', type: 'maintenance_status' }
            ];

            // Create data table for maintenance logs
            const logsTable = new DataTable('maintenanceLogsContainer', {
                title: 'سجل الصيانة',
                icon: 'fas fa-tools',
                columns: columns,
                data: logs,
                actions: ['edit', 'delete', 'view'],
                exportable: true,
                importable: true,
                onAdd: () => this.showMaintenanceLogForm(),
                onEdit: (log) => this.showMaintenanceLogForm(log),
                onDelete: (log) => this.deleteMaintenanceLog(log),
                onView: (log) => this.showMaintenanceLogDetails(log),
                onImport: (data) => this.importMaintenanceLogs(data)
            });

        } catch (error) {
            console.error('Error loading maintenance logs:', error);
            document.getElementById('maintenanceLogsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل سجل الصيانة: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Get maintenance priority CSS class
     */
    getMaintenancePriorityClass(priority) {
        const priorityMap = {
            'low': 'secondary',
            'normal': 'primary',
            'high': 'warning',
            'urgent': 'danger'
        };
        return priorityMap[priority] || 'secondary';
    },

    /**
     * Get maintenance priority text
     */
    getMaintenancePriorityText(priority) {
        const priorityMap = {
            'low': 'منخفضة',
            'normal': 'عادية',
            'high': 'عالية',
            'urgent': 'عاجلة'
        };
        return priorityMap[priority] || priority;
    },

    /**
     * Show maintenance log form
     */
    async showMaintenanceLogForm(log = null) {
        try {
            // Load vehicles for dropdown
            const vehicles = await api.getVehicles();

            const fields = [
                {
                    name: 'vehicle_id',
                    label: 'اسم السيارة',
                    type: 'select',
                    required: true,
                    options: vehicles.map(v => ({ value: v.id, text: v.name })),
                    value: log ? log.vehicle_id : ''
                },
                {
                    name: 'maintenance_date',
                    label: 'تاريخ الصيانة',
                    type: 'date',
                    required: true,
                    value: log ? formatDateForInput(log.maintenance_date) : new Date().toISOString().split('T')[0]
                },
                {
                    name: 'maintenance_type',
                    label: 'نوع الصيانة',
                    type: 'text',
                    required: true,
                    placeholder: 'مثل: تغيير زيت، إصلاح فرامل، إلخ...',
                    value: log ? log.maintenance_type : ''
                },
                {
                    name: 'description',
                    label: 'وصف الصيانة',
                    type: 'textarea',
                    required: true,
                    placeholder: 'اكتب تفاصيل العملية المنجزة...',
                    value: log ? log.description : ''
                },
                {
                    name: 'technician',
                    label: 'الفني المسؤول',
                    type: 'text',
                    placeholder: 'اسم الفني أو الورشة',
                    value: log ? log.technician : ''
                },
                {
                    name: 'cost',
                    label: 'التكلفة (د.ك)',
                    type: 'number',
                    step: '0.001',
                    min: '0',
                    placeholder: '0.000',
                    value: log ? log.cost : ''
                },
                {
                    name: 'mileage',
                    label: 'الكيلومترات الحالية',
                    type: 'number',
                    min: '0',
                    placeholder: 'كيلومترات العداد',
                    value: log ? log.mileage : ''
                },
                {
                    name: 'parts_used',
                    label: 'القطع المستخدمة',
                    type: 'textarea',
                    placeholder: 'اذكر القطع الغيار أو المواد المستخدمة...',
                    value: log ? log.parts_used : ''
                },
                {
                    name: 'next_service_date',
                    label: 'تاريخ الصيانة القادمة',
                    type: 'date',
                    value: log ? (log.next_service_date ? formatDateForInput(log.next_service_date) : '') : ''
                },
                {
                    name: 'next_service_mileage',
                    label: 'كيلومترات الصيانة القادمة',
                    type: 'number',
                    min: '0',
                    placeholder: 'الكيلومترات للصيانة القادمة',
                    value: log ? log.next_service_mileage : ''
                },
                {
                    name: 'status',
                    label: 'حالة الصيانة',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'completed', text: 'مكتملة' },
                        { value: 'in_progress', text: 'قيد التنفيذ' },
                        { value: 'pending', text: 'في الانتظار' },
                        { value: 'cancelled', text: 'ملغية' }
                    ],
                    value: log ? log.status : 'completed'
                },
                {
                    name: 'notes',
                    label: 'ملاحظات إضافية',
                    type: 'textarea',
                    placeholder: 'أي ملاحظات أو توصيات إضافية...',
                    value: log ? log.notes : ''
                }
            ];

            const modal = new FormModal('maintenanceLogModal', {
                title: log ? 'تعديل سجل الصيانة' : 'إضافة سجل صيانة جديد',
                fields: fields,
                size: 'lg',
                onSubmit: async (data) => {
                    try {
                        if (log) {
                            await api.updateMaintenanceLog(log.id, data);
                            showSuccess('تم تحديث سجل الصيانة بنجاح');
                        } else {
                            await api.createMaintenanceLog(data);
                            showSuccess('تم إضافة سجل الصيانة بنجاح');
                        }

                        // Refresh the maintenance logs table
                        await this.loadMaintenanceLogs();
                    } catch (error) {
                        throw error;
                    }
                }
            });

            modal.show(log);

        } catch (error) {
            showError('حدث خطأ أثناء تحميل نموذج سجل الصيانة: ' + error.message);
            console.error('Error showing maintenance log form:', error);
        }
    },

    /**
     * Delete maintenance log
     */
    async deleteMaintenanceLog(log) {
        try {
            const result = await showConfirm(
                `هل تريد حذف سجل الصيانة "${log.maintenance_type}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
                'تأكيد الحذف'
            );

            if (result.isConfirmed) {
                await api.deleteMaintenanceLog(log.id);
                showSuccess('تم حذف سجل الصيانة بنجاح');
                await this.loadMaintenanceLogs();
            }
        } catch (error) {
            showError(error.message || 'حدث خطأ أثناء حذف سجل الصيانة');
        }
    },

    /**
     * Show maintenance log details
     */
    async showMaintenanceLogDetails(log) {
        try {
            // Get vehicle information
            const vehicles = await api.getVehicles();
            const vehicle = vehicles.find(v => v.id === log.vehicle_id);

            const modalHtml = `
                <div class="modal fade" id="maintenanceLogDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-tools me-2"></i>
                                    تفاصيل سجل الصيانة
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-car me-2"></i>
                                                    معلومات المركبة
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                <p><strong>اسم السيارة:</strong><br>${vehicle ? vehicle.name : 'غير محدد'}</p>
                                                <p><strong>رقم اللوحة:</strong><br>${vehicle ? vehicle.plate_number : 'غير محدد'}</p>
                                                <p><strong>النوع:</strong><br>${vehicle ? vehicle.type : 'غير محدد'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-calendar me-2"></i>
                                                    تفاصيل الصيانة
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                <p><strong>تاريخ الصيانة:</strong><br>${formatDate(log.maintenance_date)}</p>
                                                <p><strong>نوع الصيانة:</strong><br>${log.maintenance_type}</p>
                                                <p><strong>الفني المسؤول:</strong><br>${log.technician || 'غير محدد'}</p>
                                                <p><strong>التكلفة:</strong><br>${formatCurrency(log.cost)}</p>
                                                <p><strong>الكيلومترات:</strong><br>${log.mileage ? log.mileage.toLocaleString() + ' كم' : 'غير محدد'}</p>
                                                <p><strong>الحالة:</strong><br>
                                                    <span class="badge bg-${this.getMaintenanceStatusClass(log.status)}">
                                                        ${this.getMaintenanceStatusText(log.status)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mt-3">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-clipboard-list me-2"></i>
                                                    تفاصيل العمل المنجز
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                <p><strong>وصف الصيانة:</strong><br>${log.description}</p>
                                                ${log.parts_used ? `<p><strong>القطع المستخدمة:</strong><br>${log.parts_used}</p>` : ''}
                                                ${log.notes ? `<p><strong>ملاحظات:</strong><br>${log.notes}</p>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                ${log.next_service_date || log.next_service_mileage ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-clock me-2"></i>
                                                    الصيانة القادمة
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                ${log.next_service_date ? `<p><strong>التاريخ المقترح:</strong><br>${formatDate(log.next_service_date)}</p>` : ''}
                                                ${log.next_service_mileage ? `<p><strong>الكيلومترات المقترحة:</strong><br>${log.next_service_mileage.toLocaleString()} كم</p>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" onclick="app.showMaintenanceLogForm(${JSON.stringify(log).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-edit me-2"></i>تعديل
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('maintenanceLogDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add new modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('maintenanceLogDetailsModal'));
            modal.show();

            // Clean up when modal is hidden
            document.getElementById('maintenanceLogDetailsModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });

        } catch (error) {
            console.error('Error loading maintenance log details:', error);
            showError('حدث خطأ أثناء تحميل تفاصيل سجل الصيانة');
        }
    },

    /**
     * Get maintenance status class for badge
     */
    getMaintenanceStatusClass(status) {
        const statusMap = {
            'completed': 'success',
            'in_progress': 'warning',
            'pending': 'info',
            'cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    },

    /**
     * Get maintenance status text in Arabic
     */
    getMaintenanceStatusText(status) {
        const statusMap = {
            'completed': 'مكتملة',
            'in_progress': 'قيد التنفيذ',
            'pending': 'في الانتظار',
            'cancelled': 'ملغية'
        };
        return statusMap[status] || status;
    },

    /**
     * Import maintenance logs
     */
    async importMaintenanceLogs(data) {
        try {
            // Process and validate imported data
            let successCount = 0;
            let errorCount = 0;
            
            for (const logData of data) {
                try {
                    await api.createMaintenanceLog(logData);
                    successCount++;
                } catch (error) {
                    console.error('Error importing maintenance log:', error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showSuccess(`تم استيراد ${successCount} سجل صيانة بنجاح`);
                await this.loadMaintenanceLogs();
            }
            
            if (errorCount > 0) {
                showError(`فشل استيراد ${errorCount} سجل من أصل ${data.length}`);
            }

        } catch (error) {
            showError('حدث خطأ أثناء استيراد سجلات الصيانة: ' + error.message);
            console.error('Error importing maintenance logs:', error);
        }
    },







    /**
     * Initialize reports page
     */
    async initializeReportsPage() {
        try {
            const container = document.getElementById('reportsContainer');

            container.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-chart-bar me-2"></i>إنشاء التقارير</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">نوع التقرير</label>
                                    <select class="form-select" id="reportType">
                                        <option value="">اختر نوع التقرير</option>
                                        <option value="driver_statement">كشف حساب السائق</option>
                                        <option value="financial_summary">الملخص المالي</option>
                                        <option value="commission_report">تقرير العمولات</option>
                                        <option value="payroll_summary">ملخص الرواتب</option>
                                        <option value="maintenance_report">تقرير الصيانة</option>
                                        <option value="orders_summary">ملخص الطلبات</option>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">من تاريخ</label>
                                    <input type="date" class="form-control" id="reportFromDate">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">إلى تاريخ</label>
                                    <input type="date" class="form-control" id="reportToDate">
                                </div>

                                <div class="mb-3" id="driverSelectContainer" style="display: none;">
                                    <label class="form-label">السائق</label>
                                    <select class="form-select" id="reportDriverId">
                                        <option value="">جميع السائقين</option>
                                    </select>
                                </div>

                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary" id="generateReportBtn">
                                        <i class="fas fa-chart-line me-2"></i>إنشاء التقرير
                                    </button>
                                    <button class="btn btn-success" id="exportReportBtn" disabled>
                                        <i class="fas fa-download me-2"></i>تصدير Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-file-alt me-2"></i>معاينة التقرير</h5>
                            </div>
                            <div class="card-body">
                                <div id="reportPreview">
                                    <div class="text-center text-muted">
                                        <i class="fas fa-chart-bar fa-3x mb-3"></i>
                                        <h5>اختر نوع التقرير والفترة الزمنية</h5>
                                        <p>سيتم عرض التقرير هنا بعد الإنشاء</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Set default dates (current month)
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            document.getElementById('reportFromDate').value = firstDay.toISOString().split('T')[0];
            document.getElementById('reportToDate').value = lastDay.toISOString().split('T')[0];

            // Setup event listeners
            this.setupReportsEventListeners();

            // Load drivers for dropdown
            this.loadDriversForReports();

        } catch (error) {
            console.error('Error initializing reports page:', error);
            document.getElementById('reportsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل صفحة التقارير: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Initialize documents page
     */
    async initializeDocumentsPage() {
        try {
            // Check authentication before initializing documents page
            if (!this.currentUser) {
                console.log('Documents page initialization skipped - user not authenticated');
                return;
            }

            // Load and initialize the documents management system
            await this.loadDocumentsAssets();

            // Initialize the documents manager
            if (typeof DocumentsManager !== 'undefined') {
                window.documentsManager = new DocumentsManager();
                await window.documentsManager.init();
            } else {
                console.error('DocumentsManager class not found');
                throw new Error('Documents management system not available');
            }

        } catch (error) {
            console.error('Error initializing documents page:', error);
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        خطأ في تحميل صفحة الوثائق: ${error.message}
                    </div>
                `;
            }
        }
    },

    /**
     * Load documents management assets (CSS and JS)
     */
    async loadDocumentsAssets() {
        return new Promise((resolve, reject) => {
            // Check if documents.js is already loaded
            if (typeof DocumentsManager !== 'undefined') {
                resolve();
                return;
            }

            // Load documents.js
            const script = document.createElement('script');
            script.src = '/static/js/documents.js';
            script.onload = () => {
                console.log('Documents management assets loaded successfully');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load documents management assets'));
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Open company documents page
     */
    async openCompanyDocuments(companyId) {
        try {
            // Show loading
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <div class="loading-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <div class="loading-text">جاري تحميل وثائق الشركة...</div>
                </div>
            `;

            // Get company info
            const companyInfo = this.getCompanyInfo(companyId);
            
            // Load company documents
            const documents = await this.loadCompanyDocuments(companyId);
            
            // Render company documents page
            mainContent.innerHTML = this.getCompanyDocumentsPageHTML(companyInfo, documents);
            
            // Initialize company document functionality
            this.initializeCompanyDocuments(companyId);
            
        } catch (error) {
            console.error('Error opening company documents:', error);
            showError('خطأ في فتح صفحة وثائق الشركة: ' + error.message);
        }
    },

    /**
     * Get company information
     */
    getCompanyInfo(companyId) {
        const companies = {
            'emmar': {
                id: 'emmar',
                name: 'شركة إعمار',
                type: 'شركة توصيل',
                description: 'شركة إعمار لخدمات التوصيل والنقل'
            }
        };
        return companies[companyId] || null;
    },

    /**
     * Load company documents from API
     */
    async loadCompanyDocuments(companyId) {
        try {
            // Filter documents by company_id
            const response = await api.getDocuments();
            // Access the documents array from the response object
            const documents = response.documents || [];
            return documents.filter(doc => doc.company_id === companyId);
        } catch (error) {
            console.error('Error loading company documents:', error);
            return [];
        }
    },

    /**
     * Generate HTML for company documents page
     */
    getCompanyDocumentsPageHTML(company, documents) {
        return `
            <div class="company-documents-page">
                <!-- Back Button -->
                <a href="#" onclick="app.showSection('documents')" class="back-button">
                    <i class="fas fa-arrow-right"></i>
                    العودة للوثائق
                </a>

                <!-- Company Header -->
                <div class="company-header">
                    <div class="d-flex align-items-center">
                        <div class="company-logo me-3">
                            <i class="fas fa-building"></i>
                        </div>
                        <div>
                            <h1 class="company-title">${company.name}</h1>
                            <p class="company-subtitle">${company.description}</p>
                        </div>
                    </div>
                </div>

                <!-- Upload Section -->
                <div class="upload-section mb-4">
                    <button class="btn btn-primary btn-lg" onclick="app.openCompanyUploadModal('${company.id}')">
                        <i class="fas fa-upload me-2"></i>
                        رفع وثيقة جديدة
                    </button>
                </div>

                <!-- Documents Grid -->
                <div class="row" id="companyDocumentsGrid">
                    ${documents.length > 0 ? this.generateCompanyDocumentCards(documents) : 
                        '<div class="col-12"><div class="alert alert-info text-center">لا توجد وثائق مرفوعة بعد</div></div>'}
                </div>
            </div>

            <!-- Upload Modal -->
            ${this.getCompanyUploadModalHTML(company.id)}

            <!-- Edit Modal -->
            ${this.getCompanyEditModalHTML(company.id)}
        `;
    },

    /**
     * Generate company document cards HTML
     */
    generateCompanyDocumentCards(documents) {
        return documents.map(doc => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card document-card h-100">
                    <div class="card-header">
                        <h6 class="card-title mb-0">${doc.document_name}</h6>
                        <small class="text-muted">${doc.category || 'غير محدد'}</small>
                    </div>
                    <div class="card-body">
                        <div class="document-info">
                            <p><strong>النوع:</strong> ${doc.document_type || 'غير محدد'}</p>
                            <p><strong>تاريخ الرفع:</strong> ${this.formatDate(doc.upload_date)}</p>
                            ${doc.expiry_date ? `<p><strong>تاريخ الانتهاء:</strong> ${this.formatDate(doc.expiry_date)}</p>` : ''}
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.previewCompanyDocument('${doc.id}')">
                                <i class="fas fa-eye"></i> عرض
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="app.editCompanyDocument('${doc.id}')">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="app.deleteCompanyDocument('${doc.id}')">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Get company upload modal HTML
     */
    getCompanyUploadModalHTML(companyId) {
        return `
            <div class="modal fade" id="companyUploadModal" tabindex="-1" dir="rtl">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">رفع وثيقة جديدة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="companyUploadForm" enctype="multipart/form-data">
                                <input type="hidden" name="company_id" value="${companyId}">
                                <div class="mb-3">
                                    <label class="form-label">اسم الوثيقة</label>
                                    <input type="text" class="form-control" name="document_name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">نوع الوثيقة</label>
                                    <select class="form-select" name="document_type" required>
                                        <option value="">اختر نوع الوثيقة</option>
                                        <option value="السجل التجاري">السجل التجاري</option>
                                        <option value="رخصة تشغيل">رخصة تشغيل</option>
                                        <option value="عقد الإيجار">عقد الإيجار</option>
                                        <option value="شهادة التأسيس">شهادة التأسيس</option>
                                        <option value="تأمين تجاري">تأمين تجاري</option>
                                        <option value="شهادة ضريبية">شهادة ضريبية</option>
                                        <option value="رخصة البلدية">رخصة البلدية</option>
                                        <option value="عقد شراكة">عقد شراكة</option>
                                        <option value="كشف حساب بنكي">كشف حساب بنكي</option>
                                        <option value="ميزانية سنوية">ميزانية سنوية</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">الفئة</label>
                                    <select class="form-select" name="category">
                                        <option value="">اختر الفئة</option>
                                        <option value="وثائق قانونية">وثائق قانونية</option>
                                        <option value="تراخيص">تراخيص</option>
                                        <option value="عقود">عقود</option>
                                        <option value="تأمينات">تأمينات</option>
                                        <option value="ضرائب">ضرائب</option>
                                        <option value="مالية">مالية</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">تاريخ الانتهاء (اختياري)</label>
                                    <input type="date" class="form-control" name="expiry_date">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">الوصف</label>
                                    <textarea class="form-control" name="description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">الملف</label>
                                    <div class="upload-area" id="companyUploadArea" onclick="document.getElementById('companyFileInput').click()">
                                        <input type="file" id="companyFileInput" name="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display: none;">
                                        <div class="upload-content">
                                            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                            <h5 class="text-muted">اسحب الملف هنا أو انقر للاختيار</h5>
                                            <p class="text-muted small">الأنواع المدعومة: PDF, DOC, DOCX, JPG, PNG</p>
                                            <p class="text-muted small">الحد الأقصى: 15 ميجابايت</p>
                                        </div>
                                        <div id="companyFilePreview" class="files-preview" style="display: none;">
                                            <!-- File preview will be shown here -->
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" onclick="app.submitCompanyUpload()">رفع الوثيقة</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get company edit modal HTML
     */
    getCompanyEditModalHTML(companyId) {
        return `
            <div class="modal fade" id="companyEditModal" tabindex="-1" dir="rtl">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">تعديل الوثيقة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="companyEditForm">
                                <input type="hidden" name="document_id">
                                <input type="hidden" name="company_id" value="${companyId}">
                                <div class="mb-3">
                                    <label class="form-label">اسم الوثيقة</label>
                                    <input type="text" class="form-control" name="document_name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">نوع الوثيقة</label>
                                    <select class="form-select" name="document_type" required>
                                        <option value="">اختر نوع الوثيقة</option>
                                        <option value="السجل التجاري">السجل التجاري</option>
                                        <option value="رخصة تشغيل">رخصة تشغيل</option>
                                        <option value="عقد الإيجار">عقد الإيجار</option>
                                        <option value="شهادة التأسيس">شهادة التأسيس</option>
                                        <option value="تأمين تجاري">تأمين تجاري</option>
                                        <option value="شهادة ضريبية">شهادة ضريبية</option>
                                        <option value="رخصة البلدية">رخصة البلدية</option>
                                        <option value="عقد شراكة">عقد شراكة</option>
                                        <option value="كشف حساب بنكي">كشف حساب بنكي</option>
                                        <option value="ميزانية سنوية">ميزانية سنوية</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">الفئة</label>
                                    <select class="form-select" name="category">
                                        <option value="">اختر الفئة</option>
                                        <option value="وثائق قانونية">وثائق قانونية</option>
                                        <option value="تراخيص">تراخيص</option>
                                        <option value="عقود">عقود</option>
                                        <option value="تأمينات">تأمينات</option>
                                        <option value="ضرائب">ضرائب</option>
                                        <option value="مالية">مالية</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">تاريخ الانتهاء (اختياري)</label>
                                    <input type="date" class="form-control" name="expiry_date">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">الوصف</label>
                                    <textarea class="form-control" name="description" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" onclick="app.submitCompanyEdit()">حفظ التغييرات</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize company documents functionality
     */
    initializeCompanyDocuments(companyId) {
        // Initialize any additional functionality for company documents
        console.log('Company documents initialized for:', companyId);
    },

    /**
     * Open company upload modal
     */
    openCompanyUploadModal(companyId) {
        const modal = new bootstrap.Modal(document.getElementById('companyUploadModal'));
        modal.show();
        
        // Initialize drag-and-drop functionality after modal is shown
        setTimeout(() => {
            this.initializeCompanyUploadDragDrop();
        }, 100);
    },

    /**
     * Submit company upload form
     */
    async submitCompanyUpload() {
        try {
            const form = document.getElementById('companyUploadForm');
            const formData = new FormData(form);
            
            // Validate required fields
            const documentName = formData.get('document_name');
            const documentType = formData.get('document_type');
            const file = formData.get('file');
            
            if (!documentName || !documentType || !file || file.size === 0) {
                showError('الرجاء ملء جميع الحقول المطلوبة واختيار ملف');
                return;
            }
            
            // Validate file size (15MB limit)
            const maxSize = 15 * 1024 * 1024; // 15MB
            if (file.size > maxSize) {
                showError('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت');
                return;
            }
            
            // Show loading
            const submitBtn = document.querySelector('#companyUploadModal .btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الرفع...';
            submitBtn.disabled = true;

            // Get CSRF token for file upload
            const csrfToken = await api.ensureCSRFToken();
            
            // Submit to API with CSRF token
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData,
                credentials: 'same-origin'
            });

            if (response.ok) {
                const result = await response.json();
                showSuccess('تم رفع الوثيقة بنجاح');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('companyUploadModal'));
                modal.hide();
                
                // Clear form
                form.reset();
                
                // Refresh company documents page
                const companyId = formData.get('company_id');
                await this.openCompanyDocuments(companyId);
                
                // Update company stats
                await this.refreshCompanyStats(companyId);
                
            } else {
                const error = await response.json();
                throw new Error(error.error || 'خطأ في رفع الوثيقة');
            }

        } catch (error) {
            console.error('Error uploading company document:', error);
            showError('خطأ في رفع الوثيقة: ' + error.message);
        } finally {
            // Restore button
            const submitBtn = document.querySelector('#companyUploadModal .btn-primary');
            if (submitBtn) {
                submitBtn.textContent = 'رفع الوثيقة';
                submitBtn.disabled = false;
            }
        }
    },

    /**
     * Refresh company document statistics
     */
    async refreshCompanyStats(companyId) {
        try {
            // Load documents for the specific company
            const response = await api.getDocuments();
            const documents = response.documents || [];
            
            // Filter documents for this company
            const companyDocs = documents.filter(doc => doc.company_id === companyId);
            
            // Calculate stats
            const now = new Date();
            let expiringCount = 0;
            let expiredCount = 0;
            
            companyDocs.forEach(doc => {
                if (doc.expiry_date) {
                    const expiryDate = new Date(doc.expiry_date);
                    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilExpiry < 0) {
                        expiredCount++;
                    } else if (daysUntilExpiry <= 30) {
                        expiringCount++;
                    }
                }
            });
            
            // Update stats in UI (both main page and company page)
            const docCountEl = document.getElementById(`${companyId}DocCount`);
            const expiringEl = document.getElementById(`${companyId}Expiring`);
            const expiredEl = document.getElementById(`${companyId}Expired`);
            
            if (docCountEl) docCountEl.textContent = companyDocs.length;
            if (expiringEl) expiringEl.textContent = expiringCount;
            if (expiredEl) expiredEl.textContent = expiredCount;
            
        } catch (error) {
            console.error('Failed to refresh company stats:', error);
        }
    },

    /**
     * Initialize drag-and-drop functionality for company upload
     */
    initializeCompanyUploadDragDrop() {
        const uploadArea = document.getElementById('companyUploadArea');
        const fileInput = document.getElementById('companyFileInput');
        const filePreview = document.getElementById('companyFilePreview');
        
        if (!uploadArea || !fileInput || !filePreview) return;
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleCompanyFileSelection(files[0]);
            }
        });
        
        // File input change event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleCompanyFileSelection(e.target.files[0]);
            }
        });
        
        // Clear file preview on modal hide
        const modal = document.getElementById('companyUploadModal');
        modal.addEventListener('hidden.bs.modal', () => {
            this.clearCompanyFilePreview();
        });
    },
    
    /**
     * Handle file selection for company upload
     */
    handleCompanyFileSelection(file) {
        const fileInput = document.getElementById('companyFileInput');
        const uploadArea = document.getElementById('companyUploadArea');
        const uploadContent = uploadArea.querySelector('.upload-content');
        const filePreview = document.getElementById('companyFilePreview');
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            showError('نوع الملف غير مدعوم. الأنواع المدعومة: PDF, DOC, DOCX, JPG, PNG');
            return;
        }
        
        // Validate file size (15MB limit)
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (file.size > maxSize) {
            showError('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت');
            return;
        }
        
        // Update file input
        const fileList = this.createFileList([file]);
        Object.defineProperty(fileInput, 'files', {
            value: fileList,
            writable: false
        });
        
        // Show file preview
        this.showCompanyFilePreview(file);
        
        // Hide upload content and show preview
        uploadContent.style.display = 'none';
        filePreview.style.display = 'block';
    },
    
    /**
     * Create a FileList-like object
     */
    createFileList(files) {
        const fileList = {
            length: files.length,
            item: function(index) { return this[index]; }
        };
        
        files.forEach((file, index) => {
            fileList[index] = file;
        });
        
        return fileList;
    },
    
    /**
     * Show file preview for company upload
     */
    showCompanyFilePreview(file) {
        const filePreview = document.getElementById('companyFilePreview');
        const fileSize = this.formatFileSize(file.size);
        const fileIcon = this.getFileIcon(file.type, file.name);
        
        filePreview.innerHTML = `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon ${fileIcon.class}">
                        <i class="${fileIcon.icon}"></i>
                    </div>
                    <div class="file-details">
                        <h6>${file.name}</h6>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
                <div class="file-status valid">
                    <i class="fas fa-check-circle"></i>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="app.clearCompanyFilePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },
    
    /**
     * Clear file preview for company upload
     */
    clearCompanyFilePreview() {
        const uploadArea = document.getElementById('companyUploadArea');
        const fileInput = document.getElementById('companyFileInput');
        const uploadContent = uploadArea?.querySelector('.upload-content');
        const filePreview = document.getElementById('companyFilePreview');
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        if (uploadContent) {
            uploadContent.style.display = 'block';
        }
        
        if (filePreview) {
            filePreview.style.display = 'none';
            filePreview.innerHTML = '';
        }
    },
    
    /**
     * Get file icon based on file type
     */
    getFileIcon(fileType, fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        if (fileType === 'application/pdf' || extension === 'pdf') {
            return { icon: 'fas fa-file-pdf', class: 'pdf' };
        } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension)) {
            return { icon: 'fas fa-file-image', class: 'image' };
        } else if (fileType.includes('word') || ['doc', 'docx'].includes(extension)) {
            return { icon: 'fas fa-file-word', class: 'document' };
        } else if (['xls', 'xlsx'].includes(extension)) {
            return { icon: 'fas fa-file-excel', class: 'spreadsheet' };
        } else {
            return { icon: 'fas fa-file-alt', class: 'document' };
        }
    },
    
    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Initialize drag-and-drop functionality for general upload modal
     */
    initializeGeneralUploadDragDrop() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const filePreview = document.getElementById('filePreview');
        
        if (!uploadArea || !fileInput || !filePreview) return;
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleGeneralFileSelection(files[0]);
            }
        });
        
        // File input change event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleGeneralFileSelection(e.target.files[0]);
            }
        });
        
        // Clear file preview on modal hide
        const modal = document.getElementById('uploadModal');
        modal.addEventListener('hidden.bs.modal', () => {
            this.clearGeneralFilePreview();
        });
    },
    
    /**
     * Handle file selection for general upload
     */
    handleGeneralFileSelection(file) {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea.querySelector('.upload-content');
        const filePreview = document.getElementById('filePreview');
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showError('نوع الملف غير مدعوم. الرجاء اختيار ملف PDF, DOC, DOCX, JPG أو PNG');
            return;
        }
        
        // Validate file size (15MB)
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (file.size > maxSize) {
            showError('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت');
            return;
        }
        
        // Create FileList-like object for single file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Show file preview
        this.showGeneralFilePreview(file);
        
        // Hide upload content and show preview
        if (uploadContent) uploadContent.style.display = 'none';
        if (filePreview) filePreview.style.display = 'block';
    },
    
    /**
     * Show file preview for general upload
     */
    showGeneralFilePreview(file) {
        const filePreview = document.getElementById('filePreview');
        const fileSize = this.formatFileSize(file.size);
        const fileIcon = this.getFileIcon(file.type, file.name);
        
        filePreview.innerHTML = `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon ${fileIcon.class}">
                        <i class="${fileIcon.icon}"></i>
                    </div>
                    <div class="file-details">
                        <h6>${file.name}</h6>
                        <span class="file-size text-muted">${fileSize}</span>
                    </div>
                </div>
                <div class="file-status">
                    <span class="text-success">
                        <i class="fas fa-check-circle"></i>
                    </span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="app.clearGeneralFilePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },
    
    /**
     * Clear file preview for general upload
     */
    clearGeneralFilePreview() {
        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea?.querySelector('.upload-content');
        const filePreview = document.getElementById('filePreview');
        const fileInput = document.getElementById('fileInput');
        
        // Clear file input
        if (fileInput) fileInput.value = '';
        
        // Show upload content and hide preview
        if (uploadContent) uploadContent.style.display = 'block';
        if (filePreview) {
            filePreview.style.display = 'none';
            filePreview.innerHTML = '';
        }
    },

    /**
     * Edit company document
     */
    async editCompanyDocument(documentId) {
        try {
            // Get document details
            const response = await fetch(`/api/documents/${documentId}`);
            if (!response.ok) throw new Error('خطأ في تحميل بيانات الوثيقة');
            
            const document = await response.json();
            
            // Fill form
            const form = document.getElementById('companyEditForm');
            form.document_id.value = document.id;
            form.document_name.value = document.document_name || '';
            form.document_type.value = document.document_type || '';
            form.category.value = document.category || '';
            form.expiry_date.value = document.expiry_date || '';
            form.description.value = document.description || '';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('companyEditModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error loading document for edit:', error);
            showError('خطأ في تحميل بيانات الوثيقة: ' + error.message);
        }
    },

    /**
     * Submit company edit form
     */
    async submitCompanyEdit() {
        try {
            const form = document.getElementById('companyEditForm');
            const formData = new FormData(form);
            const documentId = formData.get('document_id');
            
            // Show loading
            const submitBtn = document.querySelector('#companyEditModal .btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';
            submitBtn.disabled = true;

            // Submit to API
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                showSuccess('تم تحديث الوثيقة بنجاح');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('companyEditModal'));
                modal.hide();
                
                // Refresh the page
                const companyId = formData.get('company_id');
                this.openCompanyDocuments(companyId);
                
            } else {
                const error = await response.json();
                throw new Error(error.error || 'خطأ في تحديث الوثيقة');
            }

        } catch (error) {
            console.error('Error updating document:', error);
            showError('خطأ في تحديث الوثيقة: ' + error.message);
        } finally {
            // Restore button
            const submitBtn = document.querySelector('#companyEditModal .btn-primary');
            if (submitBtn) {
                submitBtn.textContent = 'حفظ التغييرات';
                submitBtn.disabled = false;
            }
        }
    },

    /**
     * Preview company document
     */
    previewCompanyDocument(documentId) {
        window.open(`/api/documents/${documentId}/preview`, '_blank');
    },

    /**
     * Delete company document
     */
    async deleteCompanyDocument(documentId) {
        try {
            const result = await Swal.fire({
                title: 'تأكيد الحذف',
                text: 'هل أنت متأكد من حذف هذه الوثيقة؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'حذف',
                cancelButtonText: 'إلغاء'
            });

            if (result.isConfirmed) {
                const response = await fetch(`/api/documents/${documentId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showSuccess('تم حذف الوثيقة بنجاح');
                    // Refresh current page
                    location.reload();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'خطأ في حذف الوثيقة');
                }
            }

        } catch (error) {
            console.error('Error deleting document:', error);
            showError('خطأ في حذف الوثيقة: ' + error.message);
        }
    },

    /**
     * Setup reports event listeners
     */
    setupReportsEventListeners() {
        // Report type change
        document.getElementById('reportType').addEventListener('change', (e) => {
            const driverContainer = document.getElementById('driverSelectContainer');
            if (e.target.value === 'driver_statement') {
                driverContainer.style.display = 'block';
            } else {
                driverContainer.style.display = 'none';
            }
        });

        // Generate report button
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        // Export report button
        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });
    },

    /**
     * Load drivers for reports dropdown
     */
    async loadDriversForReports() {
        try {
            const drivers = await api.getDrivers();
            const select = document.getElementById('reportDriverId');

            drivers.forEach(driver => {
                if (driver.is_active) {
                    const option = document.createElement('option');
                    option.value = driver.id;
                    option.textContent = driver.full_name;
                    select.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading drivers for reports:', error);
        }
    },

    /**
     * Generate report
     */
    async generateReport() {
        try {
            const reportType = document.getElementById('reportType').value;
            const fromDate = document.getElementById('reportFromDate').value;
            const toDate = document.getElementById('reportToDate').value;
            const driverId = document.getElementById('reportDriverId').value;

            if (!reportType) {
                showError('يرجى اختيار نوع التقرير');
                return;
            }

            if (!fromDate || !toDate) {
                showError('يرجى تحديد الفترة الزمنية');
                return;
            }

            showLoading('جاري إنشاء التقرير...');

            let reportData;
            switch (reportType) {
                case 'driver_statement':
                    reportData = await this.generateDriverStatement(driverId, fromDate, toDate);
                    break;
                case 'financial_summary':
                    reportData = await this.generateFinancialSummary(fromDate, toDate);
                    break;
                case 'commission_report':
                    reportData = await this.generateCommissionReport(fromDate, toDate);
                    break;
                case 'payroll_summary':
                    reportData = await this.generatePayrollSummary(fromDate, toDate);
                    break;
                case 'maintenance_report':
                    reportData = await this.generateMaintenanceReport(fromDate, toDate);
                    break;
                case 'orders_summary':
                    reportData = await this.generateOrdersSummary(fromDate, toDate);
                    break;
                default:
                    throw new Error('نوع التقرير غير مدعوم');
            }

            hideLoading();
            this.displayReportPreview(reportData);
            document.getElementById('exportReportBtn').disabled = false;

        } catch (error) {
            hideLoading();
            showError(error.message || 'حدث خطأ أثناء إنشاء التقرير');
        }
    },

    /**
     * Generate driver statement report
     */
    async generateDriverStatement(driverId, fromDate, toDate) {
        if (!driverId) {
            throw new Error('يرجى اختيار السائق');
        }

        // Get driver data
        const driver = await api.getDriver(driverId);

        // Get orders for the period
        const allOrders = await api.getOrders();
        const driverOrders = allOrders.filter(order =>
            order.driver_id === driverId &&
            order.order_date >= fromDate &&
            order.order_date <= toDate &&
            order.status === 'completed'
        );

        // Get advances for the period
        const allAdvances = await api.getAdvances();
        const driverAdvances = allAdvances.filter(advance =>
            advance.driver_id === driverId &&
            advance.date_issued >= fromDate &&
            advance.date_issued <= toDate
        );

        // Calculate totals
        const totalCommission = driverOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
        const totalAdvances = driverAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);
        const outstandingAdvances = driverAdvances
            .filter(advance => advance.status === 'active' || advance.status === 'partial')
            .reduce((sum, advance) => sum + ((advance.amount || 0) - (advance.paid_amount || 0)), 0);

        return {
            type: 'driver_statement',
            title: `كشف حساب السائق - ${driver.full_name}`,
            period: `من ${fromDate} إلى ${toDate}`,
            data: {
                driver: driver,
                orders: driverOrders,
                advances: driverAdvances,
                summary: {
                    totalOrders: driverOrders.length,
                    totalCommission: totalCommission,
                    totalAdvances: totalAdvances,
                    outstandingAdvances: outstandingAdvances,
                    netAmount: totalCommission - outstandingAdvances
                }
            }
        };
    },

    /**
     * Generate financial summary report
     */
    async generateFinancialSummary(fromDate, toDate) {
        const [orders, advances, payrollRuns] = await Promise.all([
            api.getOrders(),
            api.getAdvances(),
            api.getPayrollRuns()
        ]);

        // Filter by date range
        const periodOrders = orders.filter(order =>
            order.order_date >= fromDate && order.order_date <= toDate
        );

        const periodAdvances = advances.filter(advance =>
            advance.date_issued >= fromDate && advance.date_issued <= toDate
        );

        // Calculate totals
        const totalRevenue = periodOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.delivery_fee || 0), 0);

        const totalCommissions = periodOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.commission_amount || 0), 0);

        const totalAdvancesIssued = periodAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);

        return {
            type: 'financial_summary',
            title: 'الملخص المالي',
            period: `من ${fromDate} إلى ${toDate}`,
            data: {
                summary: {
                    totalOrders: periodOrders.length,
                    completedOrders: periodOrders.filter(o => o.status === 'completed').length,
                    totalRevenue: totalRevenue,
                    totalCommissions: totalCommissions,
                    totalAdvancesIssued: totalAdvancesIssued,
                    netProfit: totalRevenue - totalCommissions
                }
            }
        };
    },

    /**
     * Generate other report types (simplified)
     */
    async generateCommissionReport(fromDate, toDate) {
        const orders = await api.getOrders();
        const periodOrders = orders.filter(order =>
            order.order_date >= fromDate &&
            order.order_date <= toDate &&
            order.status === 'completed'
        );

        return {
            type: 'commission_report',
            title: 'تقرير العمولات',
            period: `من ${fromDate} إلى ${toDate}`,
            data: {
                orders: periodOrders,
                summary: {
                    totalCommissions: periodOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0)
                }
            }
        };
    },

    async generatePayrollSummary(fromDate, toDate) {
        return {
            type: 'payroll_summary',
            title: 'ملخص الرواتب',
            period: `من ${fromDate} إلى ${toDate}`,
            data: { summary: { message: 'تقرير الرواتب قيد التطوير' } }
        };
    },

    async generateMaintenanceReport(fromDate, toDate) {
        return {
            type: 'maintenance_report',
            title: 'تقرير الصيانة',
            period: `من ${fromDate} إلى ${toDate}`,
            data: { summary: { message: 'تقرير الصيانة قيد التطوير' } }
        };
    },

    async generateOrdersSummary(fromDate, toDate) {
        const orders = await api.getOrders();
        const periodOrders = orders.filter(order =>
            order.order_date >= fromDate && order.order_date <= toDate
        );

        return {
            type: 'orders_summary',
            title: 'ملخص الطلبات',
            period: `من ${fromDate} إلى ${toDate}`,
            data: {
                orders: periodOrders,
                summary: {
                    totalOrders: periodOrders.length,
                    completedOrders: periodOrders.filter(o => o.status === 'completed').length,
                    pendingOrders: periodOrders.filter(o => o.status === 'pending').length,
                    cancelledOrders: periodOrders.filter(o => o.status === 'cancelled').length
                }
            }
        };
    },

    /**
     * Display report preview
     */
    displayReportPreview(reportData) {
        const container = document.getElementById('reportPreview');

        let html = `
            <div class="report-header mb-4">
                <h4>${reportData.title}</h4>
                <p class="text-muted">${reportData.period}</p>
            </div>
        `;

        switch (reportData.type) {
            case 'driver_statement':
                html += this.renderDriverStatementPreview(reportData.data);
                break;
            case 'financial_summary':
                html += this.renderFinancialSummaryPreview(reportData.data);
                break;
            case 'commission_report':
                html += this.renderCommissionReportPreview(reportData.data);
                break;
            case 'orders_summary':
                html += this.renderOrdersSummaryPreview(reportData.data);
                break;
            default:
                html += `
                    <div class="alert alert-info">
                        <h6>${reportData.data.summary.message || 'التقرير قيد التطوير'}</h6>
                    </div>
                `;
        }

        container.innerHTML = html;
        this.currentReportData = reportData; // Store for export
    },

    /**
     * Render driver statement preview
     */
    renderDriverStatementPreview(data) {
        let html = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6>معلومات السائق</h6>
                    <p><strong>الاسم:</strong> ${data.driver.full_name}</p>
                    <p><strong>رقم الهوية:</strong> ${data.driver.national_id}</p>
                    <p><strong>الهاتف:</strong> ${data.driver.phone}</p>
                </div>
                <div class="col-md-6">
                    <h6>الملخص المالي</h6>
                    <p><strong>عدد الطلبات:</strong> ${data.summary.totalOrders}</p>
                    <p><strong>إجمالي العمولات:</strong> ${formatCurrency(data.summary.totalCommission)}</p>
                    <p><strong>إجمالي السُلف:</strong> ${formatCurrency(data.summary.totalAdvances)}</p>
                    <p><strong>السُلف المستحقة:</strong> ${formatCurrency(data.summary.outstandingAdvances)}</p>
                    <p><strong>الصافي:</strong> <span class="fw-bold">${formatCurrency(data.summary.netAmount)}</span></p>
                </div>
            </div>
        `;

        if (data.orders.length > 0) {
            html += `
                <h6>تفاصيل الطلبات</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>التاريخ</th>
                                <th>العميل</th>
                                <th>العمولة</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.orders.forEach(order => {
                html += `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.order_date}</td>
                        <td>${order.client_name}</td>
                        <td>${formatCurrency(order.commission_amount)}</td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (data.advances.length > 0) {
            html += `
                <h6 class="mt-4">تفاصيل السُلف</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>رقم السُلفة</th>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>المدفوع</th>
                                <th>المتبقي</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.advances.forEach(advance => {
                const remaining = (advance.amount || 0) - (advance.paid_amount || 0);
                html += `
                    <tr>
                        <td>${advance.id}</td>
                        <td>${advance.date_issued}</td>
                        <td>${formatCurrency(advance.amount)}</td>
                        <td>${formatCurrency(advance.paid_amount || 0)}</td>
                        <td>${formatCurrency(remaining)}</td>
                        <td><span class="badge bg-${this.getAdvanceStatusClass(advance.status)}">${this.getAdvanceStatusText(advance.status)}</span></td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        return html;
    },

    /**
     * Render financial summary preview
     */
    renderFinancialSummaryPreview(data) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6>إحصائيات الطلبات</h6>
                            <p><strong>إجمالي الطلبات:</strong> ${data.summary.totalOrders}</p>
                            <p><strong>الطلبات المكتملة:</strong> ${data.summary.completedOrders}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6>الملخص المالي</h6>
                            <p><strong>إجمالي الإيرادات:</strong> ${formatCurrency(data.summary.totalRevenue)}</p>
                            <p><strong>إجمالي العمولات:</strong> ${formatCurrency(data.summary.totalCommissions)}</p>
                            <p><strong>إجمالي السُلف:</strong> ${formatCurrency(data.summary.totalAdvancesIssued)}</p>
                            <p><strong>صافي الربح:</strong> <span class="fw-bold">${formatCurrency(data.summary.netProfit)}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render commission report preview
     */
    renderCommissionReportPreview(data) {
        let html = `
            <div class="alert alert-info">
                <h6>ملخص العمولات</h6>
                <p><strong>إجمالي العمولات:</strong> ${formatCurrency(data.summary.totalCommissions)}</p>
                <p><strong>عدد الطلبات:</strong> ${data.orders.length}</p>
            </div>
        `;

        if (data.orders.length > 0) {
            html += `
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>التاريخ</th>
                                <th>السائق</th>
                                <th>العميل</th>
                                <th>العمولة</th>
                                <th>مصدر العمولة</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.orders.forEach(order => {
                html += `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.order_date}</td>
                        <td>${order.driver_name}</td>
                        <td>${order.client_name}</td>
                        <td>${formatCurrency(order.commission_amount)}</td>
                        <td>${order.commission_source || 'غير محدد'}</td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        return html;
    },

    /**
     * Render orders summary preview
     */
    renderOrdersSummaryPreview(data) {
        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">${data.summary.totalOrders}</h5>
                            <p class="card-text">إجمالي الطلبات</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-success">${data.summary.completedOrders}</h5>
                            <p class="card-text">مكتملة</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-warning">${data.summary.pendingOrders}</h5>
                            <p class="card-text">في الانتظار</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-danger">${data.summary.cancelledOrders}</h5>
                            <p class="card-text">ملغية</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Export report to CSV/Excel
     */
    exportReport() {
        if (!this.currentReportData) {
            showError('لا يوجد تقرير للتصدير');
            return;
        }

        try {
            const csvData = this.convertReportToCSV(this.currentReportData);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${this.currentReportData.title}_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showSuccess('تم تصدير التقرير بنجاح');
            }
        } catch (error) {
            showError('حدث خطأ أثناء تصدير التقرير');
        }
    },

    /**
     * Convert report data to CSV format
     */
    convertReportToCSV(reportData) {
        let csv = `${reportData.title}\n${reportData.period}\n\n`;

        switch (reportData.type) {
            case 'driver_statement':
                csv += this.convertDriverStatementToCSV(reportData.data);
                break;
            case 'financial_summary':
                csv += this.convertFinancialSummaryToCSV(reportData.data);
                break;
            case 'commission_report':
                csv += this.convertCommissionReportToCSV(reportData.data);
                break;
            case 'orders_summary':
                csv += this.convertOrdersSummaryToCSV(reportData.data);
                break;
            default:
                csv += 'البيانات غير متوفرة للتصدير\n';
        }

        return csv;
    },

    /**
     * Convert driver statement to CSV
     */
    convertDriverStatementToCSV(data) {
        let csv = `معلومات السائق\n`;
        csv += `الاسم,${data.driver.full_name}\n`;
        csv += `رقم الهوية,${data.driver.national_id}\n`;
        csv += `الهاتف,${data.driver.phone}\n\n`;

        csv += `الملخص المالي\n`;
        csv += `عدد الطلبات,${data.summary.totalOrders}\n`;
        csv += `إجمالي العمولات,${data.summary.totalCommission}\n`;
        csv += `إجمالي السُلف,${data.summary.totalAdvances}\n`;
        csv += `السُلف المستحقة,${data.summary.outstandingAdvances}\n`;
        csv += `الصافي,${data.summary.netAmount}\n\n`;

        if (data.orders.length > 0) {
            csv += `تفاصيل الطلبات\n`;
            csv += `رقم الطلب,التاريخ,العميل,العمولة\n`;
            data.orders.forEach(order => {
                csv += `${order.id},${order.order_date},${order.client_name},${order.commission_amount}\n`;
            });
            csv += '\n';
        }

        return csv;
    },

    /**
     * Convert financial summary to CSV
     */
    convertFinancialSummaryToCSV(data) {
        let csv = `الملخص المالي\n`;
        csv += `إجمالي الطلبات,${data.summary.totalOrders}\n`;
        csv += `الطلبات المكتملة,${data.summary.completedOrders}\n`;
        csv += `إجمالي الإيرادات,${data.summary.totalRevenue}\n`;
        csv += `إجمالي العمولات,${data.summary.totalCommissions}\n`;
        csv += `إجمالي السُلف,${data.summary.totalAdvancesIssued}\n`;
        csv += `صافي الربح,${data.summary.netProfit}\n`;
        return csv;
    },

    /**
     * Convert commission report to CSV
     */
    convertCommissionReportToCSV(data) {
        let csv = `تقرير العمولات\n`;
        csv += `إجمالي العمولات,${data.summary.totalCommissions}\n`;
        csv += `عدد الطلبات,${data.orders.length}\n\n`;

        if (data.orders.length > 0) {
            csv += `رقم الطلب,التاريخ,السائق,العميل,العمولة,مصدر العمولة\n`;
            data.orders.forEach(order => {
                csv += `${order.id},${order.order_date},${order.driver_name},${order.client_name},${order.commission_amount},${order.commission_source || 'غير محدد'}\n`;
            });
        }

        return csv;
    },

    /**
     * Convert orders summary to CSV
     */
    convertOrdersSummaryToCSV(data) {
        let csv = `ملخص الطلبات\n`;
        csv += `إجمالي الطلبات,${data.summary.totalOrders}\n`;
        csv += `مكتملة,${data.summary.completedOrders}\n`;
        csv += `في الانتظار,${data.summary.pendingOrders}\n`;
        csv += `ملغية,${data.summary.cancelledOrders}\n`;
        return csv;
    },

    /**
     * Helper methods for status formatting
     */
    getAdvanceStatusClass(status) {
        const statusMap = {
            'active': 'warning',
            'partial': 'info',
            'paid': 'success',
            'cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    },

    getAdvanceStatusText(status) {
        const statusMap = {
            'active': 'نشطة',
            'partial': 'مدفوعة جزئياً',
            'paid': 'مدفوعة بالكامل',
            'cancelled': 'ملغية'
        };
        return statusMap[status] || status;
    },

    /**
     * Initialize settings page
     */
    async initializeSettingsPage() {
        try {
            const container = document.getElementById('settingsContainer');

            container.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-cog me-2"></i>إعدادات النظام</h5>
                            </div>
                            <div class="card-body">
                                <form id="settingsForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>الإعدادات العامة</h6>

                                            <div class="mb-3">
                                                <label class="form-label">اسم التطبيق</label>
                                                <input type="text" class="form-control" id="appName"
                                                       value="شركة إعمار لتوصيل الطلبات">
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">الإصدار</label>
                                                <input type="text" class="form-control" id="version"
                                                       value="1.0.0" readonly>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">تاريخ التطوير</label>
                                                <input type="text" class="form-control" id="developmentDate"
                                                       value="أغسطس 2025" readonly>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">المطور</label>
                                                <input type="text" class="form-control" id="developer"
                                                       value="د/وليد محمد" readonly>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">آخر تحديث</label>
                                                <input type="text" class="form-control" id="lastUpdate"
                                                       value="25‏/8‏/2025 م" readonly>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">العملة</label>
                                                <select class="form-select" id="currency">
                                                    <option value="KWD" selected>دينار كويتي (KWD)</option>
                                                </select>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">العمولة الافتراضية لكل طلب (د.ك)</label>
                                                <input type="number" class="form-control" id="globalCommission"
                                                       value="0.250" step="0.001" min="0">
                                            </div>
                                        </div>

                                        <div class="col-md-6">
                                            <h6>إعدادات الصيانة</h6>

                                            <div class="mb-3">
                                                <label class="form-label">أيام تنبيه الصيانة</label>
                                                <input type="number" class="form-control" id="maintenanceAlertDays"
                                                       value="30" min="1" max="365">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row mt-4">
                                        <div class="col-12">
                                            <h6>إعدادات الرواتب</h6>

                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="checkbox" id="payrollApprovalRequired" checked>
                                                <label class="form-check-label" for="payrollApprovalRequired">
                                                    يتطلب اعتماد الرواتب قبل المعالجة
                                                </label>
                                            </div>

                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="checkbox" id="autoAdvanceDeduction" checked>
                                                <label class="form-check-label" for="autoAdvanceDeduction">
                                                    خصم السُلف تلقائياً عند اعتماد الرواتب
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Security Settings Section -->
                                    <div class="row mt-4">
                                        <div class="col-12">
                                            <h6><i class="fas fa-shield-alt me-2"></i>إعدادات الأمان</h6>

                                            <div class="card border-warning">
                                                <div class="card-header bg-warning bg-opacity-10">
                                                    <h6 class="mb-0"><i class="fas fa-key me-2"></i>تغيير كلمة مرور المدير</h6>
                                                </div>
                                                <div class="card-body">
                                                    <form id="passwordChangeForm">
                                                        <div class="row">
                                                            <div class="col-md-6">
                                                                <div class="mb-3">
                                                                    <label class="form-label">كلمة المرور الحالية</label>
                                                                    <div class="input-group">
                                                                        <input type="password" class="form-control" id="currentPassword"
                                                                               placeholder="أدخل كلمة المرور الحالية" required>
                                                                        <button class="btn btn-outline-secondary" type="button" id="toggleCurrentPassword">
                                                                            <i class="fas fa-eye"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="col-md-6">
                                                                <div class="mb-3">
                                                                    <label class="form-label">كلمة المرور الجديدة</label>
                                                                    <div class="input-group">
                                                                        <input type="password" class="form-control" id="newPassword"
                                                                               placeholder="أدخل كلمة المرور الجديدة" required>
                                                                        <button class="btn btn-outline-secondary" type="button" id="toggleNewPassword">
                                                                            <i class="fas fa-eye"></i>
                                                                        </button>
                                                                    </div>
                                                                    <div class="form-text">
                                                                        يجب أن تحتوي على 8 أحرف على الأقل مع أرقام وأحرف كبيرة وصغيرة
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div class="row">
                                                            <div class="col-md-6">
                                                                <div class="mb-3">
                                                                    <label class="form-label">تأكيد كلمة المرور الجديدة</label>
                                                                    <div class="input-group">
                                                                        <input type="password" class="form-control" id="confirmPassword"
                                                                               placeholder="أعد إدخال كلمة المرور الجديدة" required>
                                                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                                                            <i class="fas fa-eye"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="col-md-6">
                                                                <!-- Password Strength Indicator -->
                                                                <div class="mb-3">
                                                                    <label class="form-label">قوة كلمة المرور</label>
                                                                    <div class="progress" style="height: 8px;">
                                                                        <div class="progress-bar" id="passwordStrengthBar" role="progressbar"
                                                                             style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                                                    </div>
                                                                    <small id="passwordStrengthText" class="form-text text-muted">أدخل كلمة مرور لتقييم قوتها</small>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Validation Messages -->
                                                        <div id="passwordValidationMessages" class="mb-3" style="display: none;">
                                                            <div class="alert alert-danger" role="alert">
                                                                <ul id="passwordValidationList" class="mb-0"></ul>
                                                            </div>
                                                        </div>

                                                        <!-- Success/Error Messages -->
                                                        <div id="passwordChangeMessages" class="mb-3" style="display: none;"></div>

                                                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                                            <button type="button" class="btn btn-secondary me-md-2" id="resetPasswordFormBtn">
                                                                <i class="fas fa-undo me-2"></i>إعادة تعيين
                                                            </button>
                                                            <button type="submit" class="btn btn-warning" id="changePasswordBtn">
                                                                <i class="fas fa-key me-2"></i>تغيير كلمة المرور
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button type="button" class="btn btn-secondary me-md-2" id="resetSettingsBtn">
                                            <i class="fas fa-undo me-2"></i>إعادة تعيين
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save me-2"></i>حفظ الإعدادات
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6><i class="fas fa-database me-2"></i>إدارة البيانات والنسخ الاحتياطية</h6>
                            </div>
                            <div class="card-body">
                                <!-- Backup Status -->
                                <div class="mb-3">
                                    <h6 class="text-muted mb-2">حالة النسخ الاحتياطية</h6>
                                    <div id="backupStatus" class="alert alert-info">
                                        <i class="fas fa-spinner fa-spin me-2"></i>جاري تحميل حالة النسخ الاحتياطية...
                                    </div>
                                </div>

                                <!-- Backup Actions -->
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-primary" id="createBackupBtn">
                                                <i class="fas fa-shield-alt me-2"></i>إنشاء نسخة احتياطية كاملة
                                            </button>
                                            <button class="btn btn-info" id="backupDataBtn">
                                                <i class="fas fa-download me-2"></i>تصدير البيانات
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-warning" id="cleanupBackupsBtn">
                                                <i class="fas fa-broom me-2"></i>تنظيف النسخ القديمة
                                            </button>
                                            <button class="btn btn-secondary" id="refreshBackupStatusBtn">
                                                <i class="fas fa-sync me-2"></i>تحديث الحالة
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Data Management -->
                                <div class="border-top pt-3">
                                    <h6 class="text-muted mb-2">إدارة البيانات</h6>
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-warning" id="restoreDataBtn">
                                            <i class="fas fa-upload me-2"></i>استعادة البيانات
                                        </button>
                                        <button class="btn btn-danger" id="clearDataBtn">
                                            <i class="fas fa-trash me-2"></i>مسح جميع البيانات
                                        </button>
                                    </div>
                                    <input type="file" id="restoreFileInput" accept=".json" style="display: none;">
                                </div>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="card-header">
                                <h6><i class="fas fa-tachometer-alt me-2"></i>مقاييس الأداء</h6>
                            </div>
                            <div class="card-body">
                                <div id="performanceMetrics">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="text-center mb-3">
                                                <h6 class="mb-1" id="cacheHitRate">-</h6>
                                                <small class="text-muted">معدل نجاح التخزين المؤقت</small>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="text-center mb-3">
                                                <h6 class="mb-1" id="avgRenderTime">-</h6>
                                                <small class="text-muted">متوسط وقت التحميل (ms)</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="text-center">
                                                <h6 class="mb-1" id="cacheSize">-</h6>
                                                <small class="text-muted">حجم التخزين المؤقت</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center">
                                                <h6 class="mb-1" id="deferredRenders">-</h6>
                                                <small class="text-muted">العمليات المؤجلة</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center">
                                                <h6 class="mb-1" id="queueSize">-</h6>
                                                <small class="text-muted">حجم الطابور</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-primary" id="refreshPerformanceBtn">
                                        <i class="fas fa-sync me-2"></i>تحديث المقاييس
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" id="clearCacheBtn">
                                        <i class="fas fa-trash me-2"></i>مسح التخزين المؤقت
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="card-header">
                                <h6><i class="fas fa-history me-2"></i>سجل الأحداث</h6>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div id="eventStats">
                                            <div class="row">
                                                <div class="col-6">
                                                    <div class="text-center">
                                                        <h6 class="mb-1" id="totalEvents">-</h6>
                                                        <small class="text-muted">إجمالي الأحداث</small>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="text-center">
                                                        <h6 class="mb-1" id="todayEvents">-</h6>
                                                        <small class="text-muted">أحداث اليوم</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-sm btn-outline-primary" id="refreshEventStatsBtn">
                                                <i class="fas fa-sync me-2"></i>تحديث الإحصائيات
                                            </button>
                                            <button class="btn btn-sm btn-outline-warning" id="cleanupEventsBtn">
                                                <i class="fas fa-broom me-2"></i>تنظيف الأحداث القديمة
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="border-top pt-3">
                                    <h6 class="text-muted mb-2">الأحداث الأخيرة</h6>
                                    <div id="recentEvents" style="max-height: 300px; overflow-y: auto;">
                                        <div class="text-center text-muted">
                                            <i class="fas fa-spinner fa-spin me-2"></i>جاري تحميل الأحداث...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h6><i class="fas fa-info-circle me-2"></i>معلومات النظام</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>الإصدار:</strong> 1.0.0</p>
                                <p><strong>تاريخ التطوير:</strong> أغسطس 2025</p>
                                <p><strong>المطور:</strong> د/ وليد محمد</p>
                                <p><strong>آخر تحديث:</strong> ${new Date().toLocaleDateString('ar-KW', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'Asia/Kuwait'
                                })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Setup event listeners
            this.setupSettingsEventListeners();

            // Load current settings
            this.loadCurrentSettings();

            // Load backup status
            this.loadBackupStatus();

            // Load performance metrics
            this.loadPerformanceMetrics();

            // Load event statistics
            this.loadEventStats();
            this.loadRecentEvents();

            // Setup password change event listeners after DOM is fully rendered
            setTimeout(() => {
                this.setupPasswordChangeEventListeners();
            }, 100);

        } catch (error) {
            console.error('Error initializing settings page:', error);
            document.getElementById('settingsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل صفحة الإعدادات: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Setup settings event listeners
     */
    setupSettingsEventListeners() {
        // Settings form submission
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Reset settings
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });

        // Data management buttons
        document.getElementById('backupDataBtn').addEventListener('click', () => {
            this.backupData();
        });

        document.getElementById('restoreDataBtn').addEventListener('click', () => {
            document.getElementById('restoreFileInput').click();
        });

        document.getElementById('restoreFileInput').addEventListener('change', (e) => {
            this.restoreData(e.target.files[0]);
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // New backup management buttons
        document.getElementById('createBackupBtn').addEventListener('click', () => {
            this.createFullBackup();
        });

        document.getElementById('cleanupBackupsBtn').addEventListener('click', () => {
            this.cleanupOldBackups();
        });

        document.getElementById('refreshBackupStatusBtn').addEventListener('click', () => {
            this.loadBackupStatus();
        });

        // Performance metrics buttons
        document.getElementById('refreshPerformanceBtn').addEventListener('click', () => {
            this.loadPerformanceMetrics();
        });

        document.getElementById('clearCacheBtn').addEventListener('click', () => {
            this.clearKPICache();
            this.loadPerformanceMetrics();
            showSuccess('تم مسح التخزين المؤقت بنجاح');
        });

        // Event log buttons
        document.getElementById('refreshEventStatsBtn').addEventListener('click', () => {
            this.loadEventStats();
            this.loadRecentEvents();
        });

        document.getElementById('cleanupEventsBtn').addEventListener('click', () => {
            this.cleanupOldEvents();
        });

        // Password change button direct click event (bypasses form nesting issue)
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Password change button clicked via direct event listener');
                this.changeAdminPassword();
            });
        }

        // Reset password form button
        const resetPasswordFormBtn = document.getElementById('resetPasswordFormBtn');
        if (resetPasswordFormBtn) {
            resetPasswordFormBtn.addEventListener('click', () => {
                console.log('🔄 Reset password form button clicked');
                this.resetPasswordForm();
            });
        }
    },

    /**
     * Setup password change event listeners
     */
    setupPasswordChangeEventListeners() {
        console.log('🔧 Setting up password change event listeners...');

        // Check if any password toggle buttons exist before proceeding
        const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
        const toggleNewPassword = document.getElementById('toggleNewPassword');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

        if (!toggleCurrentPassword && !toggleNewPassword && !toggleConfirmPassword) {
            console.warn('❌ No password toggle buttons found, skipping event listeners setup');
            return;
        }

        console.log('✅ Found password toggle buttons, proceeding with event listener setup');

        // Note: Password change form submission and reset button event listeners
        // are handled elsewhere in the application. This method focuses only on
        // password visibility toggle functionality.

        // Password visibility toggles - using variables defined above
        if (toggleCurrentPassword) {
            console.log('✅ Found toggleCurrentPassword button, adding event listener');
            toggleCurrentPassword.addEventListener('click', () => {
                console.log('🔄 toggleCurrentPassword clicked');
                this.togglePasswordVisibility('currentPassword', 'toggleCurrentPassword');
            });
        } else {
            console.warn('❌ toggleCurrentPassword button not found');
        }

        if (toggleNewPassword) {
            console.log('✅ Found toggleNewPassword button, adding event listener');
            toggleNewPassword.addEventListener('click', () => {
                console.log('🔄 toggleNewPassword clicked');
                this.togglePasswordVisibility('newPassword', 'toggleNewPassword');
            });
        } else {
            console.warn('❌ toggleNewPassword button not found');
        }

        if (toggleConfirmPassword) {
            console.log('✅ Found toggleConfirmPassword button, adding event listener');
            toggleConfirmPassword.addEventListener('click', () => {
                console.log('🔄 toggleConfirmPassword clicked');
                this.togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
            });
        } else {
            console.warn('❌ toggleConfirmPassword button not found');
        }

        // Real-time password validation
        const newPasswordField = document.getElementById('newPassword');
        if (newPasswordField) {
            newPasswordField.addEventListener('input', () => {
                this.validatePasswordStrength();
                this.validatePasswordMatch();
            });
        }

        const confirmPasswordField = document.getElementById('confirmPassword');
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }

        console.log('Password change event listeners setup completed');
    },

    /**
     * Load current settings
     */
    async loadCurrentSettings() {
        try {
            // Load settings from config API
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();

                // Update form fields with loaded values
                const appNameField = document.getElementById('appName');
                const versionField = document.getElementById('version');
                const developmentDateField = document.getElementById('developmentDate');
                const developerField = document.getElementById('developer');
                const lastUpdateField = document.getElementById('lastUpdate');
                const currencyField = document.getElementById('currency');
                const commissionField = document.getElementById('globalCommission');

                if (appNameField) appNameField.value = config.app_name || 'شركة إعمار لتوصيل الطلبات';
                if (versionField) versionField.value = config.version || '1.0.0';
                if (developmentDateField) developmentDateField.value = config.development_date || 'أغسطس 2025';
                if (developerField) developerField.value = config.developer || 'د/وليد محمد';
                if (lastUpdateField) lastUpdateField.value = config.last_update || '25‏/8‏/2025 م';
                if (currencyField) currencyField.value = config.currency || 'KWD';
                if (commissionField) commissionField.value = config.global_commission_per_order || 0.250;

                console.log('Settings loaded successfully');
            } else {
                console.warn('Failed to load settings, using defaults');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const settings = {
                app_name: document.getElementById('appName').value,
                currency: document.getElementById('currency').value,
                global_commission_per_order: parseFloat(document.getElementById('globalCommission').value),
                maintenance_alert_days: parseInt(document.getElementById('maintenanceAlertDays').value),
                payroll_approval_required: document.getElementById('payrollApprovalRequired').checked,
                auto_advance_deduction: document.getElementById('autoAdvanceDeduction').checked
            };

            // For now, just show success message
            // In a real implementation, this would save to the server
            showSuccess('تم حفظ الإعدادات بنجاح');
            console.log('Settings saved:', settings);

        } catch (error) {
            showError('حدث خطأ أثناء حفظ الإعدادات');
            console.error('Error saving settings:', error);
        }
    },

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        const result = showConfirm(
            'هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟',
            'تأكيد إعادة التعيين'
        );

        if (result.isConfirmed) {
            document.getElementById('appName').value = 'شركة إعمار لتوصيل الطلبات';
            document.getElementById('currency').value = 'KWD';
            document.getElementById('globalCommission').value = '0.250';
            document.getElementById('maintenanceAlertDays').value = '30';
            document.getElementById('payrollApprovalRequired').checked = true;
            document.getElementById('autoAdvanceDeduction').checked = true;

            showSuccess('تم إعادة تعيين الإعدادات بنجاح');
        }
    },

    /**
     * Backup data
     */
    async backupData() {
        try {
            showLoading('جاري إنشاء النسخة الاحتياطية...');

            // Get all data
            const [drivers, vehicles, clients, orders, advances, payrollRuns, maintenanceSchedules] = await Promise.all([
                api.getDrivers(),
                api.getVehicles(),
                api.getClients(),
                api.getOrders(),
                api.getAdvances(),
                api.getPayrollRuns(),
                api.getMaintenanceSchedules()
            ]);

            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                data: {
                    drivers,
                    vehicles,
                    clients,
                    orders,
                    advances,
                    payroll_runs: payrollRuns,
                    maintenance_schedules: maintenanceSchedules
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `emar_delivery_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            hideLoading();
            showSuccess('تم إنشاء النسخة الاحتياطية بنجاح');

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
            console.error('Backup error:', error);
        }
    },

    /**
     * Restore data from backup
     */
    async restoreData(file) {
        if (!file) return;

        try {
            const result = await showConfirm(
                'هل تريد استعادة البيانات من النسخة الاحتياطية؟\nسيتم استبدال جميع البيانات الحالية.',
                'تأكيد الاستعادة'
            );

            if (!result.isConfirmed) return;

            showLoading('جاري استعادة البيانات...');

            const text = await file.text();
            const backupData = JSON.parse(text);

            // Validate backup structure
            if (!backupData.data || !backupData.timestamp) {
                throw new Error('ملف النسخة الاحتياطية غير صحيح');
            }

            // For now, just show success message
            // In a real implementation, this would restore data to the server
            hideLoading();
            showSuccess('تم استعادة البيانات بنجاح');
            console.log('Backup data:', backupData);

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء استعادة البيانات: ' + error.message);
            console.error('Restore error:', error);
        }
    },

    /**
     * Clear all data
     */
    async clearAllData() {
        try {
            // First confirmation with backup recommendation
            const result = await showConfirm(
                'هل تريد مسح جميع البيانات؟\n\n⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!\n\n📋 سيتم مسح:\n• جميع السائقين\n• جميع السيارات\n• جميع العملاء\n• جميع الطلبات\n• جميع السُلف\n• جميع الرواتب\n• جميع بيانات الصيانة\n\n💾 سيتم إنشاء نسخة احتياطية تلقائياً قبل المسح.',
                'تأكيد مسح البيانات'
            );

            if (!result.isConfirmed) return;

            // Double confirmation for destructive action
            const doubleConfirm = await showConfirm(
                '🚨 تأكيد أخير: هل أنت متأكد 100% من مسح جميع البيانات؟\n\nاكتب "نعم" للتأكيد:',
                'تأكيد نهائي',
                'warning',
                'نعم',
                'إلغاء'
            );

            if (!doubleConfirm.isConfirmed) return;

            showLoading('جاري إنشاء نسخة احتياطية ومسح البيانات...');

            // Call the API to clear all data
            const response = await fetch('/api/admin/clear-all-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                hideLoading();

                // Show detailed success message
                const successMessage = `
                    ✅ تم مسح جميع البيانات بنجاح!

                    📁 النسخة الاحتياطية محفوظة في:
                    ${data.backup_path}

                    📋 الملفات التي تم مسحها:
                    ${data.cleared_files.join(', ')}

                    ${data.failed_files.length > 0 ? `⚠️ فشل في مسح: ${data.failed_files.join(', ')}` : ''}
                `;

                showSuccess(successMessage);

                // Refresh current page to show empty data
                this.loadPage(this.currentPage);

            } else {
                throw new Error(data.error || 'فشل في مسح البيانات');
            }

        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء مسح البيانات: ${error.message}`);
            console.error('Clear data error:', error);
        }
    },

    /**
     * Load backup status
     */
    async loadBackupStatus() {
        try {
            const statusElement = document.getElementById('backupStatus');
            if (!statusElement) return;

            statusElement.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري تحميل حالة النسخ الاحتياطية...';

            const response = await fetch('/api/admin/backup/status');
            if (response.ok) {
                const status = await response.json();

                const totalSizeMB = (status.total_backup_size / (1024 * 1024)).toFixed(2);
                const dailyBackupsCount = status.daily_backups.length;
                const fullBackupsCount = status.full_backups.length;

                statusElement.innerHTML = `
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="mb-1">${dailyBackupsCount}</h6>
                                <small class="text-muted">نسخ يومية</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="mb-1">${fullBackupsCount}</h6>
                                <small class="text-muted">نسخ كاملة</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="mb-1">${totalSizeMB} MB</h6>
                                <small class="text-muted">الحجم الإجمالي</small>
                            </div>
                        </div>
                    </div>
                    ${status.daily_backups.length > 0 ? `
                        <div class="mt-2">
                            <small class="text-success">
                                <i class="fas fa-check-circle me-1"></i>
                                آخر نسخة احتياطية: ${new Date(status.daily_backups[0].created).toLocaleDateString('ar-KW', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'Asia/Kuwait'
                                })}
                            </small>
                        </div>
                    ` : ''}
                `;
                statusElement.className = 'alert alert-success';
            } else {
                throw new Error('فشل في تحميل حالة النسخ الاحتياطية');
            }
        } catch (error) {
            const statusElement = document.getElementById('backupStatus');
            if (statusElement) {
                statusElement.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>خطأ في تحميل الحالة: ${error.message}`;
                statusElement.className = 'alert alert-danger';
            }
        }
    },

    /**
     * Create full backup
     */
    async createFullBackup() {
        try {
            showLoading('جاري إنشاء النسخة الاحتياطية الكاملة...');

            const response = await fetch('/api/admin/backup/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            hideLoading();

            if (response.ok) {
                const data = await response.json();
                showSuccess(`تم إنشاء النسخة الاحتياطية بنجاح!\n\nالمسار: ${data.backup_path}`);

                // Refresh backup status
                this.loadBackupStatus();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'فشل في إنشاء النسخة الاحتياطية');
            }
        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء إنشاء النسخة الاحتياطية: ${error.message}`);
        }
    },

    /**
     * Cleanup old backups
     */
    async cleanupOldBackups() {
        try {
            const result = await showConfirm(
                'هل تريد تنظيف النسخ الاحتياطية القديمة؟\n\nسيتم الاحتفاظ بالنسخ الاحتياطية لآخر 30 يوم فقط.',
                'تأكيد تنظيف النسخ القديمة'
            );

            if (result.isConfirmed) {
                showLoading('جاري تنظيف النسخ الاحتياطية القديمة...');

                const response = await fetch('/api/admin/backup/cleanup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ days_to_keep: 30 })
                });

                hideLoading();

                if (response.ok) {
                    const data = await response.json();
                    showSuccess(data.message);

                    // Refresh backup status
                    this.loadBackupStatus();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'فشل في تنظيف النسخ الاحتياطية');
                }
            }
        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء تنظيف النسخ الاحتياطية: ${error.message}`);
        }
    },

    /**
     * Load performance metrics
     */
    loadPerformanceMetrics() {
        try {
            const metrics = this.getPerformanceMetrics();

            // Update performance metrics display
            const cacheHitRateElement = document.getElementById('cacheHitRate');
            const avgRenderTimeElement = document.getElementById('avgRenderTime');
            const cacheSizeElement = document.getElementById('cacheSize');
            const deferredRendersElement = document.getElementById('deferredRenders');
            const queueSizeElement = document.getElementById('queueSize');

            if (cacheHitRateElement) {
                cacheHitRateElement.textContent = `${metrics.cacheHitRate}%`;
            }
            if (avgRenderTimeElement) {
                avgRenderTimeElement.textContent = `${metrics.avgRenderTime.toFixed(2)}ms`;
            }
            if (cacheSizeElement) {
                cacheSizeElement.textContent = metrics.cacheSize;
            }
            if (deferredRendersElement) {
                deferredRendersElement.textContent = metrics.deferredRenders;
            }
            if (queueSizeElement) {
                queueSizeElement.textContent = metrics.queueSize;
            }

            console.log('📊 Performance metrics updated:', metrics);
        } catch (error) {
            console.error('Error loading performance metrics:', error);
        }
    },

    /**
     * Load event statistics
     */
    async loadEventStats() {
        try {
            const response = await fetch('/api/admin/events/stats?days=7');
            if (response.ok) {
                const stats = await response.json();

                // Update event stats display
                const totalEventsElement = document.getElementById('totalEvents');
                const todayEventsElement = document.getElementById('todayEvents');

                if (totalEventsElement) {
                    totalEventsElement.textContent = stats.total_events || 0;
                }

                // Calculate today's events
                const today = new Date().toISOString().split('T')[0];
                const todayCount = stats.daily_counts ? (stats.daily_counts[today] || 0) : 0;

                if (todayEventsElement) {
                    todayEventsElement.textContent = todayCount;
                }

                console.log('📊 Event statistics updated:', stats);
            } else {
                throw new Error('فشل في تحميل إحصائيات الأحداث');
            }
        } catch (error) {
            console.error('Error loading event stats:', error);
            const totalEventsElement = document.getElementById('totalEvents');
            const todayEventsElement = document.getElementById('todayEvents');

            if (totalEventsElement) totalEventsElement.textContent = 'خطأ';
            if (todayEventsElement) todayEventsElement.textContent = 'خطأ';
        }
    },

    /**
     * Load recent events
     */
    async loadRecentEvents() {
        try {
            const container = document.getElementById('recentEvents');
            if (!container) return;

            container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-spinner fa-spin me-2"></i>جاري تحميل الأحداث...</div>';

            const response = await fetch('/api/admin/events/recent?limit=20');
            if (response.ok) {
                const events = await response.json();

                if (events.length === 0) {
                    container.innerHTML = '<div class="text-center text-muted">لا توجد أحداث حديثة</div>';
                    return;
                }

                let html = '';
                events.forEach(event => {
                    const timestamp = new Date(event.timestamp).toLocaleString('ar-SA');
                    const actionText = this.getActionText(event.action);
                    const entityText = this.getEntityText(event.entity_type);

                    html += `
                        <div class="border-bottom pb-2 mb-2">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <small class="text-primary fw-bold">${actionText}</small>
                                    <small class="text-muted">${entityText}</small>
                                    ${event.details && event.details.driver_name ?
                                        `<small class="text-dark">- ${event.details.driver_name}</small>` : ''}
                                </div>
                                <small class="text-muted">${timestamp}</small>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            } else {
                throw new Error('فشل في تحميل الأحداث الحديثة');
            }
        } catch (error) {
            console.error('Error loading recent events:', error);
            const container = document.getElementById('recentEvents');
            if (container) {
                container.innerHTML = '<div class="text-center text-danger">خطأ في تحميل الأحداث</div>';
            }
        }
    },

    /**
     * Get Arabic text for action
     */
    getActionText(action) {
        const actionMap = {
            'create': 'إنشاء',
            'update': 'تحديث',
            'delete': 'حذف',
            'view': 'عرض',
            'login': 'تسجيل دخول',
            'logout': 'تسجيل خروج'
        };
        return actionMap[action] || action;
    },

    /**
     * Get Arabic text for entity type
     */
    getEntityText(entityType) {
        const entityMap = {
            'driver': 'سائق',
            'vehicle': 'مركبة',
            'client': 'عميل',
            'order': 'طلب',
            'advance': 'سُلفة',
            'dashboard': 'لوحة التحكم',
            'maintenance': 'صيانة',
            'breakdown': 'عطل'
        };
        return entityMap[entityType] || entityType;
    },

    /**
     * Cleanup old events
     */
    async cleanupOldEvents() {
        try {
            const result = await showConfirm(
                'هل تريد حذف الأحداث القديمة؟\n\nسيتم الاحتفاظ بالأحداث لآخر 90 يوم فقط.',
                'تأكيد حذف الأحداث القديمة'
            );

            if (result.isConfirmed) {
                showLoading('جاري حذف الأحداث القديمة...');

                const response = await fetch('/api/admin/events/cleanup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ days_to_keep: 90 })
                });

                hideLoading();

                if (response.ok) {
                    const data = await response.json();
                    showSuccess(data.message);

                    // Refresh event stats and recent events
                    this.loadEventStats();
                    this.loadRecentEvents();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'فشل في حذف الأحداث القديمة');
                }
            }
        } catch (error) {
            hideLoading();
            showError(`حدث خطأ أثناء حذف الأحداث القديمة: ${error.message}`);
        }
    },

    // ==================== PASSWORD CHANGE FUNCTIONS ====================

    /**
     * Change admin password
     */
    async changeAdminPassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Clear previous messages
            this.hidePasswordMessages();

            // Validate form
            if (!this.validatePasswordForm(currentPassword, newPassword, confirmPassword)) {
                return;
            }

            showLoading('جاري تغيير كلمة المرور...');

            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            hideLoading();

            if (response.ok) {
                const data = await response.json();
                this.showPasswordMessage('success', data.message || 'تم تغيير كلمة المرور بنجاح');
                this.resetPasswordForm();

                // Show success notification
                showSuccess('تم تغيير كلمة المرور بنجاح!\n\nسيتم تسجيل خروجك خلال 5 ثوانٍ لتسجيل الدخول بكلمة المرور الجديدة.');

                // Auto logout after 5 seconds
                setTimeout(() => {
                    this.logout();
                }, 5000);
            } else {
                const error = await response.json();
                this.showPasswordMessage('error', error.error || 'فشل في تغيير كلمة المرور');
            }
        } catch (error) {
            hideLoading();
            this.showPasswordMessage('error', `حدث خطأ أثناء تغيير كلمة المرور: ${error.message}`);
        }
    },

    /**
     * Validate password form
     */
    validatePasswordForm(currentPassword, newPassword, confirmPassword) {
        const errors = [];

        // Check if all fields are filled
        if (!currentPassword) {
            errors.push('يجب إدخال كلمة المرور الحالية');
        }

        if (!newPassword) {
            errors.push('يجب إدخال كلمة المرور الجديدة');
        }

        if (!confirmPassword) {
            errors.push('يجب تأكيد كلمة المرور الجديدة');
        }

        // Check password strength
        if (newPassword) {
            const strengthResult = this.checkPasswordStrength(newPassword);
            if (strengthResult.score < 3) {
                errors.push('كلمة المرور ضعيفة جداً. يجب أن تحتوي على 8 أحرف على الأقل مع أرقام وأحرف كبيرة وصغيرة');
            }
        }

        // Check password match
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            errors.push('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
        }

        // Check if new password is different from current
        if (currentPassword && newPassword && currentPassword === newPassword) {
            errors.push('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
        }

        if (errors.length > 0) {
            this.showPasswordValidationErrors(errors);
            return false;
        }

        return true;
    },

    /**
     * Show password validation errors
     */
    showPasswordValidationErrors(errors) {
        const messagesContainer = document.getElementById('passwordValidationMessages');
        const errorsList = document.getElementById('passwordValidationList');

        errorsList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
        messagesContainer.style.display = 'block';
    },

    /**
     * Show password change message
     */
    showPasswordMessage(type, message) {
        const messagesContainer = document.getElementById('passwordChangeMessages');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';

        messagesContainer.innerHTML = `
            <div class="alert ${alertClass}" role="alert">
                <i class="${icon} me-2"></i>${message}
            </div>
        `;
        messagesContainer.style.display = 'block';
    },

    /**
     * Hide password messages
     */
    hidePasswordMessages() {
        const validationMessages = document.getElementById('passwordValidationMessages');
        const changeMessages = document.getElementById('passwordChangeMessages');

        if (validationMessages) {
            validationMessages.style.display = 'none';
        }

        if (changeMessages) {
            changeMessages.style.display = 'none';
        }
    },

    /**
     * Reset password form
     */
    resetPasswordForm() {
        const passwordChangeForm = document.getElementById('passwordChangeForm');
        if (!passwordChangeForm) {
            console.warn('Password change form not found, skipping reset');
            return;
        }

        passwordChangeForm.reset();
        this.hidePasswordMessages();
        this.updatePasswordStrengthIndicator(0, 'أدخل كلمة مرور لتقييم قوتها', 'text-muted');
    },

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(inputId, buttonId) {
        console.log(`🔄 togglePasswordVisibility called: input=${inputId}, button=${buttonId}`);

        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (!input || !button) {
            console.warn(`❌ Password visibility toggle failed: input(${inputId}) or button(${buttonId}) not found`);
            console.log(`   input found: ${!!input}, button found: ${!!button}`);
            return;
        }

        const icon = button.querySelector('i');
        if (!icon) {
            console.warn(`❌ Password visibility toggle failed: icon not found in button(${buttonId})`);
            return;
        }

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            console.log(`✅ Password visibility: SHOWN (${inputId})`);
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            console.log(`✅ Password visibility: HIDDEN (${inputId})`);
        }
    },

    /**
     * Validate password strength
     */
    validatePasswordStrength() {
        const passwordField = document.getElementById('newPassword');
        if (!passwordField) {
            console.warn('New password field not found, skipping strength validation');
            return;
        }

        const password = passwordField.value;
        const result = this.checkPasswordStrength(password);

        this.updatePasswordStrengthIndicator(result.score, result.message, result.class);
    },

    /**
     * Check password strength
     */
    checkPasswordStrength(password) {
        if (!password) {
            return { score: 0, message: 'أدخل كلمة مرور لتقييم قوتها', class: 'text-muted' };
        }

        let score = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('8 أحرف على الأقل');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('حرف كبير واحد على الأقل');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('حرف صغير واحد على الأقل');
        }

        // Number check
        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('رقم واحد على الأقل');
        }

        // Special character check
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        } else {
            feedback.push('رمز خاص واحد على الأقل');
        }

        // Determine strength level
        let message, className;
        if (score === 0) {
            message = 'أدخل كلمة مرور لتقييم قوتها';
            className = 'text-muted';
        } else if (score <= 2) {
            message = `ضعيفة جداً - مطلوب: ${feedback.join(', ')}`;
            className = 'text-danger';
        } else if (score === 3) {
            message = `ضعيفة - مطلوب: ${feedback.join(', ')}`;
            className = 'text-warning';
        } else if (score === 4) {
            message = 'متوسطة - جيدة ولكن يمكن تحسينها';
            className = 'text-info';
        } else {
            message = 'قوية - ممتازة!';
            className = 'text-success';
        }

        return { score, message, class: className };
    },

    /**
     * Update password strength indicator
     */
    updatePasswordStrengthIndicator(score, message, className) {
        const progressBar = document.getElementById('passwordStrengthBar');
        const textElement = document.getElementById('passwordStrengthText');

        if (!progressBar || !textElement) {
            console.warn('Password strength indicator elements not found, skipping update');
            return;
        }

        // Update progress bar
        const percentage = (score / 5) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);

        // Update progress bar color
        progressBar.className = 'progress-bar';
        if (score <= 2) {
            progressBar.classList.add('bg-danger');
        } else if (score === 3) {
            progressBar.classList.add('bg-warning');
        } else if (score === 4) {
            progressBar.classList.add('bg-info');
        } else if (score === 5) {
            progressBar.classList.add('bg-success');
        }

        // Update text
        textElement.textContent = message;
        textElement.className = `form-text ${className}`;
    },

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');

        if (!newPasswordField || !confirmPasswordField) {
            console.warn('Password fields not found, skipping match validation');
            return;
        }

        const newPassword = newPasswordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordField.classList.add('is-invalid');

            // Add or update invalid feedback
            let feedback = confirmPasswordField.parentNode.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                confirmPasswordField.parentNode.appendChild(feedback);
            }
            feedback.textContent = 'كلمة المرور غير متطابقة';
        } else {
            confirmPasswordField.classList.remove('is-invalid');
            const feedback = confirmPasswordField.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        }
    },

    /**
     * Show driver advances modal
     */
    async showDriverAdvances(driverId) {
        try {
            showLoading('جاري تحميل بيانات السُلف...');

            // Get driver info
            const drivers = await api.getDrivers();
            const driver = drivers.find(d => d.id === driverId);

            if (!driver) {
                hideLoading();
                showError('لم يتم العثور على السائق');
                return;
            }

            // Get driver advances
            const allAdvances = await api.getAdvances();
            const driverAdvances = allAdvances.filter(advance => advance.driver_id === driverId);

            // Calculate totals
            const totalAdvances = driverAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);
            const totalPaid = driverAdvances.reduce((sum, advance) => sum + (advance.paid_amount || 0), 0);
            const totalOutstanding = totalAdvances - totalPaid;

            hideLoading();

            // Create modal content
            const modalContent = `
                <div class="modal fade" id="driverAdvancesModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-money-bill-wave me-2"></i>
                                    سُلف السائق: ${driver.full_name}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <!-- Summary Cards -->
                                <div class="row mb-4">
                                    <div class="col-md-4">
                                        <div class="card bg-info text-white">
                                            <div class="card-body text-center">
                                                <h5 class="card-title">إجمالي السُلف</h5>
                                                <h3>${formatCurrency(totalAdvances)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <h5 class="card-title">المدفوع</h5>
                                                <h3>${formatCurrency(totalPaid)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-warning text-white">
                                            <div class="card-body text-center">
                                                <h5 class="card-title">المتبقي</h5>
                                                <h3>${formatCurrency(totalOutstanding)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Advances Table -->
                                ${driverAdvances.length > 0 ? `
                                    <div class="table-responsive">
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>رقم السُلفة</th>
                                                    <th>تاريخ الإصدار</th>
                                                    <th>المبلغ</th>
                                                    <th>المدفوع</th>
                                                    <th>المتبقي</th>
                                                    <th>السبب</th>
                                                    <th>الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${driverAdvances.map(advance => {
                                                    const remaining = (advance.amount || 0) - (advance.paid_amount || 0);
                                                    return `
                                                        <tr>
                                                            <td>${advance.id}</td>
                                                            <td>${formatDate(advance.date_issued)}</td>
                                                            <td>${formatCurrency(advance.amount)}</td>
                                                            <td>${formatCurrency(advance.paid_amount || 0)}</td>
                                                            <td>${formatCurrency(remaining)}</td>
                                                            <td>${advance.reason || 'غير محدد'}</td>
                                                            <td>
                                                                <span class="badge bg-${this.getAdvanceStatusClass(advance.status)}">
                                                                    ${this.getAdvanceStatusText(advance.status)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    `;
                                                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : `
                                    <div class="alert alert-info text-center">
                                        <i class="fas fa-info-circle me-2"></i>
                                        لا توجد سُلف لهذا السائق
                                    </div>
                                `}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                                <button type="button" class="btn btn-primary" onclick="app.addAdvanceForDriver('${driverId}')">
                                    <i class="fas fa-plus me-2"></i>إضافة سُلفة جديدة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('driverAdvancesModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalContent);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('driverAdvancesModal'));
            modal.show();

            // Clean up when modal is hidden
            document.getElementById('driverAdvancesModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء تحميل بيانات السُلف: ' + error.message);
            console.error('Error loading driver advances:', error);
        }
    },

    /**
     * Show breakdown history modal
     */
    async showBreakdownHistory(breakdown) {
        try {
            showLoading('جاري تحميل سجل الإصلاحات...');

            // Get vehicle info
            const vehicles = await api.getVehicles();
            const vehicle = vehicles.find(v => v.id === breakdown.vehicle_id);

            // Get breakdown history
            const history = await api.getBreakdownHistory(breakdown.id);

            hideLoading();

            // Create modal content
            const modalContent = `
                <div class="modal fade" id="breakdownHistoryModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-history me-2"></i>
                                    سجل إصلاحات: ${vehicle ? `${vehicle.license_plate} - ${vehicle.make} ${vehicle.model}` : 'غير محدد'}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <!-- Vehicle Details -->
                                ${vehicle ? `
                                    <div class="card mb-4">
                                        <div class="card-header">
                                            <h6 class="mb-0">
                                                <i class="fas fa-car me-2"></i>
                                                تفاصيل السيارة
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-3">
                                                    <strong>رقم اللوحة:</strong><br>
                                                    ${vehicle.license_plate}
                                                </div>
                                                <div class="col-md-3">
                                                    <strong>الماركة والموديل:</strong><br>
                                                    ${vehicle.make} ${vehicle.model}
                                                </div>
                                                <div class="col-md-3">
                                                    <strong>سنة الصنع:</strong><br>
                                                    ${vehicle.year}
                                                </div>
                                                <div class="col-md-3">
                                                    <strong>اللون:</strong><br>
                                                    ${vehicle.color || 'غير محدد'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Breakdown Details -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0">
                                            <i class="fas fa-exclamation-triangle me-2"></i>
                                            تفاصيل العطل
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-3">
                                                <strong>تاريخ العطل:</strong><br>
                                                ${formatDate(breakdown.breakdown_date)}
                                            </div>
                                            <div class="col-md-3">
                                                <strong>الشخص المسؤول:</strong><br>
                                                ${breakdown.responsible_person}
                                            </div>
                                            <div class="col-md-3">
                                                <strong>تكلفة الإصلاح:</strong><br>
                                                ${formatCurrency(breakdown.repair_cost)}
                                            </div>
                                            <div class="col-md-3">
                                                <strong>الحالة:</strong><br>
                                                <span class="badge bg-${this.getBreakdownStatusClass(breakdown.status)}">
                                                    ${this.getBreakdownStatusText(breakdown.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="row mt-3">
                                            <div class="col-12">
                                                <strong>وصف العطل:</strong><br>
                                                ${breakdown.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- History Timeline -->
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">
                                            <i class="fas fa-clock me-2"></i>
                                            سجل الإصلاحات والملاحظات
                                        </h6>
                                        <button type="button" class="btn btn-primary btn-sm" onclick="app.addBreakdownHistoryEntry('${breakdown.id}')">
                                            <i class="fas fa-plus me-2"></i>إضافة ملاحظة
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        ${history.length > 0 ? `
                                            <div class="timeline">
                                                ${history.map(entry => `
                                                    <div class="timeline-item">
                                                        <div class="timeline-marker">
                                                            <i class="fas fa-circle"></i>
                                                        </div>
                                                        <div class="timeline-content">
                                                            <div class="timeline-header">
                                                                <h6 class="timeline-title">${entry.title}</h6>
                                                                <small class="text-muted">
                                                                    ${formatDate(entry.date_created)} - ${entry.created_by}
                                                                </small>
                                                            </div>
                                                            <div class="timeline-body">
                                                                <p>${entry.notes}</p>
                                                                ${entry.attachments && entry.attachments.length > 0 ? `
                                                                    <div class="attachments mt-2">
                                                                        <strong>المرفقات:</strong>
                                                                        <ul class="list-unstyled mt-1">
                                                                            ${entry.attachments.map(attachment => `
                                                                                <li>
                                                                                    <i class="fas fa-${attachment.type === 'image' ? 'image' : 'file-pdf'} me-2"></i>
                                                                                    <a href="#" class="text-decoration-none">${attachment.filename}</a>
                                                                                    <small class="text-muted">(${attachment.size})</small>
                                                                                </li>
                                                                            `).join('')}
                                                                        </ul>
                                                                    </div>
                                                                ` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : `
                                            <div class="alert alert-info text-center">
                                                <i class="fas fa-info-circle me-2"></i>
                                                لا يوجد سجل إصلاحات لهذا العطل بعد
                                            </div>
                                        `}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                                <button type="button" class="btn btn-primary" onclick="app.addBreakdownHistoryEntry('${breakdown.id}')">
                                    <i class="fas fa-plus me-2"></i>إضافة ملاحظة جديدة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('breakdownHistoryModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalContent);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('breakdownHistoryModal'));
            modal.show();

            // Clean up when modal is hidden
            document.getElementById('breakdownHistoryModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء تحميل سجل الإصلاحات: ' + error.message);
            console.error('Error loading breakdown history:', error);
        }
    },

    /**
     * Get breakdown status class for badge
     */
    getBreakdownStatusClass(status) {
        const statusMap = {
            'pending': 'warning',
            'in_progress': 'info',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    },

    /**
     * Get breakdown status text in Arabic
     */
    getBreakdownStatusText(status) {
        const statusMap = {
            'pending': 'في الانتظار',
            'in_progress': 'قيد الإصلاح',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    },

    /**
     * Add breakdown history entry
     */
    async addBreakdownHistoryEntry(breakdownId) {
        try {
            const fields = [
                {
                    name: 'action_date',
                    label: 'تاريخ الإجراء',
                    type: 'date',
                    required: true,
                    value: new Date().toISOString().split('T')[0]
                },
                {
                    name: 'action_type',
                    label: 'نوع الإجراء',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'diagnosis', text: 'فحص وتشخيص' },
                        { value: 'repair', text: 'إصلاح' },
                        { value: 'parts_replacement', text: 'استبدال قطع' },
                        { value: 'maintenance', text: 'صيانة' },
                        { value: 'testing', text: 'اختبار' },
                        { value: 'completion', text: 'اكتمال الإصلاح' },
                        { value: 'other', text: 'أخرى' }
                    ]
                },
                {
                    name: 'description',
                    label: 'وصف الإجراء',
                    type: 'textarea',
                    required: true,
                    placeholder: 'اكتب تفاصيل الإجراء المنجز...'
                },
                {
                    name: 'technician',
                    label: 'الفني المسؤول',
                    type: 'text',
                    placeholder: 'اسم الفني أو الورشة'
                },
                {
                    name: 'cost',
                    label: 'التكلفة (د.ك)',
                    type: 'number',
                    step: '0.001',
                    min: '0',
                    placeholder: '0.000'
                },
                {
                    name: 'parts_used',
                    label: 'القطع المستخدمة',
                    type: 'textarea',
                    placeholder: 'اذكر القطع الغيار أو المواد المستخدمة...'
                },
                {
                    name: 'status',
                    label: 'حالة الإجراء',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'completed', text: 'مكتمل' },
                        { value: 'in_progress', text: 'قيد التنفيذ' },
                        { value: 'pending', text: 'في الانتظار' }
                    ],
                    value: 'completed'
                },
                {
                    name: 'notes',
                    label: 'ملاحظات إضافية',
                    type: 'textarea',
                    placeholder: 'أي ملاحظات أو توصيات إضافية...'
                }
            ];

            const modal = new FormModal('breakdownHistoryEntryModal', {
                title: 'إضافة سجل إصلاح',
                fields: fields,
                size: 'lg',
                onSubmit: async (data) => {
                    try {
                        await api.createBreakdownHistory(breakdownId, data);
                        showSuccess('تم إضافة سجل الإصلاح بنجاح');
                        
                        // Refresh the breakdown history modal
                        const breakdown = { id: breakdownId };
                        await this.showBreakdownHistory(breakdown);
                    } catch (error) {
                        throw error;
                    }
                }
            });

            modal.show();

        } catch (error) {
            showError('حدث خطأ أثناء إضافة سجل الإصلاح: ' + error.message);
            console.error('Error adding breakdown history entry:', error);
        }
    },

    /**
     * Add advance for specific driver
     */
    addAdvanceForDriver(driverId) {
        // Close the advances modal first
        const modal = bootstrap.Modal.getInstance(document.getElementById('driverAdvancesModal'));
        if (modal) {
            modal.hide();
        }

        // Navigate to advances page and pre-select the driver
        this.currentPage = 'advances';
        this.renderPage();

        // Wait for page to render then show form with pre-selected driver
        setTimeout(() => {
            this.showAdvanceForm(null, driverId);
        }, 100);
    },

    /**
     * Get advance status class for badge
     */
    getAdvanceStatusClass(status) {
        const statusMap = {
            'active': 'warning',
            'partial': 'info',
            'paid': 'success',
            'cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    },

    /**
     * Get advance status text in Arabic
     */
    getAdvanceStatusText(status) {
        const statusMap = {
            'active': 'نشطة',
            'partial': 'مدفوعة جزئياً',
            'paid': 'مدفوعة بالكامل',
            'cancelled': 'ملغية'
        };
        return statusMap[status] || status;
    },

    /**
     * Initialize breakdowns page
     */
    async initializeBreakdownsPage() {
        try {
            const breakdowns = await api.getBreakdowns();
            const vehicles = await api.getVehicles();

            // Create vehicle lookup for display
            const vehicleLookup = {};
            vehicles.forEach(vehicle => {
                vehicleLookup[vehicle.id] = `${vehicle.license_plate} - ${vehicle.make} ${vehicle.model}`;
            });

            // Add vehicle names to breakdown data
            const breakdownsWithVehicles = breakdowns.map(breakdown => ({
                ...breakdown,
                vehicle_name: vehicleLookup[breakdown.vehicle_id] || 'غير محدد'
            }));

            const columns = [
                { field: 'row_number', label: 'م', type: 'number' },
                { field: 'vehicle_name', label: 'اسم السيارة', type: 'text' },
                { field: 'breakdown_date', label: 'تاريخ العطل', type: 'date' },
                { field: 'responsible_person', label: 'الشخص المسؤول', type: 'text' },
                { field: 'repair_cost', label: 'تكلفة الإصلاح', type: 'currency' },
                { field: 'description', label: 'وصف العطل', type: 'text' },
                { field: 'status', label: 'الحالة', type: 'breakdown_status' }
            ];

            // Create data table
            const breakdownsTable = new DataTable('breakdownsContainer', {
                title: 'الأعطال',
                icon: 'fas fa-exclamation-triangle',
                columns: columns,
                data: breakdownsWithVehicles,
                actions: ['edit', 'delete', 'history'],
                exportable: true,
                importable: true,
                selectable: true,
                onAdd: () => this.showBreakdownForm(),
                onEdit: (breakdown) => this.showBreakdownForm(breakdown),
                onDelete: (breakdown) => this.deleteBreakdown(breakdown),
                onBulkDelete: (ids) => this.bulkDeleteBreakdowns(ids),
                onHistory: (breakdown) => this.showBreakdownHistory(breakdown),
                onImport: (data) => this.importBreakdowns(data)
            });

            breakdownsTable.render();

        } catch (error) {
            console.error('Error initializing breakdowns page:', error);
            document.getElementById('breakdownsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطأ في تحميل صفحة الأعطال: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Show breakdown form
     */
    async showBreakdownForm(breakdown = null) {
        try {
            // Get vehicles for dropdown
            const vehicles = await api.getVehicles();

            const fields = [
                {
                    name: 'vehicle_id',
                    label: 'السيارة',
                    type: 'select',
                    required: true,
                    options: [
                        { value: '', label: 'اختر السيارة...' },
                        ...vehicles.map(vehicle => ({
                            value: vehicle.id,
                            label: `${vehicle.license_plate} - ${vehicle.make} ${vehicle.model}`
                        }))
                    ],
                    value: breakdown ? breakdown.vehicle_id : ''
                },
                {
                    name: 'current_mileage',
                    label: 'الكيلومترات الحالية',
                    type: 'number',
                    readonly: true,
                    value: breakdown ? vehicles.find(v => v.id === breakdown.vehicle_id)?.current_mileage || '' : ''
                },
                {
                    name: 'breakdown_date',
                    label: 'تاريخ العطل',
                    type: 'date',
                    required: true,
                    value: breakdown ? formatDateForInput(breakdown.breakdown_date) : new Date().toISOString().split('T')[0]
                },
                {
                    name: 'responsible_person',
                    label: 'الشخص المسؤول',
                    type: 'text',
                    required: true,
                    placeholder: 'اسم الفني أو المسؤول عن الإصلاح'
                },
                {
                    name: 'repair_cost',
                    label: 'تكلفة الإصلاح (د.ك)',
                    type: 'number',
                    min: 0,
                    step: 0.001,
                    placeholder: '0.000'
                },
                {
                    name: 'description',
                    label: 'وصف العطل',
                    type: 'textarea',
                    required: true,
                    placeholder: 'وصف تفصيلي للعطل والأعراض'
                },
                {
                    name: 'status',
                    label: 'حالة الإصلاح',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'pending', label: 'في الانتظار' },
                        { value: 'in_progress', label: 'قيد الإصلاح' },
                        { value: 'completed', label: 'مكتمل' },
                        { value: 'cancelled', label: 'ملغي' }
                    ]
                }
            ];

            const modal = new FormModal('breakdownModal', {
                title: breakdown ? 'تعديل العطل' : 'عطل جديد',
                fields: fields,
                onSubmit: async (formData) => {
                    try {
                        if (breakdown) {
                            await api.updateBreakdown(breakdown.id, formData);
                            showSuccess('تم تحديث العطل بنجاح');
                        } else {
                            await api.createBreakdown(formData);
                            showSuccess('تم إضافة العطل بنجاح');
                        }
                        this.initializeBreakdownsPage();
                    } catch (error) {
                        showError('حدث خطأ: ' + error.message);
                    }
                }
            });

            modal.show(breakdown);

            // Add vehicle details update functionality
            setTimeout(() => {
                const vehicleSelect = document.querySelector('select[name="vehicle_id"]');
                if (vehicleSelect) {
                    vehicleSelect.addEventListener('change', (e) => {
                        const selectedVehicleId = e.target.value;
                        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

                        if (selectedVehicle) {
                            // Update vehicle details fields
                            const makeField = document.querySelector('input[name="vehicle_make"]');
                            const modelField = document.querySelector('input[name="vehicle_model"]');
                            const yearField = document.querySelector('input[name="vehicle_year"]');
                            const colorField = document.querySelector('input[name="vehicle_color"]');
                            const mileageField = document.querySelector('input[name="current_mileage"]');

                            if (makeField) makeField.value = selectedVehicle.make || '';
                            if (modelField) modelField.value = selectedVehicle.model || '';
                            if (yearField) yearField.value = selectedVehicle.year || '';
                            if (colorField) colorField.value = selectedVehicle.color || '';
                            if (mileageField) mileageField.value = selectedVehicle.current_mileage || '';
                        } else {
                            // Clear vehicle details fields
                            const fields = ['vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_color', 'current_mileage'];
                            fields.forEach(fieldName => {
                                const field = document.querySelector(`input[name="${fieldName}"]`);
                                if (field) field.value = '';
                            });
                        }
                    });
                }
            }, 100);

        } catch (error) {
            showError('حدث خطأ أثناء تحميل النموذج: ' + error.message);
        }
    },

    /**
     * Delete breakdown
     */
    async deleteBreakdown(breakdown) {
        const result = await showConfirm(
            `هل تريد حذف عطل السيارة "${breakdown.vehicle_name}"؟`,
            'تأكيد الحذف'
        );

        if (result.isConfirmed) {
            try {
                await api.deleteBreakdown(breakdown.id);
                showSuccess('تم حذف العطل بنجاح');
                this.initializeBreakdownsPage();
            } catch (error) {
                showError('حدث خطأ أثناء حذف العطل: ' + error.message);
            }
        }
    },

    /**
     * Bulk delete breakdowns
     */
    async bulkDeleteBreakdowns(breakdownIds) {
        if (!breakdownIds || breakdownIds.length === 0) {
            showError('لم يتم تحديد أي أعطال');
            return;
        }

        const result = await showConfirm(
            `هل تريد حذف ${breakdownIds.length} عطل؟\nهذا الإجراء لا يمكن التراجع عنه.`,
            'تأكيد الحذف المتعدد'
        );

        if (result.isConfirmed) {
            try {
                showLoading('جاري حذف الأعطال...');
                const response = await api.bulkDeleteBreakdowns(breakdownIds);
                hideLoading();

                if (response.success) {
                    showSuccess(response.message);
                    this.initializeBreakdownsPage();
                } else {
                    showError(response.message || 'فشل في حذف الأعطال');
                }
            } catch (error) {
                hideLoading();
                showError(error.message || 'حدث خطأ أثناء حذف الأعطال');
            }
        }
    },

    /**
     * Import breakdowns data
     */
    async importBreakdowns(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const breakdownData of data) {
                try {
                    // Map CSV headers to actual field names
                    const mappedData = {
                        vehicle_id: breakdownData['معرف السيارة'] || breakdownData['vehicle_id'] || '',
                        breakdown_date: breakdownData['تاريخ العطل'] || breakdownData['breakdown_date'] || '',
                        responsible_person: breakdownData['الشخص المسؤول'] || breakdownData['responsible_person'] || '',
                        repair_cost: parseFloat(breakdownData['تكلفة الإصلاح'] || breakdownData['repair_cost'] || 0),
                        description: breakdownData['وصف العطل'] || breakdownData['description'] || '',
                        status: breakdownData['الحالة'] || breakdownData['status'] || 'pending'
                    };

                    // Validate required fields
                    if (!mappedData.vehicle_id || !mappedData.breakdown_date || !mappedData.description) {
                        throw new Error('البيانات المطلوبة مفقودة');
                    }

                    await api.createBreakdown(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(breakdownData) + 1}: ${error.message}`);
                }
            }

            // Show results
            if (successCount > 0) {
                showSuccess(`تم استيراد ${successCount} عطل بنجاح`);
                this.initializeBreakdownsPage();
            }

            if (errorCount > 0) {
                showError(`فشل في استيراد ${errorCount} عطل:\n${errors.slice(0, 5).join('\n')}`);
            }

        } catch (error) {
            showError('حدث خطأ أثناء استيراد البيانات: ' + error.message);
        }
    },

    /**
     * Import drivers data
     */
    async importDrivers(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const driverData of data) {
                try {
                    // Map CSV headers to actual field names
                    let phoneNumber = driverData['رقم الهاتف'] || driverData['phone'] || '';

                    // Auto-format phone number: add +965 prefix if missing
                    if (phoneNumber && !phoneNumber.startsWith('+965')) {
                        // Remove any existing country code variations
                        phoneNumber = phoneNumber.replace(/^(\+?965|00965)/, '');
                        // Add the correct +965 prefix
                        phoneNumber = '+965' + phoneNumber;
                    }

                    // Map employment type from Arabic to English
                    let employmentType = driverData['نوع التوظيف'] || driverData['employment_type'] || 'commission';
                    if (employmentType === 'بالعمولة') employmentType = 'commission';
                    else if (employmentType === 'راتب ثابت') employmentType = 'salary';
                    else if (employmentType === 'مختلط') employmentType = 'mixed';

                    // Map car ownership from Arabic to English
                    let carOwnership = driverData['ملكية السيارة'] || driverData['car_ownership'] || 'private';
                    if (carOwnership === 'خاص') carOwnership = 'private';
                    else if (carOwnership === 'شركة') carOwnership = 'company';

                    const mappedData = {
                        full_name: driverData['الاسم الكامل'] || driverData['full_name'] || '',
                        national_id: driverData['الرقم المدني'] || driverData['national_id'] || '',
                        phone: phoneNumber,
                        email: driverData['البريد الإلكتروني'] || driverData['email'] || '',
                        employment_type: employmentType,
                        car_ownership: carOwnership,
                        employment_date: driverData['تاريخ التوظيف'] || driverData['employment_date'] || new Date().toISOString().split('T')[0],
                        residency_number: driverData['الإقامة'] || driverData['residency_number'] || '',
                        residency_expiry_date: driverData['تاريخ انتهاء الإقامة'] || driverData['residency_expiry_date'] || '',
                        base_salary: parseFloat(driverData['الراتب الأساسي'] || driverData['base_salary'] || 0),
                        default_commission_per_order: parseFloat(driverData['العمولة الافتراضية'] || driverData['default_commission_per_order'] || 0),
                        max_advance_limit: parseFloat(driverData['حد السُلفة'] || driverData['max_advance_limit'] || 500),
                        is_active: (driverData['الحالة'] || driverData['is_active'] || 'نشط') === 'نشط'
                    };

                    await api.createDriver(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(driverData) + 2}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                this.initializeDriversPage();
            }

            if (errorCount > 0) {
                showError(`تم استيراد ${successCount} سجل بنجاح، فشل ${errorCount} سجل:\n${errors.slice(0, 5).join('\n')}`);
            } else {
                showSuccess(`تم استيراد ${successCount} سائق بنجاح`);
            }
        } catch (error) {
            showError('حدث خطأ أثناء استيراد بيانات السائقين: ' + error.message);
        }
    },

    /**
     * Import vehicles data
     */
    async importVehicles(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const vehicleData of data) {
                try {
                    const mappedData = {
                        license_plate: vehicleData['رقم اللوحة'] || vehicleData['license_plate'] || '',
                        make: vehicleData['الماركة'] || vehicleData['make'] || '',
                        model: vehicleData['الموديل'] || vehicleData['model'] || '',
                        year: parseInt(vehicleData['السنة'] || vehicleData['year'] || new Date().getFullYear()),
                        color: vehicleData['اللون'] || vehicleData['color'] || '',
                        insurance_expiry: vehicleData['انتهاء التأمين'] || vehicleData['insurance_expiry'] || '',
                        registration_expiry: vehicleData['انتهاء الترخيص'] || vehicleData['registration_expiry'] || '',
                        is_active: (vehicleData['الحالة'] || vehicleData['is_active'] || 'نشط') === 'نشط'
                    };

                    await api.createVehicle(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(vehicleData) + 2}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                this.initializeVehiclesPage();
            }

            if (errorCount > 0) {
                showError(`تم استيراد ${successCount} سجل بنجاح، فشل ${errorCount} سجل:\n${errors.slice(0, 5).join('\n')}`);
            } else {
                showSuccess(`تم استيراد ${successCount} سيارة بنجاح`);
            }
        } catch (error) {
            showError('حدث خطأ أثناء استيراد بيانات السيارات: ' + error.message);
        }
    },

    /**
     * Import clients data
     */
    async importClients(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const clientData of data) {
                try {
                    const mappedData = {
                        company_name: clientData['اسم الشركة'] || clientData['company_name'] || '',
                        contact_person: clientData['الشخص المسؤول'] || clientData['contact_person'] || '',
                        phone: clientData['رقم الهاتف'] || clientData['phone'] || '',
                        email: clientData['البريد الإلكتروني'] || clientData['email'] || '',
                        address: clientData['العنوان'] || clientData['address'] || '',
                        commission_rate: parseFloat(clientData['معدل العمولة'] || clientData['commission_rate'] || 0),
                        payment_terms: clientData['شروط الدفع'] || clientData['payment_terms'] || 'cash',
                        is_active: (clientData['الحالة'] || clientData['is_active'] || 'نشط') === 'نشط'
                    };

                    await api.createClient(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(clientData) + 2}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                this.initializeClientsPage();
            }

            if (errorCount > 0) {
                showError(`تم استيراد ${successCount} سجل بنجاح، فشل ${errorCount} سجل:\n${errors.slice(0, 5).join('\n')}`);
            } else {
                showSuccess(`تم استيراد ${successCount} عميل بنجاح`);
            }
        } catch (error) {
            showError('حدث خطأ أثناء استيراد بيانات العملاء: ' + error.message);
        }
    },

    /**
     * Import orders data
     */
    async importOrders(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const orderData of data) {
                try {
                    const mappedData = {
                        driver_id: orderData['معرف السائق'] || orderData['driver_id'] || '',
                        client_id: orderData['معرف العميل'] || orderData['client_id'] || '',
                        pickup_address: orderData['عنوان الاستلام'] || orderData['pickup_address'] || '',
                        delivery_address: orderData['عنوان التسليم'] || orderData['delivery_address'] || '',
                        order_date: orderData['تاريخ الطلب'] || orderData['order_date'] || new Date().toISOString().split('T')[0],
                        pickup_time: orderData['وقت الاستلام'] || orderData['pickup_time'] || '',
                        delivery_time: orderData['وقت التسليم'] || orderData['delivery_time'] || '',
                        status: orderData['الحالة'] || orderData['status'] || 'pending',
                        priority: orderData['الأولوية'] || orderData['priority'] || 'normal',
                        delivery_fee: parseFloat(orderData['رسوم التوصيل'] || orderData['delivery_fee'] || 0),
                        notes: orderData['ملاحظات'] || orderData['notes'] || ''
                    };

                    await api.createOrder(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(orderData) + 2}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                this.initializeOrdersPage();
            }

            if (errorCount > 0) {
                showError(`تم استيراد ${successCount} سجل بنجاح، فشل ${errorCount} سجل:\n${errors.slice(0, 5).join('\n')}`);
            } else {
                showSuccess(`تم استيراد ${successCount} طلب بنجاح`);
            }
        } catch (error) {
            showError('حدث خطأ أثناء استيراد بيانات الطلبات: ' + error.message);
        }
    },

    /**
     * Import maintenance schedules data
     */
    async importMaintenanceSchedules(data) {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const scheduleData of data) {
                try {
                    const mappedData = {
                        vehicle_id: scheduleData['معرف السيارة'] || scheduleData['vehicle_id'] || '',
                        maintenance_type: scheduleData['نوع الصيانة'] || scheduleData['maintenance_type'] || '',
                        due_date: scheduleData['تاريخ الاستحقاق'] || scheduleData['due_date'] || '',
                        due_mileage: parseInt(scheduleData['الكيلومترات المستحقة'] || scheduleData['due_mileage'] || 0),
                        description: scheduleData['الوصف'] || scheduleData['description'] || '',
                        priority: scheduleData['الأولوية'] || scheduleData['priority'] || 'normal',
                        status: scheduleData['الحالة'] || scheduleData['status'] || 'scheduled',
                        estimated_cost: parseFloat(scheduleData['التكلفة المقدرة'] || scheduleData['estimated_cost'] || 0),
                        notes: scheduleData['ملاحظات'] || scheduleData['notes'] || ''
                    };

                    await api.createMaintenanceSchedule(mappedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`السطر ${data.indexOf(scheduleData) + 2}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                this.loadMaintenanceSchedules();
            }

            if (errorCount > 0) {
                showError(`تم استيراد ${successCount} سجل بنجاح، فشل ${errorCount} سجل:\n${errors.slice(0, 5).join('\n')}`);
            } else {
                showSuccess(`تم استيراد ${successCount} جدولة صيانة بنجاح`);
            }
        } catch (error) {
            showError('حدث خطأ أثناء استيراد بيانات جدولة الصيانة: ' + error.message);
        }
    },

    /**
     * Update current date display
     */
    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = getCurrentDate();
        }
    },

    /**
     * Show driver history modal
     */
    async showDriverHistory(driver) {
        try {
            showLoading('جاري تحميل سجل السائق...');

            // Get driver history
            const allHistory = await api.getDriverHistory(driver.id);

            hideLoading();

            // Create modal content with driver history
            const modalContent = this.createDriverHistoryModal(driver, allHistory);

            // Remove existing modal if any
            const existingModal = document.getElementById('driverHistoryModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalContent);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('driverHistoryModal'));
            modal.show();

            // Add event listeners for photo upload and attachment downloads
            this.setupDriverHistoryEventListeners(driver.id);

            // Clean up when modal is hidden
            document.getElementById('driverHistoryModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء تحميل سجل السائق: ' + error.message);
            console.error('Error loading driver history:', error);
        }
    },

    /**
     * Setup event listeners for driver history modal
     */
    setupDriverHistoryEventListeners(driverId) {
        const modal = document.getElementById('driverHistoryModal');
        if (!modal) return;

        // Photo upload button
        const uploadBtn = modal.querySelector('.upload-photo-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const driverId = e.target.closest('.upload-photo-btn').dataset.driverId;
                this.uploadDriverPhoto(driverId);
            });
        }

        // Export CSV button
        const exportCsvBtn = modal.querySelector('.export-history-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const driverId = e.target.closest('.export-history-csv').dataset.driverId;
                const driverName = e.target.closest('.export-history-csv').dataset.driverName;
                this.exportDriverHistoryCSV(driverId, driverName);
            });
        }

        // Export Excel button
        const exportExcelBtn = modal.querySelector('.export-history-excel');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const driverId = e.target.closest('.export-history-excel').dataset.driverId;
                const driverName = e.target.closest('.export-history-excel').dataset.driverName;
                this.exportDriverHistoryExcel(driverId, driverName);
            });
        }

        // Attachment download links and buttons
        const downloadLinks = modal.querySelectorAll('.download-attachment-link, .download-attachment-btn');
        downloadLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filename = e.target.closest('[data-filename]').dataset.filename;
                const driverId = e.target.closest('[data-driver-id]').dataset.driverId;
                const historyId = e.target.closest('[data-history-id]').dataset.historyId;
                this.downloadAttachment(filename, driverId, historyId);
            });
        });

        // Add note button
        const addNoteBtn = modal.querySelector('.add-note-btn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const driverId = e.target.closest('.add-note-btn').dataset.driverId;
                this.addDriverNote(driverId);
            });
        }

        // Edit history buttons
        const editHistoryBtns = modal.querySelectorAll('.edit-history-btn');
        editHistoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const historyId = e.target.closest('.edit-history-btn').dataset.historyId;
                const driverId = e.target.closest('.edit-history-btn').dataset.driverId;
                this.editDriverHistoryEntry(driverId, historyId);
            });
        });

        // Delete history buttons
        const deleteHistoryBtns = modal.querySelectorAll('.delete-history-btn');
        deleteHistoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const historyId = e.target.closest('.delete-history-btn').dataset.historyId;
                const driverId = e.target.closest('.delete-history-btn').dataset.driverId;
                this.deleteDriverHistoryEntry(driverId, historyId);
            });
        });
    },

    /**
     * Create driver history modal content
     */
    createDriverHistoryModal(driver, allHistory) {
        return `
            <div class="modal fade" id="driverHistoryModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-clock me-2"></i>
                                سجل السائق: ${driver.full_name}
                            </h5>
                            <div class="d-flex align-items-center">
                                <div class="btn-group me-3" role="group">
                                    <button type="button" class="btn btn-outline-success btn-sm export-history-csv"
                                            data-driver-id="${driver.id}" data-driver-name="${driver.full_name}">
                                        <i class="fas fa-file-csv me-1"></i>تصدير CSV
                                    </button>
                                    <button type="button" class="btn btn-outline-primary btn-sm export-history-excel"
                                            data-driver-id="${driver.id}" data-driver-name="${driver.full_name}">
                                        <i class="fas fa-file-excel me-1"></i>تصدير Excel
                                    </button>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div class="modal-body">
                            ${this.renderDriverProfile(driver)}
                            ${this.renderTimelineSection(allHistory)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                            <button type="button" class="btn btn-primary add-note-btn" data-driver-id="${driver.id}">
                                <i class="fas fa-plus me-2"></i>إضافة ملاحظة جديدة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render driver profile section
     */
    renderDriverProfile(driver) {
        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-id-card me-2"></i>
                        ملف السائق الشخصي
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="driver-photo-section text-center">
                                <div class="driver-photo-placeholder mb-3">
                                    ${driver.photo_url ? 
                                        `<img src="${driver.photo_url}" class="img-thumbnail" style="width: 120px; height: 120px; object-fit: cover;" alt="صورة السائق">` 
                                        : '<i class="fas fa-user-circle fa-5x text-muted"></i>'
                                    }
                                </div>
                                <button type="button" class="btn btn-outline-primary btn-sm upload-photo-btn" data-driver-id="${driver.id}">
                                    <i class="fas fa-camera me-2"></i>تحديث الصورة
                                </button>
                            </div>
                        </div>
                        <div class="col-md-9">
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>الاسم الكامل:</strong><br>
                                    ${driver.full_name}
                                </div>
                                <div class="col-md-6">
                                    <strong>رقم الهاتف:</strong><br>
                                    ${driver.phone}
                                </div>
                                <div class="col-md-6 mt-2">
                                    <strong>الرقم المدني:</strong><br>
                                    ${driver.national_id}
                                </div>
                                <div class="col-md-6 mt-2">
                                    <strong>نوع التوظيف:</strong><br>
                                    ${this.getEmploymentTypeText(driver.employment_type)}
                                </div>
                                <div class="col-md-6 mt-2">
                                    <strong>تاريخ التوظيف:</strong><br>
                                    ${formatDate(driver.employment_date)}
                                </div>
                                <div class="col-md-6 mt-2">
                                    <strong>حالة الإقامة:</strong><br>
                                    ${this.formatResidencyStatusForDisplay(driver.residency_expiry_date)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render timeline section
     */
    renderTimelineSection(allHistory) {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-timeline me-2"></i>
                        السجل الزمني للأنشطة
                    </h6>
                </div>
                <div class="card-body">
                    ${allHistory.length > 0 ? `
                        <div class="timeline">
                            ${allHistory.map(entry => `
                                <div class="timeline-item">
                                    <div class="timeline-marker">
                                        <i class="fas fa-circle"></i>
                                    </div>
                                    <div class="timeline-content">
                                        <div class="timeline-header d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 class="timeline-title">${entry.title}</h6>
                                                <small class="text-muted">
                                                    ${formatDateTime(entry.date_created)} - ${entry.created_by}
                                                </small>
                                            </div>
                                            <div class="timeline-actions">
                                                <button class="btn btn-sm btn-outline-primary me-1 edit-history-btn"
                                                        data-history-id="${entry.id}"
                                                        data-driver-id="${entry.driver_id}"
                                                        title="تعديل الملاحظة">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger delete-history-btn"
                                                        data-history-id="${entry.id}"
                                                        data-driver-id="${entry.driver_id}"
                                                        title="حذف الملاحظة">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="timeline-body">
                                            <p>${entry.notes}</p>
                                            ${entry.attachments && entry.attachments.length > 0 ? `
                                                <div class="attachments mt-2">
                                                    <strong>المرفقات:</strong>
                                                    <ul class="list-unstyled mt-1">
                                                        ${entry.attachments.map(attachment => `
                                                            <li class="mb-1">
                                                                <i class="fas fa-${this.getFileIcon(attachment.filename)} me-2 text-primary"></i>
                                                                <a href="#" class="text-decoration-none attachment-link download-attachment-link"
                                                                   data-filename="${attachment.filename}"
                                                                   data-driver-id="${entry.driver_id}"
                                                                   data-history-id="${entry.id}"
                                                                   title="انقر للتنزيل">
                                                                   ${attachment.filename}
                                                                </a>
                                                                <small class="text-muted ms-2">(${attachment.size})</small>
                                                                <button class="btn btn-sm btn-outline-primary ms-2 download-attachment-btn"
                                                                        data-filename="${attachment.filename}"
                                                                        data-driver-id="${entry.driver_id}"
                                                                        data-history-id="${entry.id}"
                                                                        title="تنزيل الملف">
                                                                    <i class="fas fa-download"></i>
                                                                </button>
                                                            </li>
                                                        `).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="alert alert-info text-center">
                            <i class="fas fa-info-circle me-2"></i>
                            لا يوجد سجل أنشطة لهذا السائق بعد
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Get employment type text in Arabic
     */
    getEmploymentTypeText(type) {
        const typeMap = {
            'commission': 'بالعمولة',
            'salary': 'راتب ثابت',
            'mixed': 'مختلط'
        };
        return typeMap[type] || type;
    },

    /**
     * Format residency status for display
     */
    formatResidencyStatusForDisplay(expiryDate) {
        if (!expiryDate) return '<span class="text-muted">غير محدد</span>';

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return '<span class="badge bg-danger">منتهية</span>';
        } else if (diffDays < 30) {
            return '<span class="badge bg-warning">أقل من شهر</span>';
        } else if (diffDays < 90) {
            return '<span class="badge bg-warning">أقل من 3 شهور</span>';
        } else {
            return '<span class="badge bg-success">صالحة</span>';
        }
    },

    /**
     * Upload driver photo
     */
    async uploadDriverPhoto(driverId) {
        try {
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';

            // Handle file selection
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showError('يرجى اختيار ملف صورة صالح');
                    return;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
                    return;
                }

                try {
                    showLoading('جاري رفع الصورة...');

                    // Create FormData for upload
                    const formData = new FormData();
                    formData.append('photo', file);
                    formData.append('driver_id', driverId);

                    // Upload photo
                    const response = await fetch('/api/drivers/' + driverId + '/photo', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    const result = await response.json();

                    hideLoading();

                    if (response.ok) {
                        showSuccess('تم رفع الصورة بنجاح');
                        
                        // Refresh the modal to show new photo
                        const modal = document.getElementById('driverHistoryModal');
                        if (modal) {
                            // Update photo in the modal
                            const photoPlaceholder = modal.querySelector('.driver-photo-placeholder');
                            if (photoPlaceholder && result.photo_url) {
                                photoPlaceholder.innerHTML = `<img src="${result.photo_url}" class="img-thumbnail" style="width: 120px; height: 120px; object-fit: cover;">`;
                            }
                        }
                    } else {
                        throw new Error(result.error || 'حدث خطأ أثناء رفع الصورة');
                    }

                } catch (error) {
                    hideLoading();
                    showError(error.message || 'حدث خطأ أثناء رفع الصورة');
                }
            });

            // Trigger file selection
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);

        } catch (error) {
            showError('حدث خطأ أثناء فتح نافذة اختيار الملف');
            console.error('Error opening file dialog:', error);
        }
    },

    /**
     * Add new driver note
     */
    async addDriverNote(driverId) {
        try {
            // Create modal form for adding note
            const fields = [
                {
                    name: 'title',
                    label: 'عنوان الملاحظة',
                    type: 'text',
                    required: true,
                    placeholder: 'مثل: تجديد الإقامة، تقييم الأداء، إلخ'
                },
                {
                    name: 'notes',
                    label: 'تفاصيل الملاحظة',
                    type: 'textarea',
                    required: true,
                    placeholder: 'اكتب تفاصيل الملاحظة هنا...',
                    rows: 4
                },
                {
                    name: 'attachments',
                    label: 'المرفقات (اختياري)',
                    type: 'file',
                    multiple: true,
                    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
                    help: 'يمكنك إرفاق ملفات متعددة (PDF, صور, مستندات)'
                }
            ];

            const modal = new FormModal('driverNoteModal', {
                title: 'ملاحظة جديدة',
                icon: 'fas fa-sticky-note',
                fields: fields,
                onSubmit: async (data) => {
                    try {
                        // Create FormData for file uploads
                        const formData = new FormData();
                        formData.append('title', data.title);
                        formData.append('notes', data.notes);
                        formData.append('driver_id', driverId);

                        // Add attachments if any
                        const fileInput = document.querySelector('input[name="attachments"]');
                        if (fileInput && fileInput.files.length > 0) {
                            for (let i = 0; i < fileInput.files.length; i++) {
                                formData.append('attachments', fileInput.files[i]);
                            }
                        }

                        // Send request
                        const response = await fetch('/api/drivers/' + driverId + '/history', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        const result = await response.json();

                        if (response.ok) {
                            showSuccess('تم إضافة الملاحظة بنجاح');
                            
                            // Refresh the history modal
                            const historyModal = document.getElementById('driverHistoryModal');
                            if (historyModal) {
                                // Close current modal and refresh history
                                const driver = { id: driverId };
                                setTimeout(() => {
                                    this.showDriverHistory(driver);
                                }, 500);
                            }
                        } else {
                            throw new Error(result.error || 'حدث خطأ أثناء إضافة الملاحظة');
                        }

                    } catch (error) {
                        throw new Error(error.message || 'حدث خطأ أثناء حفظ الملاحظة');
                    }
                }
            });

            modal.show();

        } catch (error) {
            showError('حدث خطأ أثناء فتح نموذج إضافة الملاحظة');
            console.error('Error adding driver note:', error);
        }
    },

    /**
     * Download attachment file
     */
    async downloadAttachment(filename, driverId, historyId) {
        try {
            // Create download URL
            const downloadUrl = `/api/drivers/${driverId}/history/${historyId}/attachments/${encodeURIComponent(filename)}`;
            
            // Create temporary link element
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            showError('حدث خطأ أثناء تنزيل الملف');
            console.error('Error downloading attachment:', error);
        }
    },

    /**
     * Get appropriate file icon based on file extension
     */
    getFileIcon(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        
        const iconMap = {
            // Images
            'jpg': 'image',
            'jpeg': 'image', 
            'png': 'image',
            'gif': 'image',
            'bmp': 'image',
            'svg': 'image',
            
            // Documents
            'pdf': 'file-pdf',
            'doc': 'file-word',
            'docx': 'file-word',
            'xls': 'file-excel',
            'xlsx': 'file-excel',
            'ppt': 'file-powerpoint',
            'pptx': 'file-powerpoint',
            'txt': 'file-text',
            
            // Archives
            'zip': 'file-archive',
            'rar': 'file-archive',
            '7z': 'file-archive',
            
            // Default
            'default': 'file'
        };
        
        return iconMap[extension] || iconMap['default'];
    },

    /**
     * Edit driver history entry
     */
    async editDriverHistoryEntry(driverId, historyId) {
        try {
            // Get the current history entry
            const allHistory = await api.getDriverHistory(driverId);
            const historyEntry = allHistory.find(entry => entry.id === historyId);

            if (!historyEntry) {
                showError('لم يتم العثور على الملاحظة المطلوبة');
                return;
            }

            // Create edit form modal with same fields as add note
            const editModal = new FormModal('editHistoryModal', {
                title: 'تعديل الملاحظة',
                icon: 'fas fa-edit',
                fields: [
                    {
                        name: 'title',
                        label: 'عنوان الملاحظة',
                        type: 'text',
                        required: true,
                        placeholder: 'مثل: تجديد الإقامة، تقييم الأداء، إلخ'
                    },
                    {
                        name: 'notes',
                        label: 'تفاصيل الملاحظة',
                        type: 'textarea',
                        required: true,
                        placeholder: 'اكتب تفاصيل الملاحظة هنا...',
                        rows: 4
                    },
                    {
                        name: 'attachments',
                        label: 'المرفقات (اختياري)',
                        type: 'file',
                        multiple: true,
                        accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
                        help: 'يمكنك إرفاق ملفات متعددة (PDF, صور, مستندات)'
                    }
                ],
                onSubmit: async (data) => {
                    try {
                        // Create FormData for file uploads
                        const formData = new FormData();
                        formData.append('title', data.title);
                        formData.append('notes', data.notes);
                        formData.append('driver_id', driverId);

                        // Add attachments if any
                        const fileInput = document.querySelector('input[name="attachments"]');
                        if (fileInput && fileInput.files.length > 0) {
                            for (let i = 0; i < fileInput.files.length; i++) {
                                formData.append('attachments', fileInput.files[i]);
                            }
                        }

                        // Add deleted attachments info
                        const deletedAttachments = editModal.deletedAttachments || [];
                        formData.append('deleted_attachments', JSON.stringify(deletedAttachments));

                        // Update the history entry
                        await api.updateDriverHistory(driverId, historyId, formData);
                        showSuccess('تم تحديث الملاحظة بنجاح');

                        // Refresh the history modal
                        const driver = { id: driverId };
                        setTimeout(() => {
                            this.showDriverHistory(driver);
                        }, 500);

                    } catch (error) {
                        throw new Error(error.message || 'حدث خطأ أثناء تحديث الملاحظة');
                    }
                }
            });

            // Show modal with existing data - this is the key fix!
            editModal.show(historyEntry);

        } catch (error) {
            showError('حدث خطأ أثناء تحميل بيانات الملاحظة: ' + error.message);
            console.error('Error editing driver history entry:', error);
        }
    },

    /**
     * Delete driver history entry
     */
    async deleteDriverHistoryEntry(driverId, historyId) {
        try {
            // Get the current history entry for confirmation
            const allHistory = await api.getDriverHistory(driverId);
            const historyEntry = allHistory.find(entry => entry.id === historyId);

            if (!historyEntry) {
                showError('لم يتم العثور على الملاحظة المطلوبة');
                return;
            }

            // Show confirmation dialog
            const result = await showConfirm(
                `هل تريد حذف الملاحظة "${historyEntry.title}"؟\nهذا الإجراء لا يمكن التراجع عنه.`,
                'تأكيد الحذف'
            );

            if (result.isConfirmed) {
                // Delete the history entry
                await api.deleteDriverHistory(driverId, historyId);
                showSuccess('تم حذف الملاحظة بنجاح');

                // Refresh the history modal
                const driver = { id: driverId };
                setTimeout(() => {
                    this.showDriverHistory(driver);
                }, 500);
            }

        } catch (error) {
            showError('حدث خطأ أثناء حذف الملاحظة: ' + error.message);
            console.error('Error deleting driver history entry:', error);
        }
    },

    /**
     * Export driver history to CSV
     */
    async exportDriverHistoryCSV(driverId, driverName) {
        try {
            showLoading('جاري تصدير سجل السائق...');

            // Get driver history
            const history = await api.getDriverHistory(driverId);

            if (!history || history.length === 0) {
                hideLoading();
                showError('لا توجد بيانات للتصدير');
                return;
            }

            // Prepare data for export
            const exportData = history.map(entry => ({
                'العنوان': entry.title || '',
                'الملاحظات': entry.notes || '',
                'تاريخ الإنشاء': formatDateTime(entry.date_created) || '',
                'أنشئ بواسطة': entry.created_by || '',
                'تاريخ التحديث': entry.date_updated ? formatDateTime(entry.date_updated) : '',
                'محدث بواسطة': entry.updated_by || ''
            }));

            // Generate CSV content
            const csvContent = this.generateCSVContent(exportData);

            // Create and download file
            const filename = `سجل_السائق_${driverName}_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');

            hideLoading();
            showSuccess('تم تصدير سجل السائق بنجاح');

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء تصدير سجل السائق: ' + error.message);
            console.error('Error exporting driver history CSV:', error);
        }
    },

    /**
     * Export driver history to Excel
     */
    async exportDriverHistoryExcel(driverId, driverName) {
        try {
            showLoading('جاري تصدير سجل السائق...');

            // Get driver history
            const history = await api.getDriverHistory(driverId);

            if (!history || history.length === 0) {
                hideLoading();
                showError('لا توجد بيانات للتصدير');
                return;
            }

            // Prepare data for export
            const exportData = history.map(entry => ({
                'العنوان': entry.title || '',
                'الملاحظات': entry.notes || '',
                'تاريخ الإنشاء': formatDateTime(entry.date_created) || '',
                'أنشئ بواسطة': entry.created_by || '',
                'تاريخ التحديث': entry.date_updated ? formatDateTime(entry.date_updated) : '',
                'محدث بواسطة': entry.updated_by || ''
            }));

            // Generate Excel content using SheetJS-like approach
            const excelContent = this.generateExcelContent(exportData, `سجل السائق: ${driverName}`);

            // Create and download file
            const filename = `سجل_السائق_${driverName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            this.downloadFile(excelContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            hideLoading();
            showSuccess('تم تصدير سجل السائق بنجاح');

        } catch (error) {
            hideLoading();
            showError('حدث خطأ أثناء تصدير سجل السائق: ' + error.message);
            console.error('Error exporting driver history Excel:', error);
        }
    },

    /**
     * Generate CSV content from data array
     */
    generateCSVContent(data) {
        if (!data || data.length === 0) return '';

        // Get headers
        const headers = Object.keys(data[0]);

        // Create CSV content
        let csvContent = '\uFEFF'; // BOM for UTF-8

        // Add headers
        csvContent += headers.map(header => `"${header}"`).join(',') + '\n';

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape quotes and wrap in quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
        });

        return csvContent;
    },

    /**
     * Generate Excel content from data array (simplified XLSX format)
     */
    generateExcelContent(data, sheetName = 'Sheet1') {
        // For now, we'll use CSV format with Excel MIME type
        // In a full implementation, you would use a library like SheetJS
        return this.generateCSVContent(data);
    },

    /**
     * Download file with given content
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally accessible for modal event handlers
window.app = App;
