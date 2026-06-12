// favorites.js - Favorites Page Functionality

// ============ GLOBAL VARIABLES ============
let allFavorites = [];
let currentCategoryFilter = 'all';

// ============ GREETING AND CLOCK ============
function updateGreetingAndClock() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    
    if (hours < 12) greeting = 'Morning';
    else if (hours < 17) greeting = 'Afternoon';
    else if (hours < 20) greeting = 'Evening';
    else greeting = 'Night';
    
    const greetingElement = document.getElementById('greetingText');
    if (greetingElement) {
        greetingElement.textContent = `Good ${greeting}, Guest!`;
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        clockElement.textContent = `${dateStr} | ${timeStr}`;
    }
}

// ============ OPENING ANIMATION ============
function showOpeningAnimation() {
    const animation = document.getElementById('openingAnimation');
    if (animation && !sessionStorage.getItem('favoritesAnimationShown')) {
        animation.style.display = 'flex';
        setTimeout(() => {
            animation.style.display = 'none';
            sessionStorage.setItem('favoritesAnimationShown', 'true');
        }, 2500);
    } else if (animation) {
        animation.style.display = 'none';
    }
}

// ============ CATEGORY COLORS ============
function getCategoryColor(categoryName) {
    const colors = JSON.parse(localStorage.getItem('category_colors') || '{}');
    if (colors[categoryName]) return colors[categoryName];
    return '#2563EB';
}

function getStatusColor(status) {
    const colors = {
        'Watching': '#2563EB',
        'Plan to Watch': '#F59E0B',
        'On Hold': '#8B5CF6',
        'Dropped': '#EF4444',
        'Completed': '#10B981'
    };
    return colors[status] || '#6B7280';
}

// ============ LOAD FAVORITES ============
function loadFavorites() {
    const favorites = getCategoryData('Favorites');
    console.log('=== FAVORITES PAGE DEBUG ===');
    console.log('Raw favorites from storage:', favorites);
    console.log('Number of favorites:', favorites.length);
    
    const favoritesWithInfo = favorites.map(fav => {
        let originalCategory = fav.originalCategory || fav.category;
        
        if (!originalCategory || originalCategory === 'Unknown') {
            const allData = getAllCategoryData();
            for (const category in allData) {
                const found = allData[category].find(item => item.id === fav.id);
                if (found) {
                    originalCategory = category;
                    break;
                }
            }
        }
        
        if (!originalCategory) {
            originalCategory = 'Uncategorized';
        }
        
        return {
            ...fav,
            originalCategory: originalCategory
        };
    });
    
    console.log('Favorites with categories:', favoritesWithInfo);
    console.log('================================');
    return favoritesWithInfo;
}

// ============ GET CATEGORY STATS ============
function getFavoriteCategoryStats() {
    const stats = new Map();
    
    allFavorites.forEach(fav => {
        const category = fav.originalCategory || fav.category || 'Uncategorized';
        stats.set(category, (stats.get(category) || 0) + 1);
    });
    
    return stats;
}

// ============ FILTER FUNCTIONS ============
function filterFavorites() {
    let filtered = [...allFavorites];
    
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(fav => {
            const category = fav.originalCategory || fav.category || 'Uncategorized';
            return category === currentCategoryFilter;
        });
    }
    
    return filtered;
}

// ============ RENDER FUNCTIONS ============
function renderCategoryFilters() {
    const stats = getFavoriteCategoryStats();
    const categories = ['all', ...Array.from(stats.keys()).sort()];
    const container = document.getElementById('categoryFilters');
    
    if (!container) return;
    
    if (allFavorites.length === 0) {
        container.innerHTML = `
            <button class="filter-chip active" data-category="all">
                <i class="fas fa-star"></i> All (0)
            </button>
        `;
        return;
    }
    
    container.innerHTML = categories.map(category => {
        const count = category === 'all' ? allFavorites.length : stats.get(category);
        const isActive = currentCategoryFilter === category;
        
        return `
            <button class="filter-chip ${isActive ? 'active' : ''}" data-category="${category}">
                <i class="fas ${category === 'all' ? 'fa-star' : 'fa-folder'}"></i>
                ${category === 'all' ? 'All' : category} (${count})
            </button>
        `;
    }).join('');
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            currentCategoryFilter = chip.dataset.category;
            renderCategoryFilters();
            renderFavoritesGrid();
        });
    });
}

function renderFavoritesGrid() {
    const filteredFavorites = filterFavorites();
    const grid = document.getElementById('favoritesGrid');
    const countSpan = document.getElementById('favoritesCount');
    
    if (countSpan) {
        countSpan.textContent = allFavorites.length;
    }
    
    if (!grid) return;
    
    if (allFavorites.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No favorites yet</p>
                <p class="empty-hint">Add items to favorites from the Add page or by clicking the star on any card</p>
            </div>
        `;
        return;
    }
    
    if (filteredFavorites.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <p>No favorites in this category</p>
                <p class="empty-hint">Try changing the category filter</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredFavorites.map(fav => {
        const categoryName = fav.originalCategory || fav.category || 'Uncategorized';
        const categoryColor = getCategoryColor(categoryName);
        const statusColor = getStatusColor(fav.status);
        
        return `
            <div class="favorite-card" data-id="${fav.id}">
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(fav.title)}</h3>
                    <div>
                        <span class="category-badge" style="background: ${categoryColor}; color: white;">${categoryName}</span>
                        <span class="status-badge" style="background: ${statusColor}; color: white;">${fav.status}</span>
                    </div>
                </div>
                <div class="card-details">
                    ${fav.progress ? `<span class="detail-capsule"><i class="fas fa-chart-line"></i> ${escapeHtml(fav.progress)}</span>` : ''}
                    ${fav.season ? `<span class="detail-capsule"><i class="fas fa-layer-group"></i> ${escapeHtml(fav.season)}</span>` : ''}
                    ${fav.notes ? `<span class="detail-capsule"><i class="fas fa-pen"></i> ${escapeHtml(fav.notes.substring(0, 30))}${fav.notes.length > 30 ? '...' : ''}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn view" onclick="viewItem(${fav.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="card-action-btn remove-fav" onclick="removeFromFavorites(${fav.id})">
                        <i class="fas fa-star"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ ACTION FUNCTIONS ============
function viewItem(id) {
    let itemToView = null;
    let sourceCategory = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) {
            itemToView = found;
            sourceCategory = category;
            break;
        }
    }
    
    if (itemToView) {
        showItemDetailsModal(itemToView, sourceCategory);
    } else {
        const favItem = allFavorites.find(f => f.id === id);
        if (favItem) {
            showItemDetailsModal(favItem, favItem.originalCategory);
        }
    }
}

function showItemDetailsModal(item, category) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <i class="fas fa-info-circle"></i>
                <h3>${escapeHtml(item.title)}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${category || item.category || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${item.status}</span>
                </div>
                ${item.progress ? `
                    <div class="detail-row">
                        <span class="detail-label">Progress:</span>
                        <span class="detail-value">${escapeHtml(item.progress)}</span>
                    </div>
                ` : ''}
                ${item.season ? `
                    <div class="detail-row">
                        <span class="detail-label">Season:</span>
                        <span class="detail-value">${escapeHtml(item.season)}</span>
                    </div>
                ` : ''}
                ${item.notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${escapeHtml(item.notes)}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Added:</span>
                    <span class="detail-value">${new Date(item.dateAdded).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel-btn" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function removeFromFavorites(id) {
    const favorites = getCategoryData('Favorites');
    const itemToRemove = favorites.find(item => item.id === id);
    
    if (itemToRemove && confirm(`Remove "${itemToRemove.title}" from favorites?`)) {
        const newFavorites = favorites.filter(item => item.id !== id);
        saveCategoryData('Favorites', newFavorites);
        
        allFavorites = loadFavorites();
        renderCategoryFilters();
        renderFavoritesGrid();
        
        showToast(`Removed "${itemToRemove.title}" from favorites`, 'success');
    }
}

// ============ FOOTER BAR ============
function initFooterBar() {
    const footer = document.getElementById('footerBar');
    if (!footer) return;
    
    let lastScrollTop = 0;
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop < lastScrollTop && scrollTop > 50) {
            footer.classList.add('visible');
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                footer.classList.remove('visible');
            }, 3000);
        } else if (scrollTop === 0) {
            footer.classList.remove('visible');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

// ============ NAVIGATION ============
function initNavigation() {
    const backBtn = document.getElementById('backBtn');
    const profileNavBtn = document.getElementById('profileNavBtn');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (profileNavBtn) {
        profileNavBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ============ HELPER FUNCTIONS ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ INITIALIZATION ============
function initFavoritesPage() {
    showOpeningAnimation();
    
    allFavorites = loadFavorites();
    
    updateGreetingAndClock();
    renderCategoryFilters();
    renderFavoritesGrid();
    initFooterBar();
    initNavigation();
    
    setInterval(updateGreetingAndClock, 1000);
}
// ============ LOAD USER PROFILE FOR GREETING ============
function loadUserProfileForGreeting() {
    const savedName = localStorage.getItem('profile_userName');
    const savedImage = localStorage.getItem('profile_image_permanent');
    const savedAvatarColor = localStorage.getItem('profile_avatarColor') || '2563EB';
    
    // Update username
    const userNameElement = document.getElementById('greetingUserName');
    if (userNameElement) {
        userNameElement.textContent = savedName || 'Guest User';
    }
    
    // Update avatar image
    const avatarImg = document.getElementById('greetingAvatar');
    if (avatarImg) {
        if (savedImage) {
            avatarImg.src = savedImage;
        } else {
            const userName = savedName || 'User';
            avatarImg.src = `https://ui-avatars.com/api/?background=${savedAvatarColor}&color=fff&bold=true&size=80&name=${encodeURIComponent(userName)}`;
        }
    }
}

// Update greeting text based on time
function updateGreetingText() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    
    if (hours < 12) greeting = 'Good Morning!';
    else if (hours < 17) greeting = 'Good Afternoon!';
    else if (hours < 20) greeting = 'Good Evening!';
    else greeting = 'Good Night!';
    
    const greetingElement = document.getElementById('greetingText');
    if (greetingElement) {
        greetingElement.textContent = greeting;  // Removed ", Guest!"
    }
}

// Update live clock
function updateLiveClock() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        clockElement.textContent = `${dateStr} | ${timeStr}`;
    }
}

// Initialize greeting
function initGreeting() {
    loadUserProfileForGreeting();
    updateGreetingText();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
}

// Make functions global for onclick handlers
window.viewItem = viewItem;
window.removeFromFavorites = removeFromFavorites;

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', initFavoritesPage);
document.addEventListener('DOMContentLoaded', initGreeting);