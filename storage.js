// storage.js - Data storage management (no STORAGE_KEYS declaration here)

// Default categories
const DEFAULT_CATEGORIES = {
    'Watching': [],
    'Completed': [],
    'Plan to Watch': [],
    'On Hold': [],
    'Dropped': [],
    'Favorites': [],
    'Wishlist': []
};

// Initialize storage
function initializeStorage() {
    if (!localStorage.getItem('seriesTracker_categoryData')) {
        localStorage.setItem('seriesTracker_categoryData', JSON.stringify(DEFAULT_CATEGORIES));
    }
}

// Save specific category data
function saveCategoryData(categoryName, arrayData) {
    initializeStorage();
    const allData = getAllCategoryData();
    allData[categoryName] = arrayData;
    localStorage.setItem('seriesTracker_categoryData', JSON.stringify(allData));
}

// Get specific category data
function getCategoryData(categoryName) {
    initializeStorage();
    const allData = getAllCategoryData();
    return allData[categoryName] || [];
}

// Get all category data
function getAllCategoryData() {
    initializeStorage();
    const data = localStorage.getItem('seriesTracker_categoryData');
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

// Get all category names
function getCategoryNames() {
    const allData = getAllCategoryData();
    return Object.keys(allData);
}

// Add item to category
function addToCategory(categoryName, item) {
    const categoryData = getCategoryData(categoryName);
    categoryData.push(item);
    saveCategoryData(categoryName, categoryData);
    return true;
}

// Remove item from category
function removeFromCategory(categoryName, id) {
    const categoryData = getCategoryData(categoryName);
    const filtered = categoryData.filter(item => item.id !== id);
    saveCategoryData(categoryName, filtered);
    return true;
}

// Move item between categories
function moveItem(categoryFrom, categoryTo, id) {
    const fromData = getCategoryData(categoryFrom);
    const item = fromData.find(item => item.id === id);
    
    if (item) {
        removeFromCategory(categoryFrom, id);
        addToCategory(categoryTo, item);
        return true;
    }
    return false;
}

// Get all series across all categories
function getAllSeriesAcrossCategories() {
    const allData = getAllCategoryData();
    let allSeries = [];
    
    for (const category in allData) {
        if (allData.hasOwnProperty(category)) {
            allSeries = allSeries.concat(allData[category]);
        }
    }
    
    return allSeries;
}

// Clear specific category
function clearCategory(categoryName) {
    saveCategoryData(categoryName, []);
}

// Delete entire category
function deleteCategory(categoryName) {
    const allData = getAllCategoryData();
    delete allData[categoryName];
    localStorage.setItem('seriesTracker_categoryData', JSON.stringify(allData));
}

// Create new category
function createNewCategory(categoryName) {
    const allData = getAllCategoryData();
    if (!allData[categoryName]) {
        allData[categoryName] = [];
        localStorage.setItem('seriesTracker_categoryData', JSON.stringify(allData));
        return true;
    }
    return false;
}

// Rename category
function renameCategory(oldName, newName) {
    const allData = getAllCategoryData();
    if (allData[oldName] && !allData[newName]) {
        allData[newName] = allData[oldName];
        delete allData[oldName];
        localStorage.setItem('seriesTracker_categoryData', JSON.stringify(allData));
        return true;
    }
    return false;
}

// Export all data
function exportAllCategories() {
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
    showNotification('Data exported successfully!', 'success');
}

// Import data
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
                    showNotification('Data imported successfully! Reloading...', 'success');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                showNotification('Error importing data. Please check file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Reset all data
function resetAllData() {
    localStorage.setItem('seriesTracker_categoryData', JSON.stringify(DEFAULT_CATEGORIES));
    showNotification('All data has been reset! Reloading...', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Initialize on load
initializeStorage();