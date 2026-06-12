// add.js - Add Page Functionality

// ============ COLOR SYSTEM FOR CATEGORIES ============
const CATEGORY_COLORS = [
    '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1'
];

const DEFAULT_CATEGORIES_COLORS = {
    'Anime': '#2563EB', 'Manga': '#10B981', 'Manwha': '#F59E0B',
    'TV Series': '#8B5CF6', 'Movie': '#EF4444'
};

// Store original status for each item
let itemOriginalStatus = {};

function loadCategoriesWithColors() {
    let categories = localStorage.getItem('categories_list');
    let categoryColors = localStorage.getItem('category_colors');
    
    if (!categories) {
        localStorage.setItem('categories_list', JSON.stringify(Object.keys(DEFAULT_CATEGORIES_COLORS)));
        localStorage.setItem('category_colors', JSON.stringify(DEFAULT_CATEGORIES_COLORS));
        return Object.keys(DEFAULT_CATEGORIES_COLORS);
    }
    return JSON.parse(categories);
}

function getCategoryColor(categoryName) {
    const colors = JSON.parse(localStorage.getItem('category_colors') || '{}');
    if (colors[categoryName]) return colors[categoryName];
    
    const usedColors = Object.values(colors);
    const availableColors = CATEGORY_COLORS.filter(c => !usedColors.includes(c));
    const newColor = availableColors[0] || CATEGORY_COLORS[0];
    colors[categoryName] = newColor;
    localStorage.setItem('category_colors', JSON.stringify(colors));
    return newColor;
}

function addNewCategory(categoryName) {
    const categories = loadCategoriesWithColors();
    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        localStorage.setItem('categories_list', JSON.stringify(categories));
        
        const colors = JSON.parse(localStorage.getItem('category_colors') || '{}');
        const usedColors = Object.values(colors);
        const availableColors = CATEGORY_COLORS.filter(c => !usedColors.includes(c));
        colors[categoryName] = availableColors[0] || CATEGORY_COLORS[0];
        localStorage.setItem('category_colors', JSON.stringify(colors));
    }
    return categories;
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

// ============ FORM INITIALIZATION ============
function initializeCategorySelect() {
    const categories = loadCategoriesWithColors();
    const select = document.getElementById('category');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select category...</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function initializeStatusChips() {
    const chips = document.querySelectorAll('.status-chip');
    const priorityContainer = document.getElementById('priorityContainer');
    const progressInput = document.getElementById('progress');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            document.getElementById('selectedStatus').value = chip.dataset.status;
            
            if (chip.dataset.status === 'Plan to Watch') {
                if (priorityContainer) priorityContainer.style.display = 'block';
                if (progressInput) progressInput.placeholder = 'no need to add progress if plan to watch selected (optional)';
            } else {
                if (priorityContainer) priorityContainer.style.display = 'none';
                if (progressInput) progressInput.placeholder = 'Enter progress...';
                document.getElementById('selectedPriority').value = '';
                document.querySelectorAll('.priority-chip').forEach(p => p.classList.remove('active'));
            }
        });
    });
}

function initializePriorityChips() {
    const chips = document.querySelectorAll('.priority-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            document.getElementById('selectedPriority').value = chip.dataset.priority;
        });
    });
}

function initializeProgressHelpers() {
    const helpers = document.querySelectorAll('.helper-chip');
    const progressInput = document.getElementById('progress');
    
    helpers.forEach(helper => {
        helper.addEventListener('click', () => {
            if (progressInput) {
                const helperText = helper.dataset.helper;
                if (!progressInput.value.startsWith(helperText)) {
                    progressInput.value = helperText;
                    progressInput.focus();
                }
            }
        });
    });
    
    // Season helpers
    const seasonHelpers = document.querySelectorAll('.helper-chip-season');
    const seasonInput = document.getElementById('season');
    
    seasonHelpers.forEach(helper => {
        helper.addEventListener('click', () => {
            if (seasonInput) {
                const helperText = helper.dataset.helper;
                if (!seasonInput.value.startsWith(helperText)) {
                    seasonInput.value = helperText;
                    seasonInput.focus();
                }
            }
        });
    });
    
    const archHelpers = document.querySelectorAll('.helper-chip-arch');
    archHelpers.forEach(helper => {
        helper.addEventListener('click', () => {
            if (seasonInput) {
                const helperText = helper.dataset.helper;
                if (!seasonInput.value.startsWith(helperText)) {
                    seasonInput.value = helperText;
                    seasonInput.focus();
                }
            }
        });
    });
}

function autoCapitalize(input) {
    if (!input) return;
    input.addEventListener('input', function() {
        let value = this.value;
        if (value.length > 0) {
            value = value.charAt(0).toUpperCase() + value.slice(1);
            value = value.replace(/\.\s+./g, match => match.toUpperCase());
            if (this.value !== value) this.value = value;
        }
    });
}

// ============ MODAL FUNCTIONS ============
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'none';
}

function openEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
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
// ============ ADD PAGE LOADING ANIMATION ============
function showAddPageAnimation() {
    return new Promise((resolve) => {
        const loadingDiv = document.getElementById('loadingAnimation');
        const progressFill = document.getElementById('addProgressFill');
        const percentSpan = document.getElementById('addPercentage');
        const flame = document.getElementById('addFlame');
        
        if (loadingDiv && !sessionStorage.getItem('addAnimationShown')) {
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
                    sessionStorage.setItem('addAnimationShown', 'true');
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
                        sessionStorage.setItem('addAnimationShown', 'true');
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

// ============ SAVE FUNCTION ============
function saveSeries() {
    const title = document.getElementById('title')?.value.trim();
    const category = document.getElementById('category')?.value;
    const status = document.getElementById('selectedStatus')?.value;
    const priority = document.getElementById('selectedPriority')?.value;
    const progress = document.getElementById('progress')?.value;
    const season = document.getElementById('season')?.value;
    const notes = document.getElementById('notes')?.value;
    const isFavorite = document.getElementById('favoriteToggle')?.classList.contains('active');
    const isCompleted = document.getElementById('completedToggle')?.classList.contains('active');
    
    if (!title) { showNotification('Please enter a title!', 'error'); return false; }
    if (!category) { showNotification('Please select a category!', 'error'); return false; }
    if (!status) { showNotification('Please select a status!', 'error'); return false; }
    
    const seriesObject = {
        id: Date.now(),
        title: title,
        category: category,
        status: status,
        originalStatus: status,
        priority: priority || null,
        progress: progress || null,
        season: season || null,
        notes: notes || null,
        dateAdded: new Date().toISOString(),
        lastEdited: new Date().toISOString()
    };
    
    // Save to main category only (avoid duplication)
    addToCategory(category, seriesObject);
    showNotification(`Added "${title}" to ${category}!`, 'success');
    
   // In the saveSeries function of add.js, when adding to favorites:
    if (isFavorite) {
    const favorites = getCategoryData('Favorites');
    if (!favorites.some(fav => fav.id === seriesObject.id)) {
        // Store the category information with the favorite
        const favoriteItem = {
            ...seriesObject,
            originalCategory: category  // Store the original category
        };
        favorites.push(favoriteItem);
        saveCategoryData('Favorites', favorites);
        showNotification(`Added to Favorites!`, 'success');
    }
}
    
    // Add to completed if toggled and status not completed
    if (isCompleted && status !== 'Completed') {
        addToCategory('Completed', seriesObject);
        showNotification(`Marked as Completed!`, 'success');
    }
    
    resetForm();
    loadRecentItems();
    return true;
}

function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('category').value = '';
    document.getElementById('progress').value = '';
    document.getElementById('season').value = '';
    document.getElementById('notes').value = '';
    document.querySelectorAll('.status-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.priority-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.toggle-btn').forEach(c => c.classList.remove('active'));
    document.getElementById('selectedStatus').value = '';
    document.getElementById('selectedPriority').value = '';
    document.getElementById('priorityContainer').style.display = 'none';
}

// ============ RECENTLY ADDED ============
function loadRecentItems() {
    const allSeries = [];
    const allData = getAllCategoryData();
    
    for (const [category, items] of Object.entries(allData)) {
        items.forEach(item => {
            allSeries.push({ ...item, originalCategory: category });
        });
    }
    
    // Remove duplicates by ID
    const uniqueSeries = [];
    const seenIds = new Set();
    for (const item of allSeries) {
        if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueSeries.push(item);
        }
    }
    
    const recent = uniqueSeries.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 10);
    const container = document.getElementById('recentList');
    if (!container) return;
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; padding: 40px;"><i class="fas fa-clock"></i><p>No items added yet</p></div>';
        return;
    }
    
    container.innerHTML = recent.map(item => {
        const isFavorite = getCategoryData('Favorites').some(fav => fav.id === item.id);
        const categoryColor = getCategoryColor(item.category);
        const statusColor = getStatusColor(item.status);
        const isCompleted = item.status === 'Completed';
        
        return `
            <div class="recent-card" data-id="${item.id}" data-original-status="${item.originalStatus || item.status}">
                <div class="card-header">
                    <h4 class="card-title">${escapeHtml(item.title)}</h4>
                    <div>
                        <span class="category-badge" style="background: ${categoryColor}; color: white;">${item.category}</span>
                        <span class="status-badge" style="background: ${statusColor}; color: white;">${item.status} ${item.priority ? `<span class="priority-badge">${getPriorityIcon(item.priority)} ${item.priority}</span>` : ''}</span>
                    </div>
                </div>
                <div class="card-details">
                    ${item.progress ? `<span class="detail-capsule"><i class="fas fa-chart-line"></i> ${escapeHtml(item.progress)}</span>` : ''}
                    ${item.season ? `<span class="detail-capsule"><i class="fas fa-layer-group"></i> ${escapeHtml(item.season)}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn edit" onclick="editItem(${item.id})"><i class="fas fa-pencil-alt"></i> Edit</button>
                    <button class="card-action-btn favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavoriteFromCard(${item.id})"><i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i> Fav</button>
                    <button class="card-action-btn complete" onclick="toggleCompleteStatus(${item.id})"><i class="fas fa-check"></i> ${isCompleted ? 'Completed' : 'Complete'}</button>
                    <button class="card-action-btn delete" onclick="deleteItemFromCard(${item.id})"><i class="fas fa-trash-alt"></i> Del</button>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusColor(status) {
    const colors = { 'Watching': '#2563EB', 'Plan to Watch': '#F59E0B', 'On Hold': '#8B5CF6', 'Dropped': '#EF4444', 'Completed': '#10B981' };
    return colors[status] || '#6B7280';
}

function getPriorityIcon(priority) {
    if (priority === 'High') return '🔴';
    if (priority === 'Medium') return '🟡';
    return '🟢';
}

// ============ CARD ACTIONS ============
function editItem(id) {
    let itemToEdit = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) { itemToEdit = found; break; }
    }
    
    if (itemToEdit) {
        document.getElementById('editId').value = itemToEdit.id;
        document.getElementById('editTitle').value = itemToEdit.title;
        
        const categorySelect = document.getElementById('editCategory');
        categorySelect.innerHTML = loadCategoriesWithColors().map(cat => 
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

function toggleFavoriteFromCard(id) {
    toggleFavorite(id);
    loadRecentItems();
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
            // Revert to original status
            removeFromCategory(sourceCategory, id);
            itemToToggle.status = originalStatus;
            itemToToggle.lastEdited = new Date().toISOString();
            addToCategory(originalStatus, itemToToggle);
            showNotification(`"${itemToToggle.title}" reverted to ${originalStatus}!`, 'success');
        } else {
            // Mark as completed
            removeFromCategory(sourceCategory, id);
            itemToToggle.status = 'Completed';
            itemToToggle.lastEdited = new Date().toISOString();
            addToCategory('Completed', itemToToggle);
            showNotification(`"${itemToToggle.title}" marked as completed!`, 'success');
        }
        loadRecentItems();
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
            showNotification('Item deleted!', 'success');
            loadRecentItems();
        }
    }
}

function toggleFavorite(id) {
    const favorites = getCategoryData('Favorites');
    const exists = favorites.some(fav => fav.id === id);
    let seriesToToggle = null;
    const allData = getAllCategoryData();
    
    for (const category in allData) {
        const found = allData[category].find(item => item.id === id);
        if (found) { seriesToToggle = found; break; }
    }
    
    if (seriesToToggle) {
        if (exists) {
            const newFavorites = favorites.filter(fav => fav.id !== id);
            saveCategoryData('Favorites', newFavorites);
            showNotification('Removed from favorites', 'info');
        } else {
            favorites.push(seriesToToggle);
            saveCategoryData('Favorites', favorites);
            showNotification('Added to favorites!', 'success');
        }
    }
}

// ============ FOOTER BAR ============
function initFooterBar() {
    const footer = document.getElementById('footerBar');
    if (!footer) return;
    let lastScrollTop = 0, scrollTimeout;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop < lastScrollTop && scrollTop > 50) {
            footer.classList.add('visible');
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => footer.classList.remove('visible'), 3000);
        } else if (scrollTop === 0) footer.classList.remove('visible');
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

function initNavigation() {
    document.getElementById('backBtn')?.addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('trashBtn')?.addEventListener('click', () => window.location.href = 'remove.html');
}

// ============ INITIALIZATION ============
async function initAddPage() {  // Changed to async
    // Add animation first
    await showAddPageAnimation();
    
    updateGreetingAndClock();
    initializeCategorySelect();
    initializeStatusChips();
    initializePriorityChips();
    initializeProgressHelpers();
    loadRecentItems();
    initFooterBar();
    initNavigation();
    
    autoCapitalize(document.getElementById('title'));
    autoCapitalize(document.getElementById('season'));
    
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal());
    document.getElementById('confirmCategoryBtn')?.addEventListener('click', () => {
        const newCategory = document.getElementById('newCategoryName').value.trim();
        if (newCategory) {
            const capitalized = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);
            addNewCategory(capitalized);
            initializeCategorySelect();
            closeCategoryModal();
            showNotification(`Category "${capitalized}" added!`, 'success');
        } else showNotification('Please enter a category name!', 'error');
    });
    
    document.getElementById('favoriteToggle')?.addEventListener('click', function() { this.classList.toggle('active'); });
    document.getElementById('completedToggle')?.addEventListener('click', function() { this.classList.toggle('active'); });
    
    document.getElementById('addForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveSeries(); });
    document.getElementById('resetBtn')?.addEventListener('click', resetForm);
    document.getElementById('deleteFormBtn')?.addEventListener('click', () => { resetForm(); showNotification('Form cleared!', 'info'); });
    
    document.getElementById('confirmEditBtn')?.addEventListener('click', () => {
        const editId = parseInt(document.getElementById('editId').value);
        const editTitle = document.getElementById('editTitle').value.trim();
        const editCategory = document.getElementById('editCategory').value;
        const editStatus = document.getElementById('editStatus').value;
        const editPriority = document.getElementById('editPriority')?.value;
        const editProgress = document.getElementById('editProgress').value;
        const editSeason = document.getElementById('editSeason').value;
        const editNotes = document.getElementById('editNotes').value;
        
        if (!editTitle) { showNotification('Title is required!', 'error'); return; }
        
        let oldCategory = null, itemToUpdate = null;
        const allData = getAllCategoryData();
        for (const category in allData) {
            const found = allData[category].find(item => item.id === editId);
            if (found) { oldCategory = category; itemToUpdate = found; break; }
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
            showNotification('Item updated!', 'success');
            closeEditModal();
            loadRecentItems();
        }
    });
    
    setInterval(updateGreetingAndClock, 1000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', initAddPage);
document.addEventListener('DOMContentLoaded', initGreeting);