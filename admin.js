// Admin JavaScript for CRUD operations

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwenI5eITam0zeWMzXc6xs0SzX0RtkTczvkMjEqJeoeUiuJVx0xtlxYmV7mg4TbJFlYWw/exec';
let allOrders = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load data on admin page load
    if (document.querySelector('.admin-container')) {
        loadAllData();
        setupEventListeners();
    }
});

async function loadAllData() {
    try {
        // Load orders
        const ordersResponse = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&type=orders`);
        const ordersData = await ordersResponse.json();
        allOrders = ordersData.data || [];
        
        // Load customers (extracted from orders)
        processCustomersData();
        
        // Update dashboard
        updateDashboard();
        
        // Update tables
        updateOrdersTable();
        updateCustomersTable();
        updateRecentOrders();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showAdminMessage('Error loading data. Please try again.', 'error');
    }
}

function processCustomersData() {
    const customerMap = new Map();
    
    allOrders.forEach(order => {
        if (!customerMap.has(order.email)) {
            customerMap.set(order.email, {
                customerId: 'CUST-' + order.email.substring(0, 8).toUpperCase(),
                name: order.customerName,
                email: order.email,
                phone: order.phone,
                totalOrders: 1,
                lastOrder: order.timestamp,
                firstOrder: order.timestamp
            });
        } else {
            const customer = customerMap.get(order.email);
            customer.totalOrders++;
            if (new Date(order.timestamp) > new Date(customer.lastOrder)) {
                customer.lastOrder = order.timestamp;
            }
        }
    });
    
    allCustomers = Array.from(customerMap.values());
}

function updateDashboard() {
    document.getElementById('totalOrders').textContent = allOrders.length;
    document.getElementById('totalCustomers').textContent = allCustomers.length;
    document.getElementById('pendingOrders').textContent = allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('completedOrders').textContent = allOrders.filter(o => o.status === 'completed').length;
}

function updateOrdersTable() {
    const tableBody = document.querySelector('#ordersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    allOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${formatServiceType(order.serviceType)}</td>
            <td>${order.fabricType}</td>
            <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
            <td>${formatDate(order.timestamp)}</td>
            <td>
                <button class="btn-table btn-edit" data-id="${order.orderId}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-table btn-delete" data-id="${order.orderId}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteOrder(btn.dataset.id));
    });
}

function updateCustomersTable() {
    const tableBody = document.querySelector('#customersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    allCustomers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.customerId}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalOrders}</td>
            <td>${formatDate(customer.lastOrder)}</td>
            <td>
                <button class="btn-table btn-edit" onclick="viewCustomerOrders('${customer.email}')">
                    <i class="fas fa-eye"></i> View Orders
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateRecentOrders() {
    const tableBody = document.querySelector('#recentOrdersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Get 5 most recent orders
    const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${formatServiceType(order.serviceType)}</td>
            <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
            <td>${formatDate(order.timestamp)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshData')?.addEventListener('click', loadAllData);
    
    // Export button
    document.getElementById('exportData')?.addEventListener('click', exportData);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Search functionality
    const searchOrders = document.getElementById('searchOrders');
    const searchCustomers = document.getElementById('searchCustomers');
    
    if (searchOrders) {
        searchOrders.addEventListener('input', filterOrders);
    }
    
    if (searchCustomers) {
        searchCustomers.addEventListener('input', filterCustomers);
    }
    
    // Status filter
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', filterOrders);
    }
    
    // Admin order form
    const adminOrderForm = document.getElementById('adminOrderForm');
    if (adminOrderForm) {
        adminOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createOrderFromAdmin();
        });
    }
    
    // Modal close button
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    
    // Save edit button
    document.getElementById('saveEdit')?.addEventListener('click', saveEdit);
    
    // Delete order button
    document.getElementById('deleteOrder')?.addEventListener('click', confirmDelete);
    
    // Close modal on outside click
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

function filterOrders() {
    const searchTerm = document.getElementById('searchOrders')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    
    const filteredOrders = allOrders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm) ||
                            order.orderId.toLowerCase().includes(searchTerm) ||
                            order.serviceType.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    updateTableWithData(filteredOrders, '#ordersTable');
}

function filterCustomers() {
    const searchTerm = document.getElementById('searchCustomers')?.value.toLowerCase() || '';
    
    const filteredCustomers = allCustomers.filter(customer => {
        return customer.name.toLowerCase().includes(searchTerm) ||
               customer.email.toLowerCase().includes(searchTerm) ||
               customer.customerId.toLowerCase().includes(searchTerm);
    });
    
    updateCustomersTableWithData(filteredCustomers);
}

function updateTableWithData(orders, tableSelector) {
    const tableBody = document.querySelector(`${tableSelector} tbody`);
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${formatServiceType(order.serviceType)}</td>
            <td>${order.fabricType}</td>
            <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
            <td>${formatDate(order.timestamp)}</td>
            <td>
                <button class="btn-table btn-edit" data-id="${order.orderId}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-table btn-delete" data-id="${order.orderId}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Re-add event listeners
    document.querySelectorAll(`${tableSelector} .btn-edit`).forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    
    document.querySelectorAll(`${tableSelector} .btn-delete`).forEach(btn => {
        btn.addEventListener('click', () => deleteOrder(btn.dataset.id));
    });
}

function updateCustomersTableWithData(customers) {
    const tableBody = document.querySelector('#customersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.customerId}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalOrders}</td>
            <td>${formatDate(customer.lastOrder)}</td>
            <td>
                <button class="btn-table btn-edit" onclick="viewCustomerOrders('${customer.email}')">
                    <i class="fas fa-eye"></i> View Orders
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function createOrderFromAdmin() {
    const form = document.getElementById('adminOrderForm');
    const messageDiv = document.getElementById('adminMessage');
    
    // Validate form
    if (!validateAdminForm()) {
        return;
    }
    
    // Prepare order data
    const orderData = {
        action: 'create',
        timestamp: new Date().toISOString(),
        orderId: 'ADM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        customerName: document.getElementById('adminCustomerName').value,
        email: document.getElementById('adminEmail').value,
        phone: document.getElementById('adminPhone').value,
        serviceType: document.getElementById('adminServiceType').value,
        fabricType: document.getElementById('adminFabric').value || 'Not specified',
        color: document.getElementById('adminColor').value || 'Not specified',
        measurements: document.getElementById('adminMeasurements').value || 'To be taken',
        specialInstructions: document.getElementById('adminNotes').value || 'None',
        deliveryDate: document.getElementById('adminDeliveryDate').value || 'Not specified',
        status: document.getElementById('adminStatus').value,
        urgency: 'standard',
        budget: 'Not specified'
    };

    alert('orderData.......');
    alert('create: - GOOGLE_SCRIPT_URL : '+GOOGLE_SCRIPT_URL+'-orderdata-'+JSON.stringify(orderData));
    alert('orderData'+JSON.stringify(orderData));
    
    try {
        // Send to Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            showAdminMessage('Order created successfully!', 'success');
            form.reset();
            loadAllData(); // Refresh data
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showAdminMessage('Error creating order. Please try again.', 'error');
    }
}

function validateAdminForm() {
    const requiredFields = [
        'adminCustomerName',
        'adminEmail',
        'adminPhone',
        'adminServiceType',
        'adminStatus'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Validate email
    const emailField = document.getElementById('adminEmail');
    if (emailField.value && !validateEmail(emailField.value)) {
        showFieldError(emailField, 'Please enter a valid email');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    let errorDiv = formGroup.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '5px';
        formGroup.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    
    field.addEventListener('input', function() {
        if (errorDiv) errorDiv.remove();
    }, { once: true });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showAdminMessage(message, type) {
    const messageDiv = document.getElementById('adminMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

let currentEditOrderId = null;

function openEditModal(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) return;
    
    currentEditOrderId = orderId;
    
    // Populate modal form
    document.getElementById('editOrderId').value = orderId;
    document.getElementById('editStatus').value = order.status;
    document.getElementById('editNotes').value = order.specialInstructions || '';
    document.getElementById('editDeliveryDate').value = order.deliveryDate || '';
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditOrderId = null;
}

async function saveEdit() {
    const orderId = document.getElementById('editOrderId').value;
    const status = document.getElementById('editStatus').value;
    const notes = document.getElementById('editNotes').value;
    const deliveryDate = document.getElementById('editDeliveryDate').value;
    alert('orderId'+orderId);
    const updateData = {
        action: 'update',
        orderId: orderId,
        status: status,
        specialInstructions: notes,
        deliveryDate: deliveryDate
    };
    alert('update: orderId'+orderId+'- GOOGLE_SCRIPT_URL : '+GOOGLE_SCRIPT_URL);
    alert('update data: '+JSON.stringify(updateData));
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showAdminMessage('Order updated successfully!', 'success');
            closeModal();
            loadAllData(); // Refresh data
        } else {
            throw new Error('Failed to update order');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        showAdminMessage('Error updating order. Please try again.', 'error');
    }
}

async function deleteOrder(orderId) {
   
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        return;
    }

    const deleteData = {
        action: 'delete',
        orderId: orderId
    };
    
    alert('delete: orderId'+orderId+'- GOOGLE_SCRIPT_URL : '+GOOGLE_SCRIPT_URL);
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deleteData)
        });
        
        if (response.ok) {
            showAdminMessage('Order deleted successfully!', 'success');
            loadAllData(); // Refresh data
        } else {
            throw new Error('Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showAdminMessage('Error deleting order. Please try again.', 'error');
    }
}

function confirmDelete() {
    if (currentEditOrderId) {
        deleteOrder(currentEditOrderId);
        closeModal();
    }
}

function exportData() {
    // Export orders to CSV
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Service Type', 'Fabric', 'Color', 'Status', 'Order Date', 'Delivery Date'];
    const csvData = allOrders.map(order => [
        order.orderId,
        order.customerName,
        order.email,
        order.phone,
        formatServiceType(order.serviceType),
        order.fabricType,
        order.color,
        formatStatus(order.status),
        formatDate(order.timestamp),
        order.deliveryDate
    ]);
    
    const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-tailor-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions
function formatServiceType(serviceType) {
    const serviceMap = {
        'custom_suit': 'Custom Suit',
        'custom_shirt': 'Custom Shirt',
        'suit_alteration': 'Suit Alteration',
        'pants_alteration': 'Pants Alteration',
        'dress_alteration': 'Dress Alteration',
        'other': 'Other Service'
    };
    return serviceMap[serviceType] || serviceType;
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'ready_for_fitting': 'Ready for Fitting',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Global function for customer orders view
window.viewCustomerOrders = function(email) {
    const customerOrders = allOrders.filter(order => order.email === email);
    
    if (customerOrders.length === 0) return;
    
    let message = `Orders for ${customerOrders[0].customerName} (${email}):\n\n`;
    customerOrders.forEach((order, index) => {
        message += `${index + 1}. ${order.orderId} - ${formatServiceType(order.serviceType)} - ${formatStatus(order.status)}\n`;
    });
    
    alert(message);
};
