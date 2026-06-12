// index.js - Dashboard Functionality

// ============ GLOBAL VARIABLES ============
let allSeries = [];
let currentFilters = {
    category: 'all',
    status: 'all',
    sort: 'recent'
};
let currentSearchTerm = '';
let scrollTimeout = null;

// Category colors
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

function getPriorityIcon(priority) {
    if (priority === 'High') return '🔴';
    if (priority === 'Medium') return '🟡';
    return '🟢';
}

// Get items by status (scan all categories)
function getItemsByStatus(targetStatus) {
    const allData = getAllCategoryData();
    const items = [];
    const seenIds = new Set();
    
    // First, check the dedicated status category
    const statusCategory = allData[targetStatus];
    if (statusCategory) {
        statusCategory.forEach(item => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                items.push(item);
            }
        });
    }
    
    // Then check all real categories for items with matching status
    const excludeCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    for (const category in allData) {
        if (!excludeCategories.includes(category)) {
            allData[category].forEach(item => {
                if (item.status === targetStatus && !seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    items.push(item);
                }
            });
        }
    }
    
    return items;
}

// ============ LOADING ANIMATION ============
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay && !sessionStorage.getItem('hasLoadedBefore')) {
        loadingOverlay.classList.remove('hide');
        setTimeout(() => {
            loadingOverlay.classList.add('hide');
            sessionStorage.setItem('hasLoadedBefore', 'true');
        }, 2000);
    } else if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

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

// ============ STATS FUNCTIONS ============
function updateQuickStats() {
    // Get correct counts by scanning all items
    const watching = getItemsByStatus('Watching').length;
    const completed = getItemsByStatus('Completed').length;
    const favorites = getCategoryData('Favorites').length;
    
    const watchingCount = document.getElementById('watchingCount');
    const completedCount = document.getElementById('completedCount');
    const favoritesCount = document.getElementById('favoritesCount');
    
    if (watchingCount) watchingCount.textContent = watching;
    if (completedCount) completedCount.textContent = completed;
    if (favoritesCount) favoritesCount.textContent = favorites;
    
    console.log('Quick Stats - Watching:', watching, 'Completed:', completed, 'Favorites:', favorites);
}

// ============ LOAD ALL SERIES (NO DUPLICATES) ============
function loadAllSeries() {
    const allData = getAllCategoryData();
    const seriesList = [];
    const seenIds = new Set();
    
    for (const [category, items] of Object.entries(allData)) {
        items.forEach(item => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                seriesList.push({
                    ...item,
                    category: category,
                    originalCategory: category,
                    lastEdited: item.lastEdited || item.dateAdded || new Date().toISOString()
                });
            }
        });
    }
    
    return seriesList;
}

// Get real categories (not statuses)
function getRealCategories() {
    const allData = getAllCategoryData();
    const statusCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    return Object.keys(allData).filter(cat => !statusCategories.includes(cat));
}

// Get count for a category
function getCategoryCount(categoryName) {
    return getCategoryData(categoryName).length;
}

// Get count for a status
function getStatusCount(statusName) {
    return getItemsByStatus(statusName).length;
}

// ============ FILTER AND SORT FUNCTIONS ============
function filterSeries() {
    let filtered = [...allSeries];
    
    if (currentFilters.category !== 'all') {
        filtered = filtered.filter(series => series.category === currentFilters.category);
    }
    
    if (currentFilters.status !== 'all') {
        filtered = filtered.filter(series => series.status === currentFilters.status);
    }
    
    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(series => 
            series.title.toLowerCase().includes(term)
        );
    }
    
    switch (currentFilters.sort) {
        case 'az':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'za':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'recent':
            filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'updated':
            filtered.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
            break;
        default:
            filtered.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    }
    
    return filtered;
}

function renderSeriesCards() {
    const filteredSeries = filterSeries();
    const grid = document.getElementById('seriesGrid');
    
    if (!grid) return;
    
    if (filteredSeries.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tv"></i>
                <p>No series found</p>
                <p class="empty-hint">Try changing your filters or add a new series</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredSeries.map(series => {
        const isFavorite = getCategoryData('Favorites').some(fav => fav.id === series.id);
        const categoryColor = getCategoryColor(series.category);
        const statusColor = getStatusColor(series.status);
        const isCompleted = series.status === 'Completed';
        
        return `
            <div class="series-card" data-id="${series.id}" data-original-status="${series.originalStatus || series.status}">
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(series.title)}</h3>
                    <div>
                        <span class="category-badge" style="background: ${categoryColor}; color: white;">${series.category}</span>
                        <span class="status-badge" style="background: ${statusColor}; color: white;">${series.status} ${series.priority ? `<span class="priority-badge">${getPriorityIcon(series.priority)} ${series.priority}</span>` : ''}</span>
                    </div>
                </div>
                <div class="card-details">
                    ${series.progress ? `<span class="detail-capsule"><i class="fas fa-chart-line"></i> ${escapeHtml(series.progress)}</span>` : ''}
                    ${series.season ? `<span class="detail-capsule"><i class="fas fa-layer-group"></i> ${escapeHtml(series.season)}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn edit" onclick="editItem(${series.id})"><i class="fas fa-pencil-alt"></i> Edit</button>
                    <button class="card-action-btn favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavoriteFromCard(${series.id})"><i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i> Fav</button>
                    <button class="card-action-btn complete" onclick="toggleCompleteStatus(${series.id})"><i class="fas fa-check"></i> ${isCompleted ? 'Completed' : 'Complete'}</button>
                    <button class="card-action-btn delete" onclick="deleteItemFromCard(${series.id})"><i class="fas fa-trash-alt"></i> Del</button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ NAVIGATION BUTTONS ============
function initNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-page-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'add') window.location.href = 'add.html';
            else if (page === 'remove') window.location.href = 'remove.html';
            else if (page === 'favorites') window.location.href = 'favorites.html';
            else if (page === 'wishlist') window.location.href = 'wishlist.html';
            else if (page === 'profile') window.location.href = 'profile.html';
        });
    });
}

// ============ EDIT MODAL FUNCTIONS ============
function openEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function editItem(id) {
    let itemToEdit = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) {
            itemToEdit = found;
            break;
        }
    }
    
    if (itemToEdit) {
        document.getElementById('editId').value = itemToEdit.id;
        document.getElementById('editTitle').value = itemToEdit.title;
        
        const categories = getRealCategories();
        const categorySelect = document.getElementById('editCategory');
        categorySelect.innerHTML = categories.map(cat => 
            `<option value="${cat}" ${cat === itemToEdit.category ? 'selected' : ''}>${cat}</option>`
        ).join('');
        
        document.getElementById('editStatus').value = itemToEdit.status;
        document.getElementById('editProgress').value = itemToEdit.progress || '';
        document.getElementById('editSeason').value = itemToEdit.season || '';
        document.getElementById('editNotes').value = itemToEdit.notes || '';
        
        const editPriorityGroup = document.getElementById('editPriorityGroup');
        if (itemToEdit.status === 'Plan to Watch') {
            editPriorityGroup.style.display = 'block';
            document.getElementById('editPriority').value = itemToEdit.priority || 'Medium';
        } else {
            editPriorityGroup.style.display = 'none';
        }
        
        openEditModal();
    }
}

function saveEditChanges() {
    const editId = parseInt(document.getElementById('editId').value);
    const editTitle = document.getElementById('editTitle').value.trim();
    const editCategory = document.getElementById('editCategory').value;
    const editStatus = document.getElementById('editStatus').value;
    const editPriority = document.getElementById('editPriority')?.value;
    const editProgress = document.getElementById('editProgress').value;
    const editSeason = document.getElementById('editSeason').value;
    const editNotes = document.getElementById('editNotes').value;
    
    if (!editTitle) {
        showNotification('Title is required!', 'error');
        return;
    }
    
    let oldCategory = null;
    let itemToUpdate = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === editId);
        if (found) {
            oldCategory = category;
            itemToUpdate = found;
            break;
        }
    }
    
    if (itemToUpdate) {
        removeFromCategory(oldCategory, editId);
        
        itemToUpdate.title = editTitle;
        itemToUpdate.category = editCategory;
        itemToUpdate.status = editStatus;
        itemToUpdate.originalStatus = editStatus;
        itemToUpdate.priority = editStatus === 'Plan to Watch' ? editPriority : null;
        itemToUpdate.progress = editProgress || null;
        itemToUpdate.season = editSeason || null;
        itemToUpdate.notes = editNotes || null;
        itemToUpdate.lastEdited = new Date().toISOString();
        
        addToCategory(editCategory, itemToUpdate);
        
        const favorites = getCategoryData('Favorites');
        const favIndex = favorites.findIndex(fav => fav.id === editId);
        if (favIndex !== -1) {
            favorites[favIndex] = {
                ...favorites[favIndex],
                title: editTitle,
                status: editStatus,
                priority: editStatus === 'Plan to Watch' ? editPriority : null,
                progress: editProgress || null,
                season: editSeason || null,
                notes: editNotes || null,
                lastEdited: new Date().toISOString(),
                originalCategory: favorites[favIndex].originalCategory || editCategory,
                category: favorites[favIndex].originalCategory || editCategory
            };
            saveCategoryData('Favorites', favorites);
        }
        
        showNotification('Item updated!', 'success');
        closeEditModal();
        
        allSeries = loadAllSeries();
        renderSeriesCards();
        updateQuickStats();
    }
}

// ============ CARD ACTIONS ============
function toggleFavoriteFromCard(id) {
    const favorites = getCategoryData('Favorites');
    const exists = favorites.some(fav => fav.id === id);
    
    let seriesToToggle = null;
    let sourceCategory = null;
    const allData = getAllCategoryData();
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) {
            seriesToToggle = found;
            sourceCategory = category;
            break;
        }
    }
    
    if (seriesToToggle) {
        if (exists) {
            const newFavorites = favorites.filter(fav => fav.id !== id);
            saveCategoryData('Favorites', newFavorites);
            showNotification('Removed from favorites', 'info');
        } else {
            const favoriteItem = {
                ...seriesToToggle,
                originalCategory: sourceCategory,
                category: sourceCategory
            };
            favorites.push(favoriteItem);
            saveCategoryData('Favorites', favorites);
            showNotification('Added to favorites!', 'success');
        }
        renderSeriesCards();
        updateQuickStats();
    }
}

function toggleCompleteStatus(id) {
    let itemToToggle = null;
    let sourceCategory = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) {
            itemToToggle = found;
            sourceCategory = category;
            break;
        }
    }
    
    if (itemToToggle) {
        const originalStatus = itemToToggle.originalStatus || itemToToggle.status;
        
        if (itemToToggle.status === 'Completed') {
            removeFromCategory(sourceCategory, id);
            itemToToggle.status = originalStatus;
            itemToToggle.lastEdited = new Date().toISOString();
            addToCategory(originalStatus, itemToToggle);
            showNotification(`"${itemToToggle.title}" reverted to ${originalStatus}!`, 'success');
        } else {
            removeFromCategory(sourceCategory, id);
            itemToToggle.status = 'Completed';
            itemToToggle.lastEdited = new Date().toISOString();
            addToCategory('Completed', itemToToggle);
            showNotification(`"${itemToToggle.title}" marked as completed!`, 'success');
        }
        
        const favorites = getCategoryData('Favorites');
        const favIndex = favorites.findIndex(fav => fav.id === id);
        if (favIndex !== -1) {
            favorites[favIndex] = {
                ...favorites[favIndex],
                status: itemToToggle.status,
                lastEdited: new Date().toISOString()
            };
            saveCategoryData('Favorites', favorites);
        }
        
        allSeries = loadAllSeries();
        renderSeriesCards();
        updateQuickStats();
    }
}

function deleteItemFromCard(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        let deleted = false;
        const allData = getAllCategoryData();
        
        for (const category in allData) {
            if (allData[category].find(item => item.id === id)) {
                removeFromCategory(category, id);
                deleted = true;
                break;
            }
        }
        
        if (deleted) {
            const favorites = getCategoryData('Favorites');
            if (favorites.some(fav => fav.id === id)) {
                const newFavorites = favorites.filter(fav => fav.id !== id);
                saveCategoryData('Favorites', newFavorites);
            }
            
            showNotification('Item deleted!', 'success');
            allSeries = loadAllSeries();
            renderSeriesCards();
            updateQuickStats();
        }
    }
}

// ============ FILTER UI ============
function initializeFilters() {
    // Get real categories (not statuses)
    const realCategories = getRealCategories();
    const categoryContainer = document.getElementById('categoryFilters');
    const statusContainer = document.getElementById('statusFilters');
    const sortContainer = document.getElementById('sortFilters');
    
    // Category filters - ONLY real categories with counts
    if (categoryContainer) {
        const categoryChips = [
            { value: 'all', label: 'All Categories', icon: 'fa-tag', count: allSeries.length }
        ];
        
        realCategories.forEach(cat => {
            const count = getCategoryCount(cat);
            categoryChips.push({ 
                value: cat, 
                label: cat, 
                icon: 'fa-folder',
                count: count
            });
        });
        
        categoryContainer.innerHTML = categoryChips.map(chip => `
            <button class="filter-chip ${currentFilters.category === chip.value ? 'active' : ''}" 
                    data-filter="category" data-value="${chip.value}">
                <i class="fas ${chip.icon}"></i> ${chip.label} (${chip.count})
            </button>
        `).join('');
    }
    
    // Status filters with counts
    if (statusContainer) {
        const statusChips = [
            { value: 'all', label: 'All Status', icon: 'fa-list', count: allSeries.length }
        ];
        
        const statusList = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed'];
        statusList.forEach(status => {
            const count = getStatusCount(status);
            statusChips.push({
                value: status,
                label: status,
                icon: status === 'Watching' ? 'fa-eye' : 
                      status === 'Plan to Watch' ? 'fa-calendar' :
                      status === 'On Hold' ? 'fa-pause' :
                      status === 'Dropped' ? 'fa-ban' : 'fa-check-circle',
                count: count
            });
        });
        
        statusContainer.innerHTML = statusChips.map(chip => `
            <button class="filter-chip ${currentFilters.status === chip.value ? 'active' : ''}" 
                    data-filter="status" data-value="${chip.value}">
                <i class="fas ${chip.icon}"></i> ${chip.label} (${chip.count})
            </button>
        `).join('');
    }
    
    // Sort filters
    if (sortContainer) {
        const sortChips = [
            { value: 'az', label: 'A-Z', icon: 'fa-sort-alpha-down' },
            { value: 'za', label: 'Z-A', icon: 'fa-sort-alpha-up' },
            { value: 'recent', label: 'Recent Added', icon: 'fa-clock' },
            { value: 'updated', label: 'Recent Updated', icon: 'fa-sync' }
        ];
        
        sortContainer.innerHTML = sortChips.map(chip => `
            <button class="filter-chip ${currentFilters.sort === chip.value ? 'active' : ''}" 
                    data-filter="sort" data-value="${chip.value}">
                <i class="fas ${chip.icon}"></i> ${chip.label}
            </button>
        `).join('');
    }
    
    // Add event listeners
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const filterType = chip.dataset.filter;
            const value = chip.dataset.value;
            
            if (filterType === 'category') {
                currentFilters.category = value;
            } else if (filterType === 'status') {
                currentFilters.status = value;
            } else if (filterType === 'sort') {
                currentFilters.sort = value;
            }
            
            document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach(c => {
                c.classList.remove('active');
            });
            chip.classList.add('active');
            
            renderSeriesCards();
        });
    });
}

// ============ SEARCH FUNCTIONALITY ============
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            if (clearBtn) {
                clearBtn.classList.toggle('visible', currentSearchTerm.length > 0);
            }
            renderSeriesCards();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                currentSearchTerm = '';
                clearBtn.classList.remove('visible');
                renderSeriesCards();
            }
        });
    }
}

// ============ FOOTER BAR ============
function initFooterBar() {
    const footer = document.getElementById('footerBar');
    if (!footer) return;
    
    let lastScrollTop = 0;
    
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

// ============ HELPER FUNCTIONS ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    notification.innerHTML = `<i class="fas ${icon}"></i> ${escapeHtml(message)}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ============ INITIALIZATION ============
function initDashboard() {
    allSeries = loadAllSeries();
    updateGreetingAndClock();
    updateQuickStats();
    initializeFilters();
    initializeSearch();
    renderSeriesCards();
    initFooterBar();
    initNavigationButtons();
    setInterval(updateGreetingAndClock, 1000);
}
// ============ LOAD USER PROFILE FOR GREETING ============
// Add these functions to your existing index.js

function loadUserProfileForGreeting() {
    const savedName = localStorage.getItem('profile_userName');
    const savedImage = localStorage.getItem('profile_image_permanent');
    const savedAvatarColor = localStorage.getItem('profile_avatarColor') || '2563EB';
    
    const userNameElement = document.getElementById('greetingUserName');
    if (userNameElement) {
        userNameElement.textContent = savedName || 'Guest User';
    }
    
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

function initGreeting() {
    loadUserProfileForGreeting();
    updateGreetingText();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
    const confirmEditBtn = document.getElementById('confirmEditBtn');
    if (confirmEditBtn) {
        confirmEditBtn.addEventListener('click', saveEditChanges);
    }
    
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }

    showLoading();
    initDashboard();
    initGreeting(); // Add this line


});