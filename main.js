// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

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

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    createNoiseTexture();
    initializeFooter();

    const contentDiv = document.getElementById('markdown-content');
    if (contentDiv) {
        enhanceCodeBlocks(contentDiv);
        addAhojTooltip(contentDiv);
    }
});

function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL('image/png');

    const noiseOverlay = document.createElement('div');
    noiseOverlay.id = 'noise-overlay';
    noiseOverlay.style.backgroundImage = `url(${dataURL})`;
    document.body.appendChild(noiseOverlay);
}

function enhanceCodeBlocks(contentDiv) {
    const preElements = contentDiv.querySelectorAll('pre, code');
    preElements.forEach(el => {
        el.style.whiteSpace = 'pre';
        el.style.fontFamily = "'Andale Mono', monospace";
    });

    const codeBlocks = contentDiv.querySelectorAll('pre code, pre');
    codeBlocks.forEach(block => {
        if (block.textContent.includes('█') || block.textContent.includes('░')) {
            const html = block.innerHTML;
            let charIndex = 0;
            const wrapped = html.replace(/[█░]/g, (match) => {
                const index = charIndex++;
                return `<span class="loading-bar-char" style="--char-index: ${index}">${match}</span>`;
            });
            block.innerHTML = wrapped;
        }
    });
}

function initializeFooter() {
    updateSessionTimer();
    setInterval(updateSessionTimer, 1000);
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

function updateSessionTimer() {
    if (!window.__sessionStartTime) {
        window.__sessionStartTime = Date.now();
    }
    const elapsed = Math.floor((Date.now() - window.__sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const formatted = `[session ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`;
    const el = document.getElementById('session-timer');
    if (el) el.textContent = formatted;
}

function updateTimeDisplay() {
    const visitorTime = new Date();
    const visitorTimeStr = visitorTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const now = new Date();
    const myTimeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Prague',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const formatter = new Intl.DateTimeFormat('en', {
        timeZone: 'Europe/Prague',
        timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(part => part.type === 'timeZoneName')?.value || 'CET';
    const timezone = tzName.toLowerCase();

    const formatted = `[you: ${visitorTimeStr} | me: ${myTimeStr} ${timezone}]`;
    const el = document.getElementById('time-display');
    if (el) el.textContent = formatted;
}

function addAhojTooltip(container) {
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
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

            const fragment = document.createDocumentFragment();
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
            parent.replaceChild(fragment, textNode);
        }
    });
}
