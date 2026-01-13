// File list
const files = ['readme.md', 'tech.md', 'gastronomy.md', 'contact.md'];

// Initialize
let currentFile = 'readme.md';
let sessionStartTime = Date.now();

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    createNoiseTexture();
    initializeMenu();
    loadFile(currentFile);
    initializeFooter();
});

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
        // Remove file extension for display
        const fileNameWithoutExt = file.replace(/\.md$/, '');
        li.textContent = `  ${fileNameWithoutExt}`;
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
    const items = document.querySelectorAll('.menu li.file-item');
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
    } catch (error) {
        contentDiv.innerHTML = `<p>Error loading ${filename}: ${error.message}</p>`;
    }
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
            const newHTML = text.replace(regex, '<span class="ahoj-tooltip" data-tooltip="I\'m Czech, not sea pirate">$1</span>');
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
}

