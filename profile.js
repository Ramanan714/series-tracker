// profile.js - Profile Page Functionality

// ============ GLOBAL VARIABLES ============
let categoryChart = null;
let statusChart = null;
let uploadedImageData = null;

// ============ MODERN LOADING ANIMATION ============
function showLoadingAnimation() {
    return new Promise((resolve) => {
        const loadingDiv = document.getElementById('loadingAnimation');
        const progressFill = document.getElementById('loadingProgressFill');
        const percentSpan = document.getElementById('loadingPercentage');
        const flame = document.getElementById('loadingFlame');
        
        if (loadingDiv && !sessionStorage.getItem('profileAnimationShown')) {
            loadingDiv.classList.remove('hide');
            
            let percent = 0;
            const duration = 3000; // 3 seconds
            const intervalTime = 30; // 30ms per step
            const steps = duration / intervalTime;
            const increment = 100 / steps;
            
            // Skip animation on click anywhere
            const skipAnimation = () => {
                clearInterval(interval);
                if (progressFill) progressFill.style.width = '100%';
                if (percentSpan) percentSpan.textContent = '100%';
                if (flame) flame.classList.add('active');
                setTimeout(() => {
                    loadingDiv.classList.add('hide');
                    sessionStorage.setItem('profileAnimationShown', 'true');
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
                        sessionStorage.setItem('profileAnimationShown', 'true');
                        resolve();
                    }, 500);
                } else {
                    if (progressFill) progressFill.style.width = percent + '%';
                    if (percentSpan) percentSpan.textContent = Math.floor(percent) + '%';
                    
                    // Show flame when near the end
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
        greetingElement.textContent = `Good ${greeting}!`;
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        clockElement.textContent = `${dateStr} | ${timeStr}`;
    }
}
// Add this function to profile.js - Save image to localStorage permanently
function saveProfileImagePermanently(imageData) {
    localStorage.setItem('profile_image_permanent', imageData);
    document.getElementById('profileAvatar').src = imageData;
    showToast('Profile image saved permanently!', 'success');
}

// ============ IMAGE FUNCTIONS ============
// Modified loadUserProfile function to load permanent image
function loadUserProfile() {
    const savedName = localStorage.getItem('profile_userName');
    const savedImage = localStorage.getItem('profile_image_permanent');
    
    if (savedName) {
        document.getElementById('userName').textContent = savedName;
    }
    
    if (savedImage) {
        document.getElementById('profileAvatar').src = savedImage;
    } else {
        const savedColor = localStorage.getItem('profile_avatarColor') || '2563EB';
        const userName = document.getElementById('userName').textContent;
        document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?background=${savedColor}&color=fff&bold=true&size=180&name=${encodeURIComponent(userName)}`;
    }
}

// Modified save image function
// Replace the existing saveProfileImage function with this
function saveProfileImage(imageData) {
    // If it's a blob URL, convert to base64 first
    if (imageData.startsWith('blob:')) {
        fetch(imageData)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    localStorage.setItem('profile_image_permanent', base64data);
                    document.getElementById('profileAvatar').src = base64data;
                    
                    // Also update greeting avatar
                    const greetingAvatar = document.getElementById('greetingAvatar');
                    if (greetingAvatar) greetingAvatar.src = base64data;
                    
                    showToast('Profile image saved permanently!', 'success');
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                console.error('Failed to convert image:', err);
                showToast('Failed to save image', 'error');
            });
    } else {
        // Already base64 or HTTP URL
        localStorage.setItem('profile_image_permanent', imageData);
        document.getElementById('profileAvatar').src = imageData;
        
        // Also update greeting avatar
        const greetingAvatar = document.getElementById('greetingAvatar');
        if (greetingAvatar) greetingAvatar.src = imageData;
        
        showToast('Profile image saved permanently!', 'success');
    }
}

// Update the image upload handler
document.getElementById('imageUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64data = event.target.result;
            document.getElementById('imagePreview').src = base64data;
            uploadedImageData = base64data; // Store base64 directly, not blob URL
        };
        reader.readAsDataURL(file); // This creates base64 directly
    }
});

// Update save image button handler
document.getElementById('saveImageBtn')?.addEventListener('click', () => {
    if (uploadedImageData) {
        saveProfileImage(uploadedImageData);
        closeImageUploadModal();
    } else {
        showToast('Please select an image first', 'error');
    }
});

// Update loadUserProfile function
function loadUserProfile() {
    const savedName = localStorage.getItem('profile_userName');
    const savedImage = localStorage.getItem('profile_image_permanent');
    const savedAvatarColor = localStorage.getItem('profile_avatarColor') || '2563EB';
    
    if (savedName) {
        document.getElementById('userName').textContent = savedName;
    }
    
    if (savedImage && savedImage.startsWith('data:image')) {
        document.getElementById('profileAvatar').src = savedImage;
    } else if (savedImage) {
        // If it's not base64, try to use it but warn
        console.warn('Image not in base64 format:', savedImage.substring(0, 50));
        document.getElementById('profileAvatar').src = savedImage;
    } else {
        const userName = savedName || 'User';
        document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?background=${savedAvatarColor}&color=fff&bold=true&size=180&name=${encodeURIComponent(userName)}`;
    }
}

function saveAvatarColor(color) {
    localStorage.setItem('profile_avatarColor', color);
    const userName = document.getElementById('userName').textContent;
    document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?background=${color}&color=fff&bold=true&size=120&name=${encodeURIComponent(userName)}`;
    showToast('Avatar color updated!', 'success');
}

function saveUserName(name) {
    if (name && name.trim()) {
        localStorage.setItem('profile_userName', name.trim());
        document.getElementById('userName').textContent = name.trim();
        
        const savedImage = localStorage.getItem('profile_image');
        if (savedImage) {
            document.getElementById('profileAvatar').src = savedImage;
        } else {
            const savedColor = localStorage.getItem('profile_avatarColor') || '2563EB';
            document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?background=${savedColor}&color=fff&bold=true&size=120&name=${encodeURIComponent(name.trim())}`;
        }
        
        showToast('Username updated!', 'success');
    }
}

// ============ HELPER FUNCTION TO GET ITEMS BY STATUS ============
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
                items.push({ ...item, sourceCategory: targetStatus });
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
                    items.push({ ...item, sourceCategory: category });
                }
            });
        }
    }
    
    return items;
}

// ============ STATS FUNCTIONS ============
function updateStats() {
    const allData = getAllCategoryData();
    
    // Get counts by scanning all items with specific status
    const watching = getItemsByStatus('Watching').length;
    const planToWatch = getItemsByStatus('Plan to Watch').length;
    const onHold = getItemsByStatus('On Hold').length;
    const dropped = getItemsByStatus('Dropped').length;
    const completed = getItemsByStatus('Completed').length;
    
    // Count total items from real categories (excluding status categories)
    let totalItems = 0;
    let totalCategories = 0;
    const excludeCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    
    for (const category in allData) {
        if (!excludeCategories.includes(category)) {
            totalCategories++;
            totalItems += allData[category].length;
        }
    }
    
    const favorites = allData['Favorites']?.length || 0;
    
    // Update UI
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('totalCategoriesCount').textContent = totalCategories;
    document.getElementById('favoritesCount').textContent = favorites;
    document.getElementById('wishlistCount').textContent = planToWatch;
    document.getElementById('completedCount').textContent = completed;
    
    console.log('Stats updated:', { totalItems, totalCategories, favorites, planToWatch, completed, watching, onHold, dropped });
    
    return { 
        totalItems, totalCategories, favorites, planToWatch, completed,
        watching, onHold, dropped, allData 
    };
}

// ============ CHARTS ============
function getCategoryColor(categoryName) {
    const colors = JSON.parse(localStorage.getItem('category_colors') || '{}');
    if (colors[categoryName]) return colors[categoryName];
    const defaultColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1'];
    const index = Math.abs(categoryName.length % defaultColors.length);
    return defaultColors[index];
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

function updateCharts(allData, stats) {
    // ============ CATEGORY CHART ============
    const excludeCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    const categoryStats = {};
    
    for (const category in allData) {
        if (!excludeCategories.includes(category)) {
            categoryStats[category] = allData[category].length;
        }
    }
    
    const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const categoryLabels = sortedCategories.map(c => c[0]);
    const categoryData = sortedCategories.map(c => c[1]);
    const categoryColors = categoryLabels.map(cat => getCategoryColor(cat));
    
    // ============ STATUS CHART - Get from ALL items ============
    const statusStats = {
        'Watching': getItemsByStatus('Watching').length,
        'Plan to Watch': getItemsByStatus('Plan to Watch').length,
        'On Hold': getItemsByStatus('On Hold').length,
        'Dropped': getItemsByStatus('Dropped').length,
        'Completed': getItemsByStatus('Completed').length
    };
    
    const statusLabels = Object.keys(statusStats);
    const statusData = Object.values(statusStats);
    const statusColors = statusLabels.map(status => getStatusColor(status));
    
    console.log('Category Chart Data:', { categoryLabels, categoryData });
    console.log('Status Chart Data:', { statusLabels, statusData });
    
    // Destroy existing charts
    if (categoryChart) categoryChart.destroy();
    if (statusChart) statusChart.destroy();
    
    // Create Category Chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx && categoryLabels.length > 0) {
        categoryChart = new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: categoryColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} items (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else if (categoryCtx) {
        document.getElementById('categoryChart').parentElement.innerHTML = '<div class="empty-chart"><p>No categories with items yet</p></div>';
    }
    
    // Create Status Chart
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (statusCtx && statusData.some(v => v > 0)) {
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} items (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else if (statusCtx) {
        document.getElementById('statusChart').parentElement.innerHTML = '<div class="empty-chart"><p>No status data yet</p></div>';
    }
}

// ============ DATA VIEW MODAL ============
let currentViewType = '';
let currentViewFilters = { category: 'all', sort: 'recent' };
let currentViewSearch = '';

function openDataViewModal(type, title) {
    currentViewType = type;
    document.getElementById('dataModalTitle').textContent = title;
    document.getElementById('dataViewModal').style.display = 'flex';
    renderDataViewContent();
}

function closeDataViewModal() {
    document.getElementById('dataViewModal').style.display = 'none';
}

function openItemDetailModal(item) {
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('itemDetailBody').innerHTML = `
        <div class="detail-row"><span class="detail-label">Title:</span><span class="detail-value">${escapeHtml(item.title)}</span></div>
        <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">${item.category || item.sourceCategory || 'Unknown'}</span></div>
        <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value">${item.status || 'Unknown'}</span></div>
        ${item.progress ? `<div class="detail-row"><span class="detail-label">Progress:</span><span class="detail-value">${escapeHtml(item.progress)}</span></div>` : ''}
        ${item.season ? `<div class="detail-row"><span class="detail-label">Season:</span><span class="detail-value">${escapeHtml(item.season)}</span></div>` : ''}
        ${item.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${escapeHtml(item.notes)}</span></div>` : ''}
        <div class="detail-row"><span class="detail-label">Added:</span><span class="detail-value">${new Date(item.dateAdded).toLocaleDateString()}</span></div>
    `;
    document.getElementById('itemDetailModal').style.display = 'flex';
}

function closeItemDetailModal() {
    document.getElementById('itemDetailModal').style.display = 'none';
}

function renderDataViewContent() {
    const body = document.getElementById('dataModalBody');
    if (!body) return;
    
    let items = [];
    
    if (currentViewType === 'total') {
        items = getAllItemsAcrossCategories();
    } else if (currentViewType === 'categories') {
        items = getAllCategoriesList();
    } else if (currentViewType === 'favorites') {
        items = getCategoryData('Favorites');
    } else if (currentViewType === 'wishlist') {
        items = getItemsByStatus('Plan to Watch');
    } else if (currentViewType === 'completed') {
        items = getItemsByStatus('Completed');
    } else if (currentViewType.startsWith('status_')) {
        const status = currentViewType.replace('status_', '');
        items = getItemsByStatus(status);
    }
    
    // Apply filters if needed
    let filteredItems = [...items];
    if (currentViewType !== 'categories') {
        if (currentViewFilters.category !== 'all') {
            filteredItems = filteredItems.filter(item => 
                (item.category || item.sourceCategory) === currentViewFilters.category
            );
        }
        
        if (currentViewSearch) {
            const term = currentViewSearch.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.title && item.title.toLowerCase().includes(term)
            );
        }
        
        switch (currentViewFilters.sort) {
            case 'az':
                filteredItems.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'za':
                filteredItems.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
                break;
            case 'recent':
                filteredItems.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
                break;
        }
    }
    
    // Build HTML
    let html = '';
    
    if (currentViewType !== 'categories') {
        html += `
            <div class="data-view-filters">
                <div class="filter-row">
                    <div class="filter-label"><i class="fas fa-search"></i> Search</div>
                    <input type="text" id="viewSearchInput" class="modern-search" placeholder="Search by title..." value="${escapeHtml(currentViewSearch)}">
                </div>
                <div class="filter-row">
                    <div class="filter-label"><i class="fas fa-tags"></i> Category</div>
                    <div class="modern-chips" id="viewCategoryFilters"></div>
                </div>
                <div class="filter-row">
                    <div class="filter-label"><i class="fas fa-sort"></i> Sort By</div>
                    <div class="modern-chips" id="viewSortFilters"></div>
                </div>
            </div>
        `;
    }
    
    if (currentViewType === 'categories') {
        html += `<div class="categories-list">`;
        filteredItems.forEach(cat => {
            const catItems = getCategoryData(cat);
            const catColor = getCategoryColor(cat);
            html += `
                <div class="data-view-item">
                    <div class="data-view-info">
                        <h4><i class="fas fa-folder" style="color: ${catColor};"></i> ${escapeHtml(cat)}</h4>
                        <div class="data-view-badges">
                            <span class="data-view-badge" style="background: ${catColor}; color: white;">${catItems.length} items</span>
                        </div>
                    </div>
                    <button class="data-view-btn" onclick="viewCategoryItems('${escapeHtml(cat)}')">View Items</button>
                </div>
            `;
        });
        html += `</div>`;
    } else if (filteredItems.length === 0) {
        html += `<div class="empty-state"><i class="fas fa-inbox"></i><p>No items found</p></div>`;
    } else {
        filteredItems.forEach(item => {
            const category = item.category || item.sourceCategory || 'Unknown';
            const categoryColor = getCategoryColor(category);
            const status = item.status || 'Unknown';
            const statusColor = getStatusColor(status);
            
            html += `
                <div class="data-view-item">
                    <div class="data-view-info">
                        <h4>${escapeHtml(item.title)}</h4>
                        <div class="data-view-badges">
                            <span class="data-view-badge" style="background: ${categoryColor}; color: white;">${category}</span>
                            <span class="data-view-badge" style="background: ${statusColor}; color: white;">${status}</span>
                            ${item.progress ? `<span class="data-view-badge" style="background: #6B7280; color: white;"><i class="fas fa-chart-line"></i> ${escapeHtml(item.progress)}</span>` : ''}
                            ${item.season ? `<span class="data-view-badge" style="background: #6B7280; color: white;"><i class="fas fa-layer-group"></i> ${escapeHtml(item.season)}</span>` : ''}
                        </div>
                    </div>
                    <button class="data-view-btn" onclick="viewItemDetailsFromModal(${item.id})">View</button>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    
    if (currentViewType !== 'categories') {
        const searchInput = document.getElementById('viewSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentViewSearch = e.target.value;
                renderDataViewContent();
            });
        }
        
        const categoryContainer = document.getElementById('viewCategoryFilters');
        if (categoryContainer) {
            const allCategories = getAllRealCategories();
            const categoryChips = [
                { value: 'all', label: 'All' },
                ...allCategories.map(cat => ({ value: cat, label: cat }))
            ];
            categoryContainer.innerHTML = categoryChips.map(chip => `
                <button class="modern-chip ${currentViewFilters.category === chip.value ? 'active' : ''}" data-filter="category" data-value="${chip.value}">
                    ${chip.label}
                </button>
            `).join('');
            
            categoryContainer.querySelectorAll('.modern-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    currentViewFilters.category = chip.dataset.value;
                    renderDataViewContent();
                });
            });
        }
        
        const sortContainer = document.getElementById('viewSortFilters');
        if (sortContainer) {
            const sortChips = [
                { value: 'recent', label: 'Recent' },
                { value: 'az', label: 'A-Z' },
                { value: 'za', label: 'Z-A' }
            ];
            sortContainer.innerHTML = sortChips.map(chip => `
                <button class="modern-chip ${currentViewFilters.sort === chip.value ? 'active' : ''}" data-filter="sort" data-value="${chip.value}">
                    ${chip.label}
                </button>
            `).join('');
            
            sortContainer.querySelectorAll('.modern-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    currentViewFilters.sort = chip.dataset.value;
                    renderDataViewContent();
                });
            });
        }
    }
}

function getAllItemsAcrossCategories() {
    const allData = getAllCategoryData();
    const items = [];
    const excludeCategories = ['Favorites', 'Wishlist'];
    
    for (const category in allData) {
        if (!excludeCategories.includes(category)) {
            allData[category].forEach(item => {
                items.push({ ...item, sourceCategory: category });
            });
        }
    }
    return items;
}

function getAllRealCategories() {
    const allData = getAllCategoryData();
    const excludeCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    return Object.keys(allData).filter(cat => !excludeCategories.includes(cat));
}

function getAllCategoriesList() {
    const allData = getAllCategoryData();
    const excludeCategories = ['Watching', 'Plan to Watch', 'On Hold', 'Dropped', 'Completed', 'Favorites', 'Wishlist'];
    return Object.keys(allData).filter(cat => !excludeCategories.includes(cat));
}

function viewCategoryItems(category) {
    const items = getCategoryData(category);
    const body = document.getElementById('dataModalBody');
    if (!body) return;
    
    let html = `<div class="categories-list">`;
    items.forEach(item => {
        const statusColor = getStatusColor(item.status);
        html += `
            <div class="data-view-item">
                <div class="data-view-info">
                    <h4>${escapeHtml(item.title)}</h4>
                    <div class="data-view-badges">
                        <span class="data-view-badge" style="background: ${statusColor}; color: white;">${item.status}</span>
                        ${item.progress ? `<span class="data-view-badge" style="background: #6B7280; color: white;"><i class="fas fa-chart-line"></i> ${escapeHtml(item.progress)}</span>` : ''}
                    </div>
                </div>
                <button class="data-view-btn" onclick="viewItemDetailsFromModal(${item.id})">View</button>
            </div>
        `;
    });
    html += `<div style="margin-top: 15px;"><button class="data-view-btn" onclick="renderDataViewContent()"><i class="fas fa-arrow-left"></i> Back</button></div>`;
    
    body.innerHTML = html;
}

function viewItemDetailsFromModal(id) {
    let item = null;
    const allData = getAllCategoryData();
    for (const category in allData) {
        const found = allData[category].find(i => i.id === id);
        if (found) {
            item = found;
            break;
        }
    }
    
    if (item) {
        openItemDetailModal(item);
    }
}

// ============ DATA MANAGEMENT ============
function exportData() {
    const data = getAllCategoryData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `series_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (typeof importedData === 'object' && importedData !== null) {
                    localStorage.setItem('seriesTracker_categoryData', JSON.stringify(importedData));
                    showToast('Data imported successfully! Reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (error) {
                showToast('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
        const defaultCategories = {
            'Anime': [], 'Manga': [], 'Manwha': [], 'TV Series': [], 'Movie': [],
            'Watching': [], 'Completed': [], 'Plan to Watch': [], 'On Hold': [], 'Dropped': [],
            'Favorites': [], 'Wishlist': []
        };
        localStorage.setItem('seriesTracker_categoryData', JSON.stringify(defaultCategories));
        localStorage.removeItem('profile_userName');
        localStorage.removeItem('profile_avatarColor');
        localStorage.removeItem('profile_image');
        sessionStorage.clear();
        showToast('All data reset! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1500);
    }
}

// ============ NAVIGATION & FOOTER ============
function initNavigation() {
    document.getElementById('backBtn')?.addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('refreshBtn')?.addEventListener('click', () => window.location.reload());
}

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

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ MODAL FUNCTIONS ============
function closeEditNameModal() {
    document.getElementById('editNameModal').style.display = 'none';
}

function closeImageUploadModal() {
    document.getElementById('imageUploadModal').style.display = 'none';
    if (uploadedImageData) {
        URL.revokeObjectURL(uploadedImageData);
        uploadedImageData = null;
    }
}

// ============ INITIALIZATION ============
async function initProfilePage() {
    await showLoadingAnimation();
    
    loadUserProfile();
    updateGreetingAndClock();
    const stats = updateStats();
    updateCharts(stats.allData, stats);
    initNavigation();
    initFooterBar();
    
    // Edit name modal
    document.getElementById('editNameBtn')?.addEventListener('click', () => {
        document.getElementById('editNameModal').style.display = 'flex';
        document.getElementById('newUserName').value = document.getElementById('userName').textContent;
    });
    document.getElementById('saveNameBtn')?.addEventListener('click', () => {
        const newName = document.getElementById('newUserName').value.trim();
        if (newName) saveUserName(newName);
        closeEditNameModal();
    });
    
    // Edit avatar/image modal
    document.getElementById('editAvatarBtn')?.addEventListener('click', () => {
        document.getElementById('imageUploadModal').style.display = 'flex';
        document.getElementById('imagePreview').src = document.getElementById('profileAvatar').src;
    });
    
    // Image upload preview
    document.getElementById('imageUpload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (uploadedImageData) {
                URL.revokeObjectURL(uploadedImageData);
            }
            uploadedImageData = URL.createObjectURL(file);
            document.getElementById('imagePreview').src = uploadedImageData;
        }
    });
    
    // Color options for avatar
    document.querySelectorAll('.color-mini').forEach(option => {
        option.addEventListener('click', () => {
            const color = option.dataset.color;
            saveAvatarColor(color);
            closeImageUploadModal();
        });
    });
    
    // Save image button
    document.getElementById('saveImageBtn')?.addEventListener('click', () => {
        if (uploadedImageData) {
            saveProfileImage(uploadedImageData);
            closeImageUploadModal();
        } else {
            showToast('Please select an image first', 'error');
        }
    });
    
    // Quick stats buttons
    document.querySelectorAll('.stat-card-outline').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.stat;
            const titles = { 
                total: 'All Items', 
                categories: 'All Categories', 
                favorites: 'Favorites', 
                wishlist: 'Wishlist (Plan to Watch)', 
                completed: 'Completed Items' 
            };
            openDataViewModal(type, titles[type]);
        });
    });
    
    // Status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            openDataViewModal(`status_${status}`, `${status} Items`);
        });
    });
    
    // Data management
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataBtn')?.addEventListener('click', importData);
    document.getElementById('resetDataBtn')?.addEventListener('click', resetData);
    
    setInterval(updateGreetingAndClock, 1000);
}

// Make functions global
window.closeDataViewModal = closeDataViewModal;
window.closeItemDetailModal = closeItemDetailModal;
window.viewCategoryItems = viewCategoryItems;
window.viewItemDetailsFromModal = viewItemDetailsFromModal;
window.renderDataViewContent = renderDataViewContent;
window.closeEditNameModal = closeEditNameModal;
window.closeImageUploadModal = closeImageUploadModal;

document.addEventListener('DOMContentLoaded', initProfilePage);