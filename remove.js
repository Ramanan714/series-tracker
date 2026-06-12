// remove.js - Remove Page Functionality

// ============ GLOBAL VARIABLES ============
let currentMode = 'series'; // 'series' or 'category'
let selectedItems = new Set();
let allSeries = [];
let allCategories = [];
let seriesFilters = {
    category: 'all',
    status: 'all',
    sort: 'recent'
};
let seriesSearchTerm = '';
let categorySearchTerm = '';

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

// ============ LOAD DATA ============
function loadSeriesData() {
    const allData = getAllCategoryData();
    const seriesList = [];
    const seenIds = new Set();
    
    // Status categories to exclude from series display
    const statusCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    
    for (const [category, items] of Object.entries(allData)) {
        // Skip status categories when loading series for delete mode
        if (statusCategories.includes(category)) continue;
        
        items.forEach(item => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                seriesList.push({
                    ...item,
                    category: category,
                    lastEdited: item.lastEdited || item.dateAdded || new Date().toISOString()
                });
            }
        });
    }
    return seriesList;
}

// Load ALL categories for deletion (including empty ones and pre-saved ones)
function loadAllCategories() {
    const allData = getAllCategoryData();
    const statusCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    
    // Get saved categories list from localStorage
    const savedCategories = JSON.parse(localStorage.getItem('categories_list') || '["Anime","Manga","Manwha","TV Series","Movie"]');
    
    // Combine categories from allData and savedCategories
    let allCategoryNames = new Set();
    
    // Add from allData (includes all categories that have data)
    Object.keys(allData).forEach(cat => {
        if (!statusCategories.includes(cat)) {
            allCategoryNames.add(cat);
        }
    });
    
    // Add from saved categories list
    savedCategories.forEach(cat => {
        if (!statusCategories.includes(cat)) {
            allCategoryNames.add(cat);
        }
    });
    
    // Convert Set to array and sort
    return Array.from(allCategoryNames).sort();
}

// Get ALL categories for filters (including status categories? No, only real categories)
function getAllRealCategoriesForFilters() {
    const allData = getAllCategoryData();
    const statusCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    
    // Return ALL real categories (not status)
    return Object.keys(allData).filter(cat => !statusCategories.includes(cat));
}

// Get count of items in a category
function getCategoryItemCount(categoryName) {
    return getCategoryData(categoryName).length;
}

// Get count of series in a category (for filter display)
function getSeriesCountInCategory(categoryName) {
    return getCategoryData(categoryName).length;
}

// ============ SERIES FUNCTIONS ============
function filterSeries() {
    let filtered = [...allSeries];
    
    if (seriesFilters.category !== 'all') {
        filtered = filtered.filter(series => series.category === seriesFilters.category);
    }
    
    if (seriesFilters.status !== 'all') {
        filtered = filtered.filter(series => series.status === seriesFilters.status);
    }
    
    if (seriesSearchTerm) {
        const term = seriesSearchTerm.toLowerCase();
        filtered = filtered.filter(series => series.title.toLowerCase().includes(term));
    }
    
    switch (seriesFilters.sort) {
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
        const isSelected = selectedItems.has(series.id.toString());
        const categoryColor = getCategoryColor(series.category);
        const statusColor = getStatusColor(series.status);
        
        return `
            <div class="item-card" data-id="${series.id}" data-type="series">
                <div class="card-info">
                    <h4 class="card-title">${escapeHtml(series.title)}</h4>
                    <div class="card-badges">
                        <span class="category-badge" style="background: ${categoryColor}; color: white;">${series.category}</span>
                        <span class="status-badge" style="background: ${statusColor}; color: white;">${series.status}</span>
                        ${series.progress ? `<span class="detail-badge"><i class="fas fa-chart-line"></i> ${escapeHtml(series.progress)}</span>` : ''}
                    </div>
                </div>
                <div class="custom-checkbox ${isSelected ? 'selected' : ''}" data-id="${series.id}" data-type="series">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners to checkboxes
    document.querySelectorAll('#seriesGrid .custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = checkbox.dataset.id;
            const type = checkbox.dataset.type;
            toggleSelectItem(id, type);
        });
    });
    
    // Add click to card info
    document.querySelectorAll('#seriesGrid .card-info').forEach(card => {
        card.addEventListener('click', (e) => {
            const parentCard = card.closest('.item-card');
            const id = parentCard.dataset.id;
            const type = 'series';
            toggleSelectItem(id, type);
        });
    });
}

// ============ CATEGORY FUNCTIONS ============
function filterCategories() {
    let filtered = [...allCategories];
    
    if (categorySearchTerm) {
        const term = categorySearchTerm.toLowerCase();
        filtered = filtered.filter(cat => cat.toLowerCase().includes(term));
    }
    
    return filtered;
}

function renderCategoryCards() {
    const filteredCategories = filterCategories();
    const grid = document.getElementById('categoryGrid');
    
    if (!grid) return;
    
    if (filteredCategories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No categories found</p>
                <p class="empty-hint">Categories will appear here</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredCategories.map(category => {
        const isSelected = selectedItems.has(category);
        const categoryColor = getCategoryColor(category);
        const itemCount = getCategoryItemCount(category);
        
        return `
            <div class="item-card" data-id="${escapeHtml(category)}" data-type="category">
                <div class="card-info">
                    <h4 class="card-title">
                        <span class="color-preview" style="background: ${categoryColor};"></span>
                        ${escapeHtml(category)}
                    </h4>
                    <div class="card-badges">
                        <span class="detail-badge"><i class="fas fa-layer-group"></i> ${itemCount} items</span>
                    </div>
                </div>
                <div class="custom-checkbox ${isSelected ? 'selected' : ''}" data-id="${escapeHtml(category)}" data-type="category">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners to checkboxes
    document.querySelectorAll('#categoryGrid .custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = checkbox.dataset.id;
            const type = checkbox.dataset.type;
            toggleSelectItem(id, type);
        });
    });
    
    // Add click to card info
    document.querySelectorAll('#categoryGrid .card-info').forEach(card => {
        card.addEventListener('click', (e) => {
            const parentCard = card.closest('.item-card');
            const id = parentCard.dataset.id;
            const type = 'category';
            toggleSelectItem(id, type);
        });
    });
}

// ============ SELECTION FUNCTIONS ============
function toggleSelectItem(id, type) {
    const stringId = id.toString();
    if (selectedItems.has(stringId)) {
        selectedItems.delete(stringId);
    } else {
        selectedItems.add(stringId);
    }
    
    // Update UI based on mode
    if (currentMode === 'series') {
        // Update the specific checkbox
        const checkbox = document.querySelector(`#seriesGrid .custom-checkbox[data-id="${id}"]`);
        if (checkbox) {
            if (selectedItems.has(stringId)) {
                checkbox.classList.add('selected');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                checkbox.classList.remove('selected');
                checkbox.innerHTML = '';
            }
        }
    } else {
        // Update the specific checkbox - escape special characters for selector
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const checkbox = document.querySelector(`#categoryGrid .custom-checkbox[data-id="${escapedId}"]`);
        if (checkbox) {
            if (selectedItems.has(stringId)) {
                checkbox.classList.add('selected');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                checkbox.classList.remove('selected');
                checkbox.innerHTML = '';
            }
        }
    }
}

function selectAll() {
    if (currentMode === 'series') {
        const filteredSeries = filterSeries();
        filteredSeries.forEach(series => {
            selectedItems.add(series.id.toString());
        });
        renderSeriesCards();
    } else {
        const filteredCategories = filterCategories();
        filteredCategories.forEach(category => {
            selectedItems.add(category);
        });
        renderCategoryCards();
    }
    showToast(`${selectedItems.size} items selected`, 'info');
}

function deselectAll() {
    selectedItems.clear();
    if (currentMode === 'series') {
        renderSeriesCards();
    } else {
        renderCategoryCards();
    }
    showToast('All items deselected', 'info');
}

// ============ DELETE FUNCTIONS ============
async function deleteSelectedItems() {
    if (selectedItems.size === 0) {
        showToast('No items selected to delete', 'warning');
        return;
    }
    
    const itemType = currentMode === 'series' ? 'series' : 'categories';
    const confirmMsg = `Are you sure you want to delete ${selectedItems.size} ${itemType}? ${currentMode === 'category' ? 'This will delete ALL series inside selected categories!' : ''}`;
    
    if (!confirm(confirmMsg)) return;
    
    const cards = document.querySelectorAll(currentMode === 'series' ? '#seriesGrid .item-card' : '#categoryGrid .item-card');
    const deletePromises = [];
    
    // Animate deletion
    cards.forEach(card => {
        const id = card.dataset.id;
        if (selectedItems.has(id)) {
            card.classList.add('deleting');
            deletePromises.push(new Promise(resolve => {
                setTimeout(() => resolve(), 300);
            }));
        }
    });
    
    await Promise.all(deletePromises);
    
    // Perform actual deletion
    let deletedCount = 0;
    
    if (currentMode === 'series') {
        selectedItems.forEach(id => {
            const numId = parseInt(id);
            let deleted = false;
            const allData = getAllCategoryData();
            
            for (const category in allData) {
                const found = allData[category].find(item => item.id === numId);
                if (found) {
                    removeFromCategory(category, numId);
                    deleted = true;
                    break;
                }
            }
            
            // Remove from favorites
            const favorites = getCategoryData('Favorites');
            if (favorites.some(fav => fav.id === numId)) {
                const newFavorites = favorites.filter(fav => fav.id !== numId);
                saveCategoryData('Favorites', newFavorites);
            }
            
            if (deleted) deletedCount++;
        });
    } else {
        selectedItems.forEach(category => {
            // Delete ALL items inside the category first
            const categoryData = getCategoryData(category);
            categoryData.forEach(item => {
                // Remove from favorites if present
                const favorites = getCategoryData('Favorites');
                if (favorites.some(fav => fav.id === item.id)) {
                    const newFavorites = favorites.filter(fav => fav.id !== item.id);
                    saveCategoryData('Favorites', newFavorites);
                }
            });
            
            // Delete the category (this removes all items inside it)
            deleteCategory(category);
            
            // Also remove from categories_list in localStorage
            const savedCategories = JSON.parse(localStorage.getItem('categories_list') || '["Anime","Manga","Manwha","TV Series","Movie"]');
            const updatedCategories = savedCategories.filter(cat => cat !== category);
            localStorage.setItem('categories_list', JSON.stringify(updatedCategories));
            
            // Remove category color
            const colors = JSON.parse(localStorage.getItem('category_colors') || '{}');
            delete colors[category];
            localStorage.setItem('category_colors', JSON.stringify(colors));
            
            deletedCount++;
        });
        
        // Refresh categories list after deletion
        allCategories = loadAllCategories();
    }
    
    // Clear selection and refresh data
    selectedItems.clear();
    allSeries = loadSeriesData();
    
    if (currentMode === 'series') {
        renderSeriesCards();
        initializeSeriesFilters(); // Refresh filters
    } else {
        renderCategoryCards();
        // Refresh filters after category deletion
        initializeSeriesFilters();
    }
    
    showToast(`${deletedCount} ${currentMode === 'series' ? 'series' : 'categories'} deleted successfully`, 'success');
}

// ============ FILTER INITIALIZATION ============
function initializeSeriesFilters() {
    // Get ALL real categories (including ones with 0 items)
    const allData = getAllCategoryData();
    const statusCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    
    // Get all categories that are NOT status categories
    let realCategories = Object.keys(allData).filter(cat => !statusCategories.includes(cat));
    
    // Also include any categories that might be in localStorage but not in allData
    const savedCategories = JSON.parse(localStorage.getItem('categories_list') || '["Anime","Manga","Manwha","TV Series","Movie"]');
    savedCategories.forEach(cat => {
        if (!realCategories.includes(cat) && !statusCategories.includes(cat)) {
            realCategories.push(cat);
        }
    });
    
    // Remove duplicates
    realCategories = [...new Set(realCategories)];
    
    const categoryContainer = document.getElementById('categoryFilters');
    const statusContainer = document.getElementById('statusFilters');
    const sortContainer = document.getElementById('sortFilters');
    
    // Category filters (ALL real categories with counts)
    if (categoryContainer) {
        let categoryChips = [
            { value: 'all', label: 'All Categories', icon: 'fa-tag', count: allSeries.length }
        ];
        
        // Add each real category with its count
        realCategories.forEach(cat => {
            const count = getSeriesCountInCategory(cat);
            categoryChips.push({ 
                value: cat, 
                label: cat, 
                icon: 'fa-folder',
                count: count
            });
        });
        
        categoryContainer.innerHTML = categoryChips.map(chip => `
            <button class="filter-chip ${seriesFilters.category === chip.value ? 'active' : ''}" 
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
            const count = getCategoryData(status).length;
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
            <button class="filter-chip ${seriesFilters.status === chip.value ? 'active' : ''}" 
                    data-filter="status" data-value="${chip.value}">
                <i class="fas ${chip.icon}"></i> ${chip.label} (${chip.count})
            </button>
        `).join('');
    }
    
    // Sort filters (no counts needed)
    if (sortContainer) {
        const sortChips = [
            { value: 'az', label: 'A-Z', icon: 'fa-sort-alpha-down' },
            { value: 'za', label: 'Z-A', icon: 'fa-sort-alpha-up' },
            { value: 'recent', label: 'Recent Added', icon: 'fa-clock' },
            { value: 'updated', label: 'Recent Updated', icon: 'fa-sync' }
        ];
        
        sortContainer.innerHTML = sortChips.map(chip => `
            <button class="filter-chip ${seriesFilters.sort === chip.value ? 'active' : ''}" 
                    data-filter="sort" data-value="${chip.value}">
                <i class="fas ${chip.icon}"></i> ${chip.label}
            </button>
        `).join('');
    }
    
    // Add event listeners
    document.querySelectorAll('#categoryFilters .filter-chip, #statusFilters .filter-chip, #sortFilters .filter-chip').forEach(chip => {
        chip.removeEventListener('click', handleFilterClick);
        chip.addEventListener('click', handleFilterClick);
    });
}

function handleFilterClick(e) {
    const chip = e.currentTarget;
    const filterType = chip.dataset.filter;
    const value = chip.dataset.value;
    
    if (filterType === 'category') {
        seriesFilters.category = value;
    } else if (filterType === 'status') {
        seriesFilters.status = value;
    } else if (filterType === 'sort') {
        seriesFilters.sort = value;
    }
    
    document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(c => {
        c.classList.remove('active');
    });
    chip.classList.add('active');
    
    renderSeriesCards();
}

// ============ SEARCH FUNCTIONS ============
function initializeSearch() {
    // Series search
    const seriesSearchInput = document.getElementById('seriesSearchInput');
    const clearSeriesSearch = document.getElementById('clearSeriesSearch');
    
    if (seriesSearchInput) {
        seriesSearchInput.addEventListener('input', (e) => {
            seriesSearchTerm = e.target.value;
            if (clearSeriesSearch) {
                clearSeriesSearch.classList.toggle('visible', seriesSearchTerm.length > 0);
            }
            renderSeriesCards();
        });
    }
    
    if (clearSeriesSearch) {
        clearSeriesSearch.addEventListener('click', () => {
            if (seriesSearchInput) {
                seriesSearchInput.value = '';
                seriesSearchTerm = '';
                clearSeriesSearch.classList.remove('visible');
                renderSeriesCards();
            }
        });
    }
    
    // Category search
    const categorySearchInput = document.getElementById('categorySearchInput');
    const clearCategorySearch = document.getElementById('clearCategorySearch');
    
    if (categorySearchInput) {
        categorySearchInput.addEventListener('input', (e) => {
            categorySearchTerm = e.target.value;
            if (clearCategorySearch) {
                clearCategorySearch.classList.toggle('visible', categorySearchTerm.length > 0);
            }
            renderCategoryCards();
        });
    }
    
    if (clearCategorySearch) {
        clearCategorySearch.addEventListener('click', () => {
            if (categorySearchInput) {
                categorySearchInput.value = '';
                categorySearchTerm = '';
                clearCategorySearch.classList.remove('visible');
                renderCategoryCards();
            }
        });
    }
}

// ============ MODE SWITCHING ============
function switchToSeriesMode() {
    currentMode = 'series';
    selectedItems.clear();
    
    // Update buttons
    document.getElementById('deleteSeriesMode').classList.add('active');
    document.getElementById('deleteCategoryMode').classList.remove('active');
    
    // Show/hide content
    document.getElementById('seriesModeContent').style.display = 'block';
    document.getElementById('categoryModeContent').style.display = 'none';
    
    // Refresh data
    allSeries = loadSeriesData();
    initializeSeriesFilters(); // Refresh filters to show all categories
    renderSeriesCards();
}

function switchToCategoryMode() {
    currentMode = 'category';
    selectedItems.clear();
    
    // Update buttons
    document.getElementById('deleteCategoryMode').classList.add('active');
    document.getElementById('deleteSeriesMode').classList.remove('active');
    
    // Show/hide content
    document.getElementById('seriesModeContent').style.display = 'none';
    document.getElementById('categoryModeContent').style.display = 'block';
    
    // Refresh data - load ALL categories (including empty ones and pre-saved ones)
    allCategories = loadAllCategories();
    console.log('Categories loaded for deletion:', allCategories); // Debug log
    renderCategoryCards();
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

// ============ NAVIGATION ============
function initNavigation() {
    const backBtn = document.getElementById('backBtn');
    const addBtn = document.getElementById('addBtn');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            window.location.href = 'add.html';
        });
    }
}

// ============ INITIALIZATION ============
async function initRemovePage() {  // Changed to async
    // Add animation first
    await showRemovePageAnimation();
    
    updateGreetingAndClock();
    
    // Load data
    allSeries = loadSeriesData();
    allCategories = loadAllCategories(); // Load ALL categories (including empty ones)
    
    console.log('Initial categories:', allCategories); // Debug log
    
    // Initialize UI
    initializeSeriesFilters();
    initializeSearch();
    renderSeriesCards();
    initNavigation();
    
    // Mode buttons
    document.getElementById('deleteSeriesMode').addEventListener('click', switchToSeriesMode);
    document.getElementById('deleteCategoryMode').addEventListener('click', switchToCategoryMode);
    
    // Bulk action buttons
    document.getElementById('selectAllBtn').addEventListener('click', selectAll);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
    
    // Fixed delete button
    document.getElementById('fixedDeleteBtn').addEventListener('click', deleteSelectedItems);
    
    // Update clock every second
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

// ============ REMOVE PAGE LOADING ANIMATION ============
function showRemovePageAnimation() {
    return new Promise((resolve) => {
        const loadingDiv = document.getElementById('loadingAnimation');
        const progressFill = document.getElementById('removeProgressFill');
        const percentSpan = document.getElementById('removePercentage');
        const flame = document.getElementById('removeFlame');
        
        if (loadingDiv && !sessionStorage.getItem('removeAnimationShown')) {
            loadingDiv.classList.remove('hide');
            
            let percent = 0;
            const duration = 2500;
            const intervalTime = 30;
            const steps = duration / intervalTime;
            const increment = 100 / steps;
            
            const skipAnimation = () => {
                clearInterval(interval);
                if (progressFill) progressFill.style.width = '100%';
                if (percentSpan) percentSpan.textContent = '100%';
                if (flame) flame.classList.add('active');
                setTimeout(() => {
                    loadingDiv.classList.add('hide');
                    sessionStorage.setItem('removeAnimationShown', 'true');
                    resolve();
                }, 300);
            };
            
            loadingDiv.addEventListener('click', skipAnimation, { once: true });
            
            const interval = setInterval(() => {
                percent += increment;
                if (percent >= 100) {
                    percent = 100;
                    if (progressFill) progressFill.style.width = '100%';
                    if (percentSpan) percentSpan.textContent = '100%';
                    if (flame) flame.classList.add('active');
                    clearInterval(interval);
                    setTimeout(() => {
                        loadingDiv.classList.add('hide');
                        sessionStorage.setItem('removeAnimationShown', 'true');
                        resolve();
                    }, 500);
                } else {
                    if (progressFill) progressFill.style.width = percent + '%';
                    if (percentSpan) percentSpan.textContent = Math.floor(percent) + '%';
                    
                    if (percent >= 85 && flame) {
                        flame.classList.add('active');
                    }
                }
            }, intervalTime);
        } else if (loadingDiv) {
            loadingDiv.classList.add('hide');
            resolve();
        } else {
            resolve();
        }
    });
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

// Helper function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', initRemovePage);
document.addEventListener('DOMContentLoaded', initGreeting);