// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwenI5eITam0zeWMzXc6xs0SzX0RtkTczvkMjEqJeoeUiuJVx0xtlxYmV7mg4TbJFlYWw/exec';
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('tailoringOrderForm');
    const formMessage = document.getElementById('formMessage');
    
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateOrderForm()) {
                return;
            }
            
            // Show loading state
            const submitBtn = orderForm.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Prepare form data
                const formData = new FormData(orderForm);
                const orderData = {
                    action: 'create',
                    timestamp: new Date().toISOString(),
                    orderId: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                    customerName: formData.get('customerName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    serviceType: formData.get('serviceType'),
                    fabricType: formData.get('fabricType') || 'Not specified',
                    color: formData.get('color') || 'Not specified',
                    measurements: formData.get('measurements'),
                    specialInstructions: formData.get('specialInstructions') || 'None',
                    deliveryDate: formData.get('deliveryDate') || 'Not specified',
                    urgency: formData.get('urgency'),
                    budget: formData.get('budget') || 'Not specified',
                    status: 'pending'
                };

                // alert('orderData-'+JSON.stringify(orderData));
                // Send to Google Sheets via Google Apps Script
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // For GitHub Pages compatibility
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });
                
                // Since we're using no-cors mode, we can't read the response
                // But we can assume it worked if no error was thrown
                
                // Show success message
                showMessage('Order submitted successfully! We will contact you within 24 hours to schedule your fitting appointment.', 'success');
                
                // Reset form
                orderForm.reset();
                
                // Generate and display order confirmation
                displayOrderConfirmation(orderData);
                
            } catch (error) {
                console.error('Error submitting order:', error);
                showMessage('There was an error submitting your order. Please try again or contact us directly.', 'error');
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Add real-time validation
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                validateEmailField(this);
            });
        }
        
        if (phoneInput) {
            phoneInput.addEventListener('blur', function() {
                validatePhoneField(this);
            });
        }
        
        // Set minimum date for delivery date
        const deliveryDateInput = document.getElementById('deliveryDate');
        if (deliveryDateInput) {
            const today = new Date();
            const minDate = new Date(today);
            minDate.setDate(today.getDate() + 7); // Minimum 7 days from today
            deliveryDateInput.min = minDate.toISOString().split('T')[0];
        }
    }
    
    function validateOrderForm() {
        let isValid = true;
        
        // Clear previous errors
        clearErrors();
        
        // Required fields validation
        const requiredFields = orderForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Email validation
        const emailField = document.getElementById('email');
        if (emailField && !validateEmailField(emailField)) {
            isValid = false;
        }
        
        // Phone validation
        const phoneField = document.getElementById('phone');
        if (phoneField && !validatePhoneField(phoneField)) {
            isValid = false;
        }
        
        // Terms validation
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateEmailField(field) {
        const email = field.value.trim();
        if (!email) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        return true;
    }
    
    function validatePhoneField(field) {
        const phone = field.value.trim();
        if (!phone) return false;
        
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (!phoneRegex.test(cleanedPhone)) {
            showFieldError(field, 'Please enter a valid phone number');
            return false;
        }
        return true;
    }
    
    function showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        field.classList.add('error');
        
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
            this.classList.remove('error');
            if (errorDiv) errorDiv.remove();
        }, { once: true });
    }
    
    function clearErrors() {
        const errorFields = orderForm.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        const errorMessages = orderForm.querySelectorAll('.field-error');
        errorMessages.forEach(msg => msg.remove());
    }
    
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 10000);
    }
    
    function displayOrderConfirmation(orderData) {
        const orderInfo = document.querySelector('.order-info');
        if (!orderInfo) return;
        
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'confirmation-message';
        confirmationDiv.style.background = 'rgba(40, 167, 69, 0.1)';
        confirmationDiv.style.border = '1px solid rgba(40, 167, 69, 0.2)';
        confirmationDiv.style.borderRadius = 'var(--border-radius)';
        confirmationDiv.style.padding = '20px';
        confirmationDiv.style.marginTop = '20px';
        
        confirmationDiv.innerHTML = `
            <h4><i class="fas fa-check-circle" style="color: var(--success-color);"></i> Order Confirmed!</h4>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Service:</strong> ${formatServiceType(orderData.serviceType)}</p>
            <p><strong>Status:</strong> <span style="color: var(--warning-color);">Pending - Awaiting Fitting Appointment</span></p>
            <p>We will contact you at ${orderData.email} or ${orderData.phone} within 24 hours to schedule your fitting appointment.</p>
            <button id="printConfirmation" class="btn-secondary" style="margin-top: 10px;">
                <i class="fas fa-print"></i> Print Confirmation
            </button>
        `;
        
        // Remove any existing confirmation
        const existingConfirmation = orderInfo.querySelector('.confirmation-message');
        if (existingConfirmation) {
            existingConfirmation.remove();
        }
        
        orderInfo.prepend(confirmationDiv);
        
        // Add print functionality
        document.getElementById('printConfirmation')?.addEventListener('click', function() {
            printOrderConfirmation(orderData);
        });
    }
    
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
    
    function printOrderConfirmation(orderData) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Confirmation - ${orderData.orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin: 20px 0; }
                    .detail-row { margin: 10px 0; }
                    .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Elite Tailor</h1>
                    <h2>Order Confirmation</h2>
                    <p>Order ID: ${orderData.orderId}</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="details">
                    <h3>Customer Information</h3>
                    <div class="detail-row"><strong>Name:</strong> ${orderData.customerName}</div>
                    <div class="detail-row"><strong>Email:</strong> ${orderData.email}</div>
                    <div class="detail-row"><strong>Phone:</strong> ${orderData.phone}</div>
                    
                    <h3>Order Details</h3>
                    <div class="detail-row"><strong>Service:</strong> ${formatServiceType(orderData.serviceType)}</div>
                    <div class="detail-row"><strong>Fabric:</strong> ${orderData.fabricType}</div>
                    <div class="detail-row"><strong>Color:</strong> ${orderData.color}</div>
                    <div class="detail-row"><strong>Urgency:</strong> ${orderData.urgency}</div>
                    <div class="detail-row"><strong>Budget:</strong> ${orderData.budget}</div>
                    <div class="detail-row"><strong>Status:</strong> Pending - Awaiting Fitting Appointment</div>
                    
                    <h3>Next Steps</h3>
                    <p>1. We will contact you within 24 hours to schedule your fitting appointment</p>
                    <p>2. Please bring any reference garments or inspiration images to your appointment</p>
                    <p>3. Fitting session typically takes 45-60 minutes</p>
                </div>
                <div class="footer">
                    <p>Thank you for choosing Elite Tailor!</p>
                    <p>Contact: (555) 123-4567 | info@elitetailor.com</p>
                    <p>123 Fashion Ave, Style District</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
});
