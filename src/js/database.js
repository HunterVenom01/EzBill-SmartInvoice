// Database configuration using Dexie.js
class InvoiceDatabase {
    constructor() {
        this.db = new Dexie('SmartInvoiceDB');
        this.initDatabase();
    }

    initDatabase() {
        this.db.version(1).stores({
            profile: '++id, companyName, address, gstin, logo, upiId, phone, email, createdAt, updatedAt',
            items: '++id, name, price, description, category, createdAt, updatedAt',
            invoices: '++id, invoiceNumber, buyerName, buyerContact, buyerAddress, items, subtotal, gst, discount, total, notes, dueDate, status, createdAt, updatedAt',
            settings: '++id, theme, autoGst, defaultDueDate'
        });

        // Initialize with default settings
        this.db.open().then(() => {
            this.initializeDefaults();
        });
    }

    async initializeDefaults() {
        const settingsCount = await this.db.settings.count();
        if (settingsCount === 0) {
            await this.db.settings.add({
                theme: 'light',
                autoGst: true,
                defaultDueDate: 30
            });
        }
    }

    // Profile methods
    async saveProfile(profileData) {
        try {
            profileData.updatedAt = new Date();
            const existingProfile = await this.db.profile.orderBy('id').last();
            
            if (existingProfile) {
                return await this.db.profile.update(existingProfile.id, profileData);
            } else {
                profileData.createdAt = new Date();
                return await this.db.profile.add(profileData);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }

    async getProfile() {
        try {
            return await this.db.profile.orderBy('id').last();
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }

    // Items methods
    async saveItem(itemData) {
        try {
            itemData.updatedAt = new Date();
            if (itemData.id) {
                return await this.db.items.update(itemData.id, itemData);
            } else {
                itemData.createdAt = new Date();
                return await this.db.items.add(itemData);
            }
        } catch (error) {
            console.error('Error saving item:', error);
            throw error;
        }
    }

    async getAllItems() {
        try {
            return await this.db.items.orderBy('name').toArray();
        } catch (error) {
            console.error('Error getting items:', error);
            return [];
        }
    }

    async deleteItem(id) {
        try {
            return await this.db.items.delete(id);
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    }

    // Invoice methods
    async saveInvoice(invoiceData) {
        try {
            invoiceData.updatedAt = new Date();
            if (!invoiceData.invoiceNumber) {
                invoiceData.invoiceNumber = await this.generateInvoiceNumber();
            }
            if (!invoiceData.status) {
                invoiceData.status = 'pending';
            }
            invoiceData.createdAt = new Date();
            return await this.db.invoices.add(invoiceData);
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
        }
    }

    async getAllInvoices() {
        try {
            return await this.db.invoices.orderBy('createdAt').reverse().toArray();
        } catch (error) {
            console.error('Error getting invoices:', error);
            return [];
        }
    }

    async updateInvoiceStatus(id, status) {
        try {
            return await this.db.invoices.update(id, { 
                status: status, 
                updatedAt: new Date() 
            });
        } catch (error) {
            console.error('Error updating invoice status:', error);
            throw error;
        }
    }

    async getInvoicesByDateRange(startDate, endDate) {
        try {
            return await this.db.invoices
                .where('createdAt')
                .between(startDate, endDate)
                .toArray();
        } catch (error) {
            console.error('Error getting invoices by date range:', error);
            return [];
        }
    }

    async generateInvoiceNumber() {
        const count = await this.db.invoices.count();
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }

    // Analytics methods
    async getAnalytics(period = 'month') {
        try {
            const now = new Date();
            let startDate;

            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const invoices = await this.getInvoicesByDateRange(startDate, now);
            
            const analytics = {
                totalInvoices: invoices.length,
                totalAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                overdueAmount: 0,
                statusBreakdown: {
                    pending: 0,
                    paid: 0,
                    overdue: 0,
                    cancelled: 0
                }
            };

            invoices.forEach(invoice => {
                analytics.totalAmount += invoice.total;
                analytics.statusBreakdown[invoice.status]++;

                if (invoice.status === 'paid') {
                    analytics.paidAmount += invoice.total;
                } else if (invoice.status === 'pending') {
                    const dueDate = new Date(invoice.dueDate);
                    if (dueDate < now) {
                        analytics.overdueAmount += invoice.total;
                        analytics.statusBreakdown.overdue++;
                        analytics.statusBreakdown.pending--;
                    } else {
                        analytics.pendingAmount += invoice.total;
                    }
                }
            });

            return analytics;
        } catch (error) {
            console.error('Error getting analytics:', error);
            return null;
        }
    }
}

// Initialize database
window.db = new InvoiceDatabase();
