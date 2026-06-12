// theme.js - Theme management

function initTheme() {
    const savedTheme = localStorage.getItem('seriesTracker_theme');
    
    if (savedTheme === 'light') {
        applyTheme('light');
    } else if (savedTheme === 'dark') {
        applyTheme('dark');
    } else {
        // Default: follow system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(systemTheme);
    }
    
    listenForSystemTheme();
}

function applyTheme(themeName) {
    if (themeName === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (themeName === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Update Telegram theme if available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        if (themeName === 'dark') {
            tg.setBackgroundColor('#0f172a');
            tg.setHeaderColor('#2563EB');
        } else {
            tg.setBackgroundColor('#ffffff');
            tg.setHeaderColor('#2563EB');
        }
    }
}

function listenForSystemTheme() {
    const savedTheme = localStorage.getItem('seriesTracker_theme');
    
    if (!savedTheme) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            applyTheme(e.matches ? 'dark' : 'light');
        });
    }
}