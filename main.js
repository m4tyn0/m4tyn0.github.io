// File list
const files = ['readme.md', 'dev.md', 'gastro.md', 'stack.md', 'contact.md'];

// Initialize
let currentFile = 'readme.md';
let sessionStartTime = Date.now();
let visitorLocation = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    loadFile(currentFile);
    initializeFooter();
});

// Initialize menu
function initializeMenu() {
    const fileList = document.getElementById('file-list');
    files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file;
        li.addEventListener('click', () => {
            currentFile = file;
            loadFile(file);
            updateActiveMenuItem();
        });
        fileList.appendChild(li);
    });
    updateActiveMenuItem();
}

// Update active menu item
function updateActiveMenuItem() {
    const items = document.querySelectorAll('.menu li');
    items.forEach((item, index) => {
        if (files[index] === currentFile) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Load and render markdown file
async function loadFile(filename) {
    const contentDiv = document.getElementById('markdown-content');
    
    try {
        const response = await fetch(`files/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        const markdown = await response.text();
        contentDiv.innerHTML = marked.parse(markdown);
    } catch (error) {
        contentDiv.innerHTML = `<p>Error loading ${filename}: ${error.message}</p>`;
    }
}

// Footer functionality
function initializeFooter() {
    // Session timer
    updateSessionTimer();
    setInterval(updateSessionTimer, 1000);
    
    // Visitor location
    fetchVisitorLocation();
    
    // Time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

// Session timer
function updateSessionTimer() {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const formatted = `[session ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`;
    document.getElementById('session-timer').textContent = formatted;
}

// Fetch visitor location
async function fetchVisitorLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
            throw new Error('Failed to fetch location');
        }
        const data = await response.json();
        visitorLocation = {
            city: data.city || 'unknown',
            country: data.country_name || 'unknown',
            countryCode: data.country_code || data.country || 'unknown'
        };
        updateVisitorLocation();
    } catch (error) {
        // Fallback to alternative API
        try {
            const response = await fetch('https://ip-api.com/json/');
            if (!response.ok) {
                throw new Error('Failed to fetch location');
            }
            const data = await response.json();
            visitorLocation = {
                city: data.city || 'unknown',
                country: data.country || 'unknown',
                countryCode: data.countryCode || data.country || 'unknown'
            };
            updateVisitorLocation();
        } catch (fallbackError) {
            document.getElementById('visitor-location').textContent = '[visitor from unknown]';
        }
    }
}

// Update visitor location display
function updateVisitorLocation() {
    if (visitorLocation) {
        const formatted = `[visitor from ${visitorLocation.city}, ${visitorLocation.countryCode.toLowerCase()}]`;
        document.getElementById('visitor-location').textContent = formatted;
    }
}

// Time display
function updateTimeDisplay() {
    // Visitor's local time (you)
    const visitorTime = new Date();
    const visitorTimeStr = visitorTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Site owner's local time (me) - CET/CEST (Prague timezone)
    const now = new Date();
    const myTimeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Prague',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Determine if CET or CEST for Prague timezone
    // Get timezone abbreviation from Intl API
    const formatter = new Intl.DateTimeFormat('en', {
        timeZone: 'Europe/Prague',
        timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(part => part.type === 'timeZoneName')?.value || 'CET';
    const timezone = tzName.toLowerCase();
    
    const formatted = `[you: ${visitorTimeStr} | me: ${myTimeStr} ${timezone}]`;
    document.getElementById('time-display').textContent = formatted;
}

