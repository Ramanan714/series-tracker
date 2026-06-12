// wishlist.js - Wishlist Page Functionality

// ============ GLOBAL VARIABLES ============
let allWishlistItems = [];
let currentCategoryFilter = 'all';
let currentMoveItemId = null;

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
    if (animation && !sessionStorage.getItem('wishlistAnimationShown')) {
        animation.style.display = 'flex';
        
        animation.addEventListener('click', () => {
            animation.style.display = 'none';
            sessionStorage.setItem('wishlistAnimationShown', 'true');
        });
        
        setTimeout(() => {
            if (animation.style.display === 'flex') {
                animation.style.display = 'none';
                sessionStorage.setItem('wishlistAnimationShown', 'true');
            }
        }, 3000);
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

function getPriorityClass(priority) {
    if (priority === 'High') return 'high';
    if (priority === 'Medium') return 'medium';
    return 'low';
}

// ============ LOAD WISHLIST ============
function loadWishlist() {
    // Get all items with status "Plan to Watch" from all categories
    const allData = getAllCategoryData();
    const wishlistItems = [];
    const seenIds = new Set();
    
    for (const [category, items] of Object.entries(allData)) {
        items.forEach(item => {
            // Check if item has status "Plan to Watch" or is in "Plan to Watch" category
            if ((item.status === 'Plan to Watch') && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                wishlistItems.push({
                    ...item,
                    originalCategory: category,
                    sourceCategory: category
                });
            }
        });
    }
    
    // Also check the Plan to Watch category directly
    const planToWatchCategory = getCategoryData('Plan to Watch');
    planToWatchCategory.forEach(item => {
        if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            wishlistItems.push({
                ...item,
                originalCategory: item.category || 'Uncategorized',
                sourceCategory: 'Plan to Watch'
            });
        }
    });
    
    console.log('Wishlist items loaded:', wishlistItems.length);
    return wishlistItems;
}

// ============ GET CATEGORY STATS ============
function getWishlistCategoryStats() {
    const stats = new Map();
    
    allWishlistItems.forEach(item => {
        const category = item.originalCategory || item.category || 'Uncategorized';
        stats.set(category, (stats.get(category) || 0) + 1);
    });
    
    return stats;
}

// ============ FILTER FUNCTIONS ============
function filterWishlist() {
    let filtered = [...allWishlistItems];
    
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(item => {
            const category = item.originalCategory || item.category || 'Uncategorized';
            return category === currentCategoryFilter;
        });
    }
    
    return filtered;
}

// ============ RENDER FUNCTIONS ============
function renderCategoryFilters() {
    const stats = getWishlistCategoryStats();
    const categories = ['all', ...Array.from(stats.keys()).sort()];
    const container = document.getElementById('categoryFilters');
    
    if (!container) return;
    
    if (allWishlistItems.length === 0) {
        container.innerHTML = `
            <button class="filter-chip active" data-category="all">
                <i class="fas fa-heart"></i> All (0)
            </button>
        `;
        return;
    }
    
    container.innerHTML = categories.map(category => {
        const count = category === 'all' ? allWishlistItems.length : stats.get(category);
        const isActive = currentCategoryFilter === category;
        
        return `
            <button class="filter-chip ${isActive ? 'active' : ''}" data-category="${category}">
                <i class="fas ${category === 'all' ? 'fa-heart' : 'fa-folder'}"></i>
                ${category === 'all' ? 'All' : category} (${count})
            </button>
        `;
    }).join('');
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            currentCategoryFilter = chip.dataset.category;
            renderCategoryFilters();
            renderWishlistGrid();
        });
    });
}

function renderWishlistGrid() {
    const filteredItems = filterWishlist();
    const grid = document.getElementById('wishlistGrid');
    const countSpan = document.getElementById('wishlistCount');
    
    if (countSpan) {
        countSpan.textContent = allWishlistItems.length;
    }
    
    if (!grid) return;
    
    if (allWishlistItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>No items in wishlist yet</p>
                <p class="empty-hint">Add items with "Plan to Watch" status from the Add page</p>
            </div>
        `;
        return;
    }
    
    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <p>No items in this category</p>
                <p class="empty-hint">Try changing the category filter</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredItems.map(item => {
        const categoryName = item.originalCategory || item.category || 'Uncategorized';
        const categoryColor = getCategoryColor(categoryName);
        const priorityClass = getPriorityClass(item.priority);
        const isFavorite = getCategoryData('Favorites').some(fav => fav.id === item.id);
        
        return `
            <div class="wishlist-card" data-id="${item.id}">
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <div class="card-badges">
                        <span class="category-badge" style="background: ${categoryColor}; color: white;">${categoryName}</span>
                        <span class="priority-badge ${priorityClass}">${item.priority || 'Medium'}</span>
                        <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavoriteFromWishlist(${item.id})">
                            <i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                        </button>
                    </div>
                </div>
                <div class="card-details">
                    ${item.progress ? `<span class="detail-capsule"><i class="fas fa-chart-line"></i> ${escapeHtml(item.progress)}</span>` : ''}
                    ${item.season ? `<span class="detail-capsule"><i class="fas fa-layer-group"></i> ${escapeHtml(item.season)}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn move" onclick="openMoveStatusModal(${item.id})">
                        <i class="fas fa-arrow-right"></i> Move
                    </button>
                    <button class="card-action-btn edit" onclick="editWishlistItem(${item.id})">
                        <i class="fas fa-pencil-alt"></i> Edit
                    </button>
                    <button class="card-action-btn delete" onclick="deleteWishlistItem(${item.id})">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ MOVE STATUS FUNCTIONS ============
function openMoveStatusModal(id) {
    currentMoveItemId = id;
    const modal = document.getElementById('moveStatusModal');
    if (modal) modal.style.display = 'flex';
}

function closeMoveStatusModal() {
    const modal = document.getElementById('moveStatusModal');
    if (modal) modal.style.display = 'none';
    currentMoveItemId = null;
}

function moveToStatus(status) {
    if (!currentMoveItemId) return;
    
    // Find the item in wishlist
    let itemToMove = allWishlistItems.find(item => item.id === currentMoveItemId);
    
    if (itemToMove) {
        // Remove from Plan to Watch category
        const planToWatch = getCategoryData('Plan to Watch');
        const newPlanToWatch = planToWatch.filter(item => item.id !== currentMoveItemId);
        saveCategoryData('Plan to Watch', newPlanToWatch);
        
        // Also remove from original category if that's where it was stored
        const originalCategory = itemToMove.originalCategory;
        if (originalCategory && originalCategory !== 'Plan to Watch') {
            const categoryData = getCategoryData(originalCategory);
            const itemInCategory = categoryData.find(item => item.id === currentMoveItemId);
            if (itemInCategory && itemInCategory.status === 'Plan to Watch') {
                const newCategoryData = categoryData.filter(item => item.id !== currentMoveItemId);
                saveCategoryData(originalCategory, newCategoryData);
            }
        }
        
        // Update item status
        itemToMove.status = status;
        itemToMove.lastEdited = new Date().toISOString();
        
        // Remove priority if moving away from Plan to Watch
        if (status !== 'Plan to Watch') {
            itemToMove.priority = null;
        }
        
        // Add to new status category based on selected status
        if (status === 'Watching') {
            addToCategory('Watching', itemToMove);
        } else if (status === 'Completed') {
            addToCategory('Completed', itemToMove);
        } else if (status === 'On Hold') {
            addToCategory('On Hold', itemToMove);
        } else if (status === 'Dropped') {
            addToCategory('Dropped', itemToMove);
        } else if (status === 'Plan to Watch') {
            addToCategory('Plan to Watch', itemToMove);
        }
        
        // Also add to original category with new status
        const originalCat = itemToMove.originalCategory || itemToMove.category;
        if (originalCat && originalCat !== 'Plan to Watch' && 
            originalCat !== 'Watching' && originalCat !== 'Completed' && 
            originalCat !== 'On Hold' && originalCat !== 'Dropped') {
            addToCategory(originalCat, itemToMove);
        }
        
        // Update favorites if present
        const favorites = getCategoryData('Favorites');
        const favIndex = favorites.findIndex(fav => fav.id === currentMoveItemId);
        if (favIndex !== -1) {
            favorites[favIndex] = {
                ...favorites[favIndex],
                status: status,
                priority: status === 'Plan to Watch' ? itemToMove.priority : null,
                lastEdited: new Date().toISOString()
            };
            saveCategoryData('Favorites', favorites);
        }
        
        showToast(`Moved "${itemToMove.title}" to ${status}`, 'success');
        
        // Refresh all data
        refreshAllData();
    }
    
    closeMoveStatusModal();
}

// ============ ADD/EDIT FUNCTIONS ============
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add to Wishlist';
    document.getElementById('editItemId').value = '';
    document.getElementById('itemTitle').value = '';
    document.getElementById('itemProgress').value = '';
    document.getElementById('itemSeason').value = '';
    document.getElementById('itemNotes').value = '';
    document.getElementById('itemPriority').value = 'Medium';
    
    const categories = JSON.parse(localStorage.getItem('categories_list') || '["Anime","Manga","Manwha","TV Series","Movie"]');
    const categorySelect = document.getElementById('itemCategory');
    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    document.getElementById('addEditModal').style.display = 'flex';
}

function editWishlistItem(id) {
    const item = allWishlistItems.find(i => i.id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = 'Edit Wishlist Item';
        document.getElementById('editItemId').value = item.id;
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemProgress').value = item.progress || '';
        document.getElementById('itemSeason').value = item.season || '';
        document.getElementById('itemNotes').value = item.notes || '';
        document.getElementById('itemPriority').value = item.priority || 'Medium';
        
        const categories = JSON.parse(localStorage.getItem('categories_list') || '["Anime","Manga","Manwha","TV Series","Movie"]');
        const categorySelect = document.getElementById('itemCategory');
        categorySelect.innerHTML = categories.map(cat => 
            `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
        ).join('');
        
        document.getElementById('addEditModal').style.display = 'flex';
    }
}

function closeAddEditModal() {
    document.getElementById('addEditModal').style.display = 'none';
}

function saveWishlistItem() {
    const id = document.getElementById('editItemId').value;
    const title = document.getElementById('itemTitle').value.trim();
    const category = document.getElementById('itemCategory').value;
    const priority = document.getElementById('itemPriority').value;
    const progress = document.getElementById('itemProgress').value;
    const season = document.getElementById('itemSeason').value;
    const notes = document.getElementById('itemNotes').value;
    
    if (!title) {
        showToast('Please enter a title!', 'error');
        return;
    }
    
    const now = new Date().toISOString();
    
    if (id) {
        // Edit existing item
        let itemToUpdate = allWishlistItems.find(item => item.id === parseInt(id));
        
        if (itemToUpdate) {
            // Remove from all possible locations
            const allData = getAllCategoryData();
            for (const cat in allData) {
                const items = allData[cat];
                const foundIndex = items.findIndex(item => item.id === parseInt(id));
                if (foundIndex !== -1) {
                    items.splice(foundIndex, 1);
                    saveCategoryData(cat, items);
                }
            }
            
            // Update item
            itemToUpdate.title = title;
            itemToUpdate.category = category;
            itemToUpdate.originalCategory = category;
            itemToUpdate.priority = priority;
            itemToUpdate.progress = progress || null;
            itemToUpdate.season = season || null;
            itemToUpdate.notes = notes || null;
            itemToUpdate.lastEdited = now;
            itemToUpdate.status = 'Plan to Watch';
            
            // Add back to Plan to Watch
            const planToWatch = getCategoryData('Plan to Watch');
            planToWatch.push(itemToUpdate);
            saveCategoryData('Plan to Watch', planToWatch);
            
            // Also add to original category
            addToCategory(category, itemToUpdate);
            
            // Update favorites
            const favorites = getCategoryData('Favorites');
            const favIndex = favorites.findIndex(fav => fav.id === parseInt(id));
            if (favIndex !== -1) {
                favorites[favIndex] = {
                    ...favorites[favIndex],
                    title: title,
                    category: category,
                    priority: priority,
                    progress: progress || null,
                    season: season || null,
                    notes: notes || null,
                    lastEdited: now
                };
                saveCategoryData('Favorites', favorites);
            }
            
            showToast('Item updated!', 'success');
        }
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            title: title,
            category: category,
            status: 'Plan to Watch',
            priority: priority,
            progress: progress || null,
            season: season || null,
            notes: notes || null,
            dateAdded: now,
            lastEdited: now
        };
        
        addToCategory('Plan to Watch', newItem);
        addToCategory(category, newItem);
        showToast(`Added "${title}" to wishlist!`, 'success');
    }
    
    closeAddEditModal();
    refreshAllData();
}

function deleteWishlistItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        // Remove from all categories
        const allData = getAllCategoryData();
        for (const category in allData) {
            const items = allData[category];
            if (items.find(item => item.id === id)) {
                removeFromCategory(category, id);
            }
        }
        
        // Remove from favorites if present
        const favorites = getCategoryData('Favorites');
        if (favorites.some(fav => fav.id === id)) {
            const newFavorites = favorites.filter(fav => fav.id !== id);
            saveCategoryData('Favorites', newFavorites);
        }
        
        showToast('Item deleted!', 'success');
        refreshAllData();
    }
}

function toggleFavoriteFromWishlist(id) {
    const favorites = getCategoryData('Favorites');
    const exists = favorites.some(fav => fav.id === id);
    
    let itemToToggle = allWishlistItems.find(item => item.id === id);
    
    if (itemToToggle) {
        if (exists) {
            const newFavorites = favorites.filter(fav => fav.id !== id);
            saveCategoryData('Favorites', newFavorites);
            showToast('Removed from favorites', 'info');
        } else {
            const favoriteItem = {
                ...itemToToggle,
                originalCategory: itemToToggle.category,
                category: itemToToggle.category
            };
            favorites.push(favoriteItem);
            saveCategoryData('Favorites', favorites);
            showToast('Added to favorites!', 'success');
        }
        renderWishlistGrid();
    }
}

function viewItemDetails(id) {
    const item = allWishlistItems.find(i => i.id === id);
    if (item) {
        document.getElementById('viewTitle').textContent = item.title;
        document.getElementById('viewDetails').innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${item.category || item.originalCategory}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${item.priority || 'Medium'}</span>
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
        `;
        document.getElementById('viewModal').style.display = 'flex';
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function refreshAllData() {
    allWishlistItems = loadWishlist();
    renderCategoryFilters();
    renderWishlistGrid();
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
    const addWishlistBtn = document.getElementById('addWishlistBtn');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (addWishlistBtn) {
        addWishlistBtn.addEventListener('click', openAddModal);
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
function initWishlistPage() {
    showOpeningAnimation();
    
    allWishlistItems = loadWishlist();
    
    updateGreetingAndClock();
    renderCategoryFilters();
    renderWishlistGrid();
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

// Make functions global
window.openMoveStatusModal = openMoveStatusModal;
window.closeMoveStatusModal = closeMoveStatusModal;
window.moveToStatus = moveToStatus;
window.editWishlistItem = editWishlistItem;
window.deleteWishlistItem = deleteWishlistItem;
window.toggleFavoriteFromWishlist = toggleFavoriteFromWishlist;
window.viewItemDetails = viewItemDetails;
window.closeViewModal = closeViewModal;
window.closeAddEditModal = closeAddEditModal;
window.saveWishlistItem = saveWishlistItem;

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initGreeting(); // Add this line
    // Add status option event listeners
    const statusOptions = document.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', () => {
            const status = option.dataset.status;
            moveToStatus(status);
        });
    });
    
    const saveBtn = document.getElementById('saveWishlistBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveWishlistItem);
    }
    
    initWishlistPage();
});