// File list
const files = ['readme.md', 'tech.md', 'gastronomy.md', 'contact.md'];

// Initialize
let currentFile = 'readme.md';
let sessionStartTime = Date.now();
let latestLoadRequest = 0;

// Theme management
function initializeTheme() {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // Add theme toggle event listener
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggleText(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function updateThemeToggleText(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = `[${theme}]`;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Remove any Jekyll front matter that might appear as text
    removeFrontMatter();
    initializeTheme();
    createNoiseTexture();
    currentFile = getFileFromHash();
    initializeMenu();
    addAhojTooltip(document.getElementById('markdown-content'));
    loadFile(currentFile);
    initializeFooter();
    window.addEventListener('hashchange', () => {
        navigateToFile(getFileFromHash());
    });
});

// Remove Jekyll front matter if it appears as visible text
function removeFrontMatter() {
    // Walk through all text nodes in body and remove front matter patterns
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Only process text nodes that might contain front matter
                const text = node.textContent.trim();
                if (text.includes('---') && text.includes('layout:') && text.includes('null')) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        },
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        // Check if text node contains front matter pattern (more flexible matching)
        const text = node.textContent.trim();
        if (text.match(/^---[\s\S]*layout:\s*null[\s\S]*---$/)) {
            textNodes.push(node);
        }
    }
    
    // Remove front matter text nodes
    textNodes.forEach(textNode => {
        const parent = textNode.parentNode;
        if (parent) {
            parent.removeChild(textNode);
            // Clean up empty parent if it only contained the front matter
            if (parent.textContent.trim() === '' && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
                parent.parentNode?.removeChild(parent);
            }
        }
    });
    
    // Also check and clean body's direct text content (before any elements)
    let firstChild = document.body.firstChild;
    while (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        const text = firstChild.textContent.trim();
        if (text.match(/^---[\s\S]*layout:\s*null[\s\S]*---$/)) {
            const nextSibling = firstChild.nextSibling;
            document.body.removeChild(firstChild);
            firstChild = nextSibling;
        } else if (text === '') {
            // Remove empty text nodes
            const nextSibling = firstChild.nextSibling;
            document.body.removeChild(firstChild);
            firstChild = nextSibling;
        } else {
            break;
        }
    }
}

// Create noise texture for background
function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    // Generate noise pattern
    for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png');
    
    // Create noise overlay element
    const noiseOverlay = document.createElement('div');
    noiseOverlay.id = 'noise-overlay';
    noiseOverlay.style.backgroundImage = `url(${dataURL})`;
    document.body.appendChild(noiseOverlay);
}

// Initialize menu
function initializeMenu() {
    const fileList = document.getElementById('file-list');
    
    // Add parent directory (name)
    const parentDir = document.createElement('li');
    parentDir.className = 'parent-dir';
    parentDir.textContent = 'matěj/';
    parentDir.style.cursor = 'default';
    fileList.appendChild(parentDir);
    
    // Add files as children
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        const fileNameWithoutExt = file.replace(/\.md$/, '');
        const button = document.createElement('button');
        button.className = 'file-link';
        button.type = 'button';
        button.textContent = fileNameWithoutExt;
        button.dataset.file = file;
        button.addEventListener('click', () => {
            const nextHash = `#${fileNameWithoutExt}`;
            if (window.location.hash === nextHash) {
                navigateToFile(file);
            } else {
                window.location.hash = nextHash;
            }
        });
        li.appendChild(button);
        fileList.appendChild(li);
    });
    updateActiveMenuItem();
}

function getFileFromHash() {
    const section = window.location.hash.slice(1).toLowerCase();
    const matchingFile = files.find(file => file.replace(/\.md$/, '') === section);
    return matchingFile || 'readme.md';
}

function navigateToFile(file) {
    currentFile = file;
    updateActiveMenuItem();
    loadFile(file);
}

// Update active menu item
function updateActiveMenuItem() {
    const items = document.querySelectorAll('.menu li.file-item');
    items.forEach((item, index) => {
        const button = item.querySelector('.file-link');
        if (files[index] === currentFile) {
            item.classList.add('active');
            button.setAttribute('aria-current', 'page');
        } else {
            item.classList.remove('active');
            button.removeAttribute('aria-current');
        }
    });

}

// Load and render markdown file
async function loadFile(filename) {
    const contentDiv = document.getElementById('markdown-content');
    const requestId = ++latestLoadRequest;
    
    try {
        const response = await fetch(`files/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        const markdown = await response.text();
        if (requestId !== latestLoadRequest) return;
        
        // Configure marked to preserve whitespace in code blocks
        const html = marked.parse(markdown, {
            breaks: false,
            gfm: true
        });
        
        contentDiv.innerHTML = html;
        
        // Ensure all pre/code elements preserve whitespace
        const preElements = contentDiv.querySelectorAll('pre, code');
        preElements.forEach(el => {
            el.style.whiteSpace = 'pre';
            el.style.fontFamily = "'Andale Mono', monospace";
        });
        
        // Wrap block characters (█ and ░) in code blocks for loading animation
        const codeBlocks = contentDiv.querySelectorAll('pre code, pre');
        codeBlocks.forEach(block => {
            if (block.textContent.includes('█') || block.textContent.includes('░')) {
                // Replace each block character individually with wrapped spans
                const html = block.innerHTML;
                // Match each block character (█ or ░) and wrap it individually with index
                let charIndex = 0;
                const wrapped = html.replace(/[█░]/g, (match) => {
                    const index = charIndex++;
                    return `<span class="loading-bar-char" style="--char-index: ${index}">${match}</span>`;
                });
                block.innerHTML = wrapped;
            }
        });
        
        // Add tooltip to "ahoj" text
        addAhojTooltip(contentDiv);
        
        updateDocumentTitle(filename);
        if (window.matchMedia('(max-width: 768px)').matches) {
            window.scrollTo(0, 0);
        } else {
            document.querySelector('.content').scrollTo(0, 0);
        }
    } catch (error) {
        if (requestId !== latestLoadRequest) return;
        contentDiv.innerHTML = `<p>Error loading ${filename}: ${error.message}</p>`;
    }
}

// Keep the browser tab title in sync with the open section
function updateDocumentTitle(filename) {
    const baseTitle = 'matěj coufal — ai automation developer & live fire catering';
    const section = filename.replace(/\.md$/, '');
    document.title = section === 'readme' ? baseTitle : `${section} | ${baseTitle}`;
}

// Footer functionality
function initializeFooter() {
    // Session timer
    updateSessionTimer();
    setInterval(updateSessionTimer, 1000);
    
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

// Add tooltip to "ahoj" text
function addAhojTooltip(container) {
    // Walk through all text nodes and find "ahoj" (case-insensitive)
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip if parent is script, style, or already has tooltip
                const parent = node.parentNode;
                if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || 
                    parent.classList.contains('ahoj-tooltip')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent.match(/ahoj/i) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        },
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
        const parent = textNode.parentNode;
        const text = textNode.textContent;
        const regex = /(ahoj)/gi;
        
        if (regex.test(text)) {
            const newHTML = text.replace(regex, '<span class="ahoj-tooltip" data-tooltip="i\'m czech, not a sea pirate" tabindex="0">$1</span>');
            const temp = document.createElement('span');
            temp.innerHTML = newHTML;
            
            // Replace the text node with the new HTML
            const fragment = document.createDocumentFragment();
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
            parent.replaceChild(fragment, textNode);
        }
    });

    bindAhojTooltipEvents(container);
}

let ahojTooltipPopup = null;
let activeAhojTooltip = null;
let ahojDismissHandlerBound = false;

function ensureAhojTooltipPopup() {
    if (!ahojTooltipPopup) {
        ahojTooltipPopup = document.createElement('div');
        ahojTooltipPopup.id = 'ahoj-tooltip-popup';
        ahojTooltipPopup.setAttribute('role', 'tooltip');
        ahojTooltipPopup.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ahojTooltipPopup);
    }
    return ahojTooltipPopup;
}

function showAhojTooltip(target) {
    const popup = ensureAhojTooltipPopup();
    popup.textContent = target.dataset.tooltip;

    const rect = target.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top - 5}px`;
    popup.style.transform = 'translate(-50%, -100%)';
    popup.classList.add('is-visible');
    popup.setAttribute('aria-hidden', 'false');
    activeAhojTooltip = target;
}

function hideAhojTooltip() {
    if (ahojTooltipPopup) {
        ahojTooltipPopup.classList.remove('is-visible');
        ahojTooltipPopup.setAttribute('aria-hidden', 'true');
    }
    activeAhojTooltip = null;
}

function bindAhojTooltipEvents(container) {
    container.querySelectorAll('.ahoj-tooltip').forEach(el => {
        if (el.dataset.tooltipBound) return;
        el.dataset.tooltipBound = 'true';
        el.addEventListener('mouseenter', () => showAhojTooltip(el));
        el.addEventListener('mouseleave', hideAhojTooltip);
        el.addEventListener('focus', () => showAhojTooltip(el));
        el.addEventListener('blur', hideAhojTooltip);
        el.addEventListener('click', event => {
            event.stopPropagation();
            if (activeAhojTooltip === el) {
                hideAhojTooltip();
            } else {
                showAhojTooltip(el);
            }
        });
    });

    if (!ahojDismissHandlerBound) {
        document.addEventListener('click', hideAhojTooltip);
        ahojDismissHandlerBound = true;
    }
}

