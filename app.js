// app.js - Core functions for top bar, popups, navigation, and settings

// ============ TOP BAR & POPUP FUNCTIONS ============

// Initialize top bar and all popups
function initTopBar() {
    console.log('Initializing top bar...');
    
    // Get elements
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const homeBtn = document.getElementById('homeBtn');
    const leftPopup = document.getElementById('leftPopup');
    const rightPopup = document.getElementById('rightPopup');
    const overlay = document.getElementById('popupOverlay');
    const closeLeftBtn = document.getElementById('closeLeftPopup');
    const closeRightBtn = document.getElementById('closeRightPopup');

    if (!hamburgerBtn || !settingsBtn || !homeBtn) {
        console.log('Top bar elements not found');
        return;
    }

    // Open left popup (hamburger menu)
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Hamburger clicked');
            openLeftPopup();
        });
    }

    // Open right popup (settings)
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Settings clicked');
            openRightPopup();
        });
    }

    // Home button - navigate to index.html
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Close buttons
    if (closeLeftBtn) {
        closeLeftBtn.addEventListener('click', () => {
            closeLeftPopup();
        });
    }

    if (closeRightBtn) {
        closeRightBtn.addEventListener('click', () => {
            closeRightPopup();
        });
    }

    // Close popups when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeLeftPopup();
            closeRightPopup();
        });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLeftPopup();
            closeRightPopup();
        }
    });
    
    console.log('Top bar initialized');
}

// Open left popup
function openLeftPopup() {
    const leftPopup = document.getElementById('leftPopup');
    const overlay = document.getElementById('popupOverlay');
    if (leftPopup) {
        leftPopup.classList.add('open');
        if (overlay) overlay.classList.add('active');
        highlightCurrentPage();
    }
}

// Close left popup
function closeLeftPopup() {
    const leftPopup = document.getElementById('leftPopup');
    const overlay = document.getElementById('popupOverlay');
    if (leftPopup) {
        leftPopup.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Open right popup
function openRightPopup() {
    const rightPopup = document.getElementById('rightPopup');
    const overlay = document.getElementById('popupOverlay');
    if (rightPopup) {
        rightPopup.classList.add('open');
        if (overlay) overlay.classList.add('active');
        updateThemeOptionsUI();
    }
}

// Close right popup
function closeRightPopup() {
    const rightPopup = document.getElementById('rightPopup');
    const overlay = document.getElementById('popupOverlay');
    if (rightPopup) {
        rightPopup.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Highlight current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============ SETTINGS FUNCTIONS ============

// Update theme options UI to show current theme
function updateThemeOptionsUI() {
    const savedTheme = localStorage.getItem('seriesTracker_theme');
    let currentTheme = 'default';
    
    if (savedTheme === 'light') {
        currentTheme = 'light';
    } else if (savedTheme === 'dark') {
        currentTheme = 'dark';
    }
    
    const themeOptions = document.querySelectorAll('.theme-option');
    
    themeOptions.forEach(option => {
        const themeValue = option.getAttribute('data-theme');
        if (themeValue === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Initialize settings panel
function initSettingsPanel() {
    const themeOptions = document.querySelectorAll('.theme-option');
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const clearAllBtn = document.getElementById('clearAllDataBtn');

    // Theme options
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const themeValue = option.getAttribute('data-theme');
            changeTheme(themeValue);
        });
    });

    // Export data
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (typeof exportAllCategories === 'function') {
                exportAllCategories();
            } else {
                showNotification('Export function not available on this page', 'error');
            }
            closeRightPopup();
        });
    }

    // Import data
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (typeof importData === 'function') {
                importData();
            } else {
                showNotification('Import function not available on this page', 'error');
            }
            closeRightPopup();
        });
    }

    // Clear all data
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showClearAllDataConfirm();
            closeRightPopup();
        });
    }
}

// Change theme function
function changeTheme(themeValue) {
    let themeName;
    
    if (themeValue === 'default') {
        localStorage.removeItem('seriesTracker_theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        themeName = systemTheme;
        if (typeof applyTheme === 'function') {
            applyTheme(themeName);
        }
    } else if (themeValue === 'light') {
        localStorage.setItem('seriesTracker_theme', 'light');
        themeName = 'light';
        if (typeof applyTheme === 'function') {
            applyTheme('light');
        }
    } else if (themeValue === 'dark') {
        localStorage.setItem('seriesTracker_theme', 'dark');
        themeName = 'dark';
        if (typeof applyTheme === 'function') {
            applyTheme('dark');
        }
    }
    
    updateThemeOptionsUI();
    showNotification(`Theme changed to ${themeValue} mode`, 'success');
}

// Show clear all data confirmation
function showClearAllDataConfirm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Clear All Data</h3>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete ALL your data?</p>
                <p class="warning-text">This action cannot be undone!</p>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel-btn" id="cancelClearBtn"><i class="fas fa-times"></i> Cancel</button>
                <button class="modal-btn confirm-btn" id="confirmClearBtn"><i class="fas fa-trash-alt"></i> Clear All</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancelClearBtn').onclick = () => {
        modal.remove();
    };
    
    document.getElementById('confirmClearBtn').onclick = () => {
        if (typeof resetAllData === 'function') {
            resetAllData();
        } else {
            const defaultCategories = {
                'Watching': [], 'Completed': [], 'Plan to Watch': [],
                'On Hold': [], 'Dropped': [], 'Favorites': [], 'Wishlist': []
            };
            localStorage.setItem('seriesTracker_categoryData', JSON.stringify(defaultCategories));
            showNotification('All data cleared! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
        modal.remove();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// ============ NOTIFICATION FUNCTION ============

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============ LOAD TOP BAR ON ALL PAGES ============

function loadTopBar() {
    // Check if top bar already exists
    if (document.querySelector('.top-bar')) return;
    
    const topBarHTML = `
        <!-- Sticky Top Bar -->
        <div class="top-bar">
            <button class="hamburger-menu" id="hamburgerBtn">
                <i class="fas fa-bars"></i>
            </button>
            <div class="logo-area" id="homeBtn">
                <i class="fas fa-tv"></i>
                <span class="logo-text">Series Tracker</span>
            </div>
            <button class="settings-btn" id="settingsBtn">
                <i class="fas fa-cog"></i>
            </button>
        </div>

        <!-- Left Navigation Popup -->
        <div class="side-popup left-popup" id="leftPopup">
            <div class="popup-header">
                <h3><i class="fas fa-bars"></i> Menu</h3>
                <button class="close-popup" id="closeLeftPopup">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <nav class="nav-links">
                <a href="index.html" class="nav-link">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </a>
                <a href="add.html" class="nav-link">
                    <i class="fas fa-plus-circle"></i>
                    <span>Add New</span>
                </a>
                <a href="remove.html" class="nav-link">
                    <i class="fas fa-trash-alt"></i>
                    <span>Remove</span>
                </a>
                <a href="favorites.html" class="nav-link">
                    <i class="fas fa-star"></i>
                    <span>Favorites</span>
                </a>
                <a href="wishlist.html" class="nav-link">
                    <i class="fas fa-bookmark"></i>
                    <span>Wishlist</span>
                </a>
                <a href="profile.html" class="nav-link">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </a>
            </nav>
        </div>

        <!-- Right Settings Popup -->
        <div class="side-popup right-popup" id="rightPopup">
            <div class="popup-header">
                <h3><i class="fas fa-cog"></i> Settings</h3>
                <button class="close-popup" id="closeRightPopup">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <h4><i class="fas fa-palette"></i> Theme</h4>
                    <div class="theme-options">
                        <button class="theme-option" data-theme="default">
                            <i class="fas fa-adjust"></i> Default
                        </button>
                        <button class="theme-option" data-theme="light">
                            <i class="fas fa-sun"></i> Light
                        </button>
                        <button class="theme-option" data-theme="dark">
                            <i class="fas fa-moon"></i> Dark
                        </button>
                    </div>
                </div>
                <div class="settings-section">
                    <h4><i class="fas fa-database"></i> Data Management</h4>
                    <button class="settings-action-btn" id="exportDataBtn">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    <button class="settings-action-btn" id="importDataBtn">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                    <button class="settings-action-btn danger" id="clearAllDataBtn">
                        <i class="fas fa-trash-alt"></i> Clear All Data
                    </button>
                </div>
                <div class="settings-section">
                    <h4><i class="fas fa-info-circle"></i> About</h4>
                    <p>Series Tracker v1.0.0</p>
                    <p>Track your series, anime, movies, books, manga, and more!</p>
                </div>
            </div>
        </div>

        <!-- Overlay -->
        <div class="popup-overlay" id="popupOverlay"></div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', topBarHTML);
    document.body.style.paddingTop = '70px';
    
    initTopBar();
    initSettingsPanel();
}

// ============ TELEGRAM WEB APP INITIALIZATION ============

function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        // Don't enable closing confirmation to avoid the warning
        // tg.enableClosingConfirmation();
        
        // Set header color to blue
        tg.setHeaderColor('#2563EB');
        tg.setBackgroundColor('#ffffff');
    }
}

// ============ PAGE INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
    loadTopBar();
    initTelegramWebApp();
    if (typeof initTheme === 'function') {
        initTheme();
    }
});

// Add modal styles dynamically
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    
    .modal-content {
        background: var(--bg-primary);
        border-radius: 16px;
        width: 90%;
        max-width: 400px;
        overflow: hidden;
        animation: modalSlideIn 0.3s ease;
    }
    
    @keyframes modalSlideIn {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .modal-header {
        padding: 20px;
        background: var(--danger-color);
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .modal-header i {
        font-size: 1.5rem;
        color: white !important;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: white;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-body p {
        margin-bottom: 10px;
        color: var(--text-primary);
    }
    
    .warning-text {
        color: var(--danger-color);
        font-weight: bold;
    }
    
    .modal-buttons {
        display: flex;
        gap: 10px;
        padding: 0 20px 20px 20px;
    }
    
    .modal-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .cancel-btn {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .confirm-btn {
        background: var(--danger-color);
        color: white;
    }
    
    .confirm-btn i {
        color: white !important;
    }
`;
document.head.appendChild(modalStyles);