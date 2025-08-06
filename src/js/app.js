class SmartInvoiceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTheme();
        await this.loadPage('dashboard');
        this.checkFirstTimeSetup();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Handle service worker registration for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    }

    async loadPage(pageName) {
        this.showLoading();
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        const content = document.getElementById('main-content');
        
        try {
            switch (pageName) {
                case 'dashboard':
                    content.innerHTML = await this.getDashboardContent();
                    if (window.dashboardManager) {
                        await window.dashboardManager.init();
                    }
                    break;
                case 'invoice':
                    content.innerHTML = await this.getInvoiceContent();
                    if (window.invoiceManager) {
                        await window.invoiceManager.init();
                    }
                    break;
                case 'history':
                    content.innerHTML = await this.getHistoryContent();
                    await this.loadInvoiceHistory();
                    break;
                case 'items':
                    content.innerHTML = await this.getItemsContent();
                    if (window.itemsManager) {
                        await window.itemsManager.init();
                    }
                    break;
                case 'profile':
                    content.innerHTML = await this.getProfileContent();
                    if (window.profileManager) {
                        await window.profileManager.init();
                    }
                    break;
                default:
                    content.innerHTML = '<h1>Page not found</h1>';
            }
            
            this.currentPage = pageName;
        } catch (error) {
            console.error('Error loading page:', error);
            this.showNotification('Error loading page', 'error');
        }
        
        this.hideLoading();
    }

    async getDashboardContent() {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1>Dashboard</h1>
                    <div class="period-selector">
                        <select id="period-select" class="form-select">
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month" selected>This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📄</div>
                        <div class="stat-content">
                            <h3 id="total-invoices">0</h3>
                            <p>Total Invoices</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <h3 id="total-amount">₹0</h3>
                            <p>Total Amount</p>
                        </div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <h3 id="paid-amount">₹0</h3>
                            <p>Paid Amount</p>
                        </div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <h3 id="pending-amount">₹0</h3>
                            <p>Pending Amount</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-charts">
                    <div class="chart-container">
                        <div class="card">
                            <div class="card-header">
                                <h3>Invoice Status Distribution</h3>
                            </div>
                            <canvas id="status-chart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <div class="card">
                            <div class="card-header">
                                <h3>Monthly Revenue Trend</h3>
                            </div>
                            <canvas id="revenue-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="recent-invoices">
                    <div class="card">
                        <div class="card-header">
                            <h3>Recent Invoices</h3>
                            <button class="btn btn-primary" onclick="app.loadPage('invoice')">
                                Create New Invoice
                            </button>
                        </div>
                        <div id="recent-invoices-list">
                            <!-- Recent invoices will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async getInvoiceContent() {
        return `
            <div class="invoice-container">
                <div class="card">
                    <div class="card-header">
                        <h2>Create New Invoice</h2>
                    </div>
                    <form id="invoice-form">
                        <!-- Company Details (Auto-filled from profile) -->
                        <div class="company-section">
                            <h3>Company Details</h3>
                            <div id="company-info">
                                <!-- Will be auto-filled from profile -->
                            </div>
                        </div>

                        <!-- Buyer Details -->
                        <div class="buyer-section">
                            <h3>Buyer Details</h3>
                            <div class="grid grid-cols-2">
                                <div class="form-group">
                                    <label class="form-label">Buyer Name *</label>
                                    <input type="text" id="buyer-name" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Contact Number</label>
                                    <input type="tel" id="buyer-contact" class="form-input">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Address</label>
                                <textarea id="buyer-address" class="form-textarea" rows="3"></textarea>
                            </div>
                        </div>

                        <!-- Items Section -->
                        <div class="items-section">
                            <h3>Invoice Items</h3>
                            <div id="invoice-items">
                                <!-- Dynamic items will be added here -->
                            </div>
                            <button type="button" id="add-item-btn" class="btn btn-secondary">
                                + Add Item
                            </button>
                        </div>

                        <!-- Calculations -->
                        <div class="calculations-section">
                            <div class="grid grid-cols-2">
                                <div class="form-group">
                                    <label class="form-label">GST (%)</label>
                                    <input type="number" id="gst-rate" class="form-input" value="18" min="0" max="100">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Discount (₹)</label>
                                    <input type="number" id="discount" class="form-input" value="0" min="0">
                                </div>
                            </div>
                            <div class="calculation-summary">
                                <div class="calc-row">
                                    <span>Subtotal:</span>
                                    <span id="subtotal">₹0.00</span>
                                </div>
                                <div class="calc-row">
                                    <span>GST:</span>
                                    <span id="gst-amount">₹0.00</span>
                                </div>
                                <div class="calc-row">
                                    <span>Discount:</span>
                                    <span id="discount-amount">₹0.00</span>
                                </div>
                                <div class="calc-row total">
                                    <span>Total:</span>
                                    <span id="total-amount">₹0.00</span>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Details -->
                        <div class="additional-section">
                            <div class="grid grid-cols-2">
                                <div class="form-group">
                                    <label class="form-label">Due Date</label>
                                    <input type="date" id="due-date" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="show-qr"> Show UPI QR Code
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea id="notes" class="form-textarea" rows="3" 
                                    placeholder="Additional notes or terms..."></textarea>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.loadPage('dashboard')">
                                Cancel
                            </button>
                            <button type="button" id="preview-btn" class="btn btn-primary">
                                Preview
                            </button>
                            <button type="submit" class="btn btn-success">
                                Create Invoice
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Preview Modal -->
                <div id="invoice-preview-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Invoice Preview</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div id="invoice-preview-content">
                            <!-- Preview content -->
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary">Edit</button>
                            <button class="btn btn-primary" id="download-pdf-btn">Download PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async getHistoryContent() {
        return `
            <div class="history-container">
                <div class="card">
                    <div class="card-header">
                        <h2>Invoice History</h2>
                        <div class="history-filters">
                            <select id="status-filter" class="form-select">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <input type="date" id="date-from" class="form-input">
                            <input type="date" id="date-to" class="form-input">
                        </div>
                    </div>
                    <div id="invoices-table">
                        <!-- Invoice list table -->
                    </div>
                </div>
            </div>
        `;
    }

    async getItemsContent() {
        return `
            <div class="items-container">
                <div class="card">
                    <div class="card-header">
                        <h2>Item Master</h2>
                        <button id="add-new-item" class="btn btn-primary">Add New Item</button>
                    </div>
                    <div id="items-list">
                        <!-- Items list -->
                    </div>
                </div>

                <!-- Add/Edit Item Modal -->
                <div id="item-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="item-modal-title">Add New Item</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <form id="item-form">
                            <div class="form-group">
                                <label class="form-label">Item Name *</label>
                                <input type="text" id="item-name" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Price *</label>
                                <input type="number" id="item-price" class="form-input" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea id="item-description" class="form-textarea" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <input type="text" id="item-category" class="form-input">
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getProfileContent() {
        return `
            <div class="profile-container">
                <div class="card">
                    <div class="card-header">
                        <h2>Company Profile</h2>
                    </div>
                    <form id="profile-form">
                        <div class="grid grid-cols-2">
                            <div class="form-group">
                                <label class="form-label">Company Name *</label>
                                <input type="text" id="company-name" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">GSTIN</label>
                                <input type="text" id="gstin" class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address *</label>
                            <textarea id="company-address" class="form-textarea" rows="3" required></textarea>
                        </div>
                        <div class="grid grid-cols-2">
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" id="company-phone" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="company-email" class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">UPI ID (for QR Code)</label>
                            <input type="text" id="upi-id" class="form-input" placeholder="yourname@paytm">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Company Logo</label>
                            <input type="file" id="company-logo" class="form-input" accept="image/*">
                            <div id="logo-preview" class="logo-preview hidden">
                                <img id="logo-img" src="" alt="Logo Preview">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-success">Save Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async loadInvoiceHistory() {
        try {
            const invoices = await window.db.getAllInvoices();
            const tableContainer = document.getElementById('invoices-table');
            
            if (invoices.length === 0) {
                tableContainer.innerHTML = '<p class="text-center">No invoices found.</p>';
                return;
            }

            let tableHTML = `
                <table class="invoices-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Buyer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            invoices.forEach(invoice => {
                const statusClass = this.getStatusClass(invoice.status);
                tableHTML += `
                    <tr>
                        <td>${invoice.invoiceNumber}</td>
                        <td>${invoice.buyerName}</td>
                        <td>${new Date(invoice.createdAt).toLocaleDateString()}</td>
                        <td>₹${invoice.total.toFixed(2)}</td>
                        <td>
                            <select class="status-select ${statusClass}" 
                                onchange="app.updateInvoiceStatus(${invoice.id}, this.value)">
                                <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Paid</option>
                                <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                                <option value="cancelled" ${invoice.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn-icon" onclick="app.viewInvoice(${invoice.id})" title="View">👁️</button>
                            <button class="btn-icon" onclick="app.downloadInvoicePDF(${invoice.id})" title="Download">📥</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error loading invoice history:', error);
            this.showNotification('Error loading invoice history', 'error');
        }
    }

    getStatusClass(status) {
        const classes = {
            'pending': 'status-pending',
            'paid': 'status-paid',
            'overdue': 'status-overdue',
            'cancelled': 'status-cancelled'
        };
        return classes[status] || '';
    }

    async updateInvoiceStatus(invoiceId, newStatus) {
        try {
            await window.db.updateInvoiceStatus(invoiceId, newStatus);
            this.showNotification('Invoice status updated successfully', 'success');
            
            // Refresh dashboard if it's the current page
            if (this.currentPage === 'dashboard' && window.dashboardManager) {
                await window.dashboardManager.loadAnalytics();
            }
        } catch (error) {
            console.error('Error updating invoice status:', error);
            this.showNotification('Error updating invoice status', 'error');
        }
    }

    async checkFirstTimeSetup() {
        const profile = await window.db.getProfile();
        if (!profile) {
            this.showNotification('Please set up your company profile first', 'warning');
            setTimeout(() => {
                this.loadPage('profile');
            }, 2000);
        }
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.textContent = savedTheme === 'dark' ? '🌞' : '🌙';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.textContent = newTheme === 'dark' ? '🌞' : '🌙';
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;

        notifications.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SmartInvoiceApp();
});
