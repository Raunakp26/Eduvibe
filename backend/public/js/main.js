// Utility Functions
const showAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.alert-container').appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
};

// File Upload Validation
const validateFileSize = (file, maxSize) => {
    if (file.size > maxSize) {
        showAlert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`, 'danger');
        return false;
    }
    return true;
};

// Form Validation
const validateForm = (form) => {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    return isValid;
};

// Course Search
const handleSearch = (event) => {
    event.preventDefault();
    const searchTerm = document.querySelector('#searchInput').value.trim();
    if (searchTerm) {
        window.location.href = `/courses?search=${encodeURIComponent(searchTerm)}`;
    }
};

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Search Form
    const searchForm = document.querySelector('#searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // File Upload Validation
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const maxSize = input.dataset.maxSize;
            if (file && maxSize) {
                if (!validateFileSize(file, parseInt(maxSize))) {
                    e.target.value = '';
                }
            }
        });
    });

    // Form Validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
                showAlert('Please fill in all required fields', 'danger');
            }
        });
    });

    // Auto-dismiss Alerts
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => alert.remove(), 5000);
    });
}); 