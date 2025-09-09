/**
 * API Utility Functions
 * وظائف مساعدة للـ API
 */

class API {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json; charset=utf-8'
        };
        this.csrfToken = null;
    }

    /**
     * Get CSRF token from meta tag or API
     * الحصول على رمز CSRF من meta tag أو API
     */
    getCSRFToken() {
        // First try to get from meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }

        // If not available, return cached token
        return this.csrfToken;
    }

    /**
     * Fetch fresh CSRF token from API
     * جلب رمز CSRF جديد من API
     */
    async fetchCSRFToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            this.csrfToken = data.csrf_token;

            // Update meta tag if it exists
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                metaToken.setAttribute('content', this.csrfToken);
            }

            return this.csrfToken;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
            return null;
        }
    }

    /**
     * Ensure CSRF token is available
     * التأكد من توفر رمز CSRF
     */
    async ensureCSRFToken() {
        let token = this.getCSRFToken();
        if (!token) {
            token = await this.fetchCSRFToken();
        }
        return token;
    }

    /**
     * Make HTTP request with CSRF protection
     * إجراء طلب HTTP مع حماية CSRF
     */
    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}/api${endpoint}`;
        const options = {
            method: method,
            headers: { ...this.defaultHeaders },
            credentials: 'same-origin'
        };

        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
            const csrfToken = await this.ensureCSRFToken();
            if (csrfToken) {
                options.headers['X-CSRFToken'] = csrfToken;
            }
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            showLoading();
            const response = await fetch(url, options);

            // Handle CSRF token errors
            if (response.status === 400 && response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.includes('CSRF')) {
                    console.log('CSRF token expired, fetching new token...');
                    await this.fetchCSRFToken();
                    // Retry the request with new token
                    const newCsrfToken = this.getCSRFToken();
                    if (newCsrfToken) {
                        options.headers['X-CSRFToken'] = newCsrfToken;
                        const retryResponse = await fetch(url, options);
                        const retryResult = await retryResponse.json();
                        if (!retryResponse.ok) {
                            throw new Error(retryResult.error || `HTTP ${retryResponse.status}`);
                        }
                        return retryResult;
                    }
                }
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Authentication
    async login(username, password) {
        return await this.request('POST', '/login', { username, password });
    }

    async logout() {
        return await this.request('POST', '/logout');
    }

    async checkAuth() {
        return await this.request('GET', '/auth/check');
    }

    // Configuration
    async getConfig() {
        return await this.request('GET', '/config');
    }

    // Health check
    async healthCheck() {
        return await this.request('GET', '/health');
    }

    // Drivers
    async getDrivers() {
        return await this.request('GET', '/drivers');
    }

    async getDriver(id) {
        return await this.request('GET', `/drivers/${id}`);
    }

    async createDriver(data) {
        return await this.request('POST', '/drivers', data);
    }

    async updateDriver(id, data) {
        return await this.request('PUT', `/drivers/${id}`, data);
    }

    async deleteDriver(id) {
        return await this.request('DELETE', `/drivers/${id}`);
    }

    // Vehicles
    async getVehicles() {
        return await this.request('GET', '/vehicles');
    }

    async getVehicle(id) {
        return await this.request('GET', `/vehicles/${id}`);
    }

    async createVehicle(data) {
        return await this.request('POST', '/vehicles', data);
    }

    async updateVehicle(id, data) {
        return await this.request('PUT', `/vehicles/${id}`, data);
    }

    async deleteVehicle(id) {
        return await this.request('DELETE', `/vehicles/${id}`);
    }

    // Clients
    async getClients() {
        return await this.request('GET', '/clients');
    }

    async getClient(id) {
        return await this.request('GET', `/clients/${id}`);
    }

    async createClient(data) {
        return await this.request('POST', '/clients', data);
    }

    async updateClient(id, data) {
        return await this.request('PUT', `/clients/${id}`, data);
    }

    async deleteClient(id) {
        return await this.request('DELETE', `/clients/${id}`);
    }

    // Orders
    async getOrders() {
        return await this.request('GET', '/orders');
    }

    async getOrder(id) {
        return await this.request('GET', `/orders/${id}`);
    }

    async createOrder(data) {
        return await this.request('POST', '/orders', data);
    }

    async updateOrder(id, data) {
        return await this.request('PUT', `/orders/${id}`, data);
    }

    async deleteOrder(id) {
        return await this.request('DELETE', `/orders/${id}`);
    }

    // Monthly Orders
    async getOrdersMenu() {
        return await this.request('GET', '/orders/menu');
    }

    async getMonthlyOrders(month, year) {
        return await this.request('GET', `/orders/monthly?month=${month}&year=${year}`);
    }

    async getMonthlyOrder(id) {
        return await this.request('GET', `/orders/monthly/${id}`);
    }

    async createMonthlyOrder(data) {
        return await this.request('POST', '/orders/monthly', data);
    }

    async updateMonthlyOrder(id, data) {
        return await this.request('PATCH', `/orders/monthly/${id}`, data);
    }

    async deleteMonthlyOrder(id) {
        return await this.request('DELETE', `/orders/monthly/${id}`);
    }

    async getEligibleDrivers() {
        return await this.request('GET', '/options/drivers/eligible');
    }

    // Advances
    async getAdvances() {
        return await this.request('GET', '/advances');
    }

    async getAdvance(id) {
        return await this.request('GET', `/advances/${id}`);
    }

    async createAdvance(data) {
        return await this.request('POST', '/advances', data);
    }

    async updateAdvance(id, data) {
        return await this.request('PUT', `/advances/${id}`, data);
    }

    async deleteAdvance(id) {
        return await this.request('DELETE', `/advances/${id}`);
    }

    async getDriverAdvances(driverId) {
        return await this.request('GET', `/advances/driver/${driverId}`);
    }

    async getOutstandingAdvances() {
        return await this.request('GET', '/advances/outstanding');
    }

    // Payroll
    async calculatePayroll(year, month, driverIds = null) {
        return await this.request('POST', '/payroll/calculate', {
            year: year,
            month: month,
            driver_ids: driverIds
        });
    }

    async getPayrollRuns() {
        return await this.request('GET', '/payroll/runs');
    }

    async createPayrollRun(year, month, driverIds = null) {
        return await this.request('POST', '/payroll/runs', {
            year: year,
            month: month,
            driver_ids: driverIds
        });
    }

    async getPayrollRun(id) {
        return await this.request('GET', `/payroll/runs/${id}`);
    }

    async approvePayrollRun(id) {
        return await this.request('POST', `/payroll/runs/${id}/approve`);
    }

    async processPayrollDeductions(id) {
        return await this.request('POST', `/payroll/runs/${id}/process-deductions`);
    }

    async closePayrollRun(id) {
        return await this.request('POST', `/payroll/runs/${id}/close`);
    }

    async getDriverPayrollHistory(driverId) {
        return await this.request('GET', `/payroll/driver/${driverId}`);
    }

    // Maintenance
    async getMaintenanceSchedules() {
        return await this.request('GET', '/maintenance/schedules');
    }

    async getMaintenanceSchedule(id) {
        return await this.request('GET', `/maintenance/schedules/${id}`);
    }

    async createMaintenanceSchedule(data) {
        return await this.request('POST', '/maintenance/schedules', data);
    }

    async updateMaintenanceSchedule(id, data) {
        return await this.request('PUT', `/maintenance/schedules/${id}`, data);
    }

    async deleteMaintenanceSchedule(id) {
        return await this.request('DELETE', `/maintenance/schedules/${id}`);
    }

    async getDueMaintenance() {
        return await this.request('GET', '/maintenance/schedules/due');
    }

    async getMaintenanceLogs() {
        return await this.request('GET', '/maintenance/logs');
    }

    async getMaintenanceLog(id) {
        return await this.request('GET', `/maintenance/logs/${id}`);
    }

    async createMaintenanceLog(data) {
        return await this.request('POST', '/maintenance/logs', data);
    }

    async updateMaintenanceLog(id, data) {
        return await this.request('PUT', `/maintenance/logs/${id}`, data);
    }

    async deleteMaintenanceLog(id) {
        return await this.request('DELETE', `/maintenance/logs/${id}`);
    }

    // Commission calculation
    async calculateCommission(driverId, clientId, date) {
        return await this.request('POST', '/calculate-commission', {
            driver_id: driverId,
            client_id: clientId,
            date: date
        });
    }

    // Dashboard stats
    async getDashboardStats(month = null, year = null) {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        const url = `/dashboard/stats${params.toString() ? '?' + params.toString() : ''}`;
        return await this.request('GET', url);
    }

    // Breakdowns
    async getBreakdowns() {
        return await this.request('GET', '/breakdowns');
    }

    async getBreakdown(id) {
        return await this.request('GET', `/breakdowns/${id}`);
    }

    async createBreakdown(data) {
        return await this.request('POST', '/breakdowns', data);
    }

    async updateBreakdown(id, data) {
        return await this.request('PUT', `/breakdowns/${id}`, data);
    }

    async deleteBreakdown(id) {
        return await this.request('DELETE', `/breakdowns/${id}`);
    }

    // Breakdown History
    async getBreakdownHistory(breakdownId) {
        return await this.request('GET', `/breakdowns/${breakdownId}/history`);
    }

    async createBreakdownHistory(breakdownId, data) {
        return await this.request('POST', `/breakdowns/${breakdownId}/history`, data);
    }

    async updateBreakdownHistory(breakdownId, historyId, data) {
        return await this.request('PUT', `/breakdowns/${breakdownId}/history/${historyId}`, data);
    }

    async deleteBreakdownHistory(breakdownId, historyId) {
        return await this.request('DELETE', `/breakdowns/${breakdownId}/history/${historyId}`);
    }

    // Driver History
    async getDriverHistory(driverId) {
        return await this.request('GET', `/drivers/${driverId}/history`);
    }

    async createDriverHistory(driverId, data) {
        return await this.request('POST', `/drivers/${driverId}/history`, data);
    }

    async updateDriverHistory(driverId, historyId, data) {
        return await this.request('PUT', `/drivers/${driverId}/history/${historyId}`, data);
    }

    async deleteDriverHistory(driverId, historyId) {
        return await this.request('DELETE', `/drivers/${driverId}/history/${historyId}`);
    }

    // Document Management Methods
    async getDocuments(entityType = null, entityId = null) {
        let endpoint = '/documents';
        if (entityType && entityId) {
            endpoint += `/entity/${entityType}/${entityId}`;
        }
        return await this.request('GET', endpoint);
    }

    async getDocument(id) {
        return await this.request('GET', `/documents/${id}`);
    }

    async updateDocument(id, data) {
        return await this.request('PUT', `/documents/${id}`, data);
    }

    async deleteDocument(id) {
        return await this.request('DELETE', `/documents/${id}`);
    }

    async getDocumentStats() {
        return await this.request('GET', '/documents/stats');
    }
}

// Global API instance
const api = new API();
