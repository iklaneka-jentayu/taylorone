// Main JavaScript file for common functionality

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Form validation for common forms
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    const validatePhone = (phone) => {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    };
    
    // Add validation to forms
    const forms = document.querySelectorAll('form:not(#adminOrderForm):not(#editOrderForm)');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const emailInputs = this.querySelectorAll('input[type="email"]');
            const phoneInputs = this.querySelectorAll('input[type="tel"]');
            
            emailInputs.forEach(input => {
                if (input.value && !validateEmail(input.value)) {
                    isValid = false;
                    showInputError(input, 'Please enter a valid email address');
                }
            });
            
            phoneInputs.forEach(input => {
                if (input.value && !validatePhone(input.value)) {
                    isValid = false;
                    showInputError(input, 'Please enter a valid phone number');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
    
    // Input error styling
    function showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'input-error';
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        
        input.style.borderColor = 'var(--danger-color)';
        formGroup.appendChild(errorDiv);
        
        input.addEventListener('input', function() {
            errorDiv.remove();
            this.style.borderColor = '';
        }, { once: true });
    }
    
    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (linkPage.includes('#') && window.location.hash === linkPage)) {
            link.classList.add('active');
        }
    });
    
    // Admin navigation functionality
    const adminNavItems = document.querySelectorAll('.nav-item[data-section]');
    const adminSections = document.querySelectorAll('.admin-section');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (adminNavItems.length > 0) {
        adminNavItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all
                adminNavItems.forEach(nav => nav.classList.remove('active'));
                adminSections.forEach(section => section.classList.remove('active'));
                
                // Add active class to clicked
                this.classList.add('active');
                const sectionId = this.getAttribute('data-section');
                const targetSection = document.getElementById(sectionId);
                
                if (targetSection) {
                    targetSection.classList.add('active');
                    sectionTitle.textContent = this.textContent.trim();
                }
            });
        });
    }
});