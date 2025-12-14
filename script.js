const fontList = ['Monaco', 'Menlo', 'Courier New', 'Inconsolata', 'Courier', 'monospace'];
let currentFont = 'monospace';
let currentFontSize = 14;
let currentDensity = 80;
let currentColorTheme = 'green';
let dataMode = false;
let matrixVisible = true; // faucet: ON/OFF

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let canvas = null;
let ctx = null;
let dpr = 1;
let canvasWidth = 0;
let canvasHeight = 0;

// Canvas particles (one per character)
const particles = [];

// Color themes
const colorThemes = {
  green: { color: '#0f0', glow: '#0f0', label: 'Green' },
  cyan: { color: '#0ff', glow: '#0ff', label: 'Cyan' },
  purple: { color: '#f0f', glow: '#f0f', label: 'Purple' },
  blue: { color: '#00f', glow: '#00f', label: 'Blue' },
  white: { color: '#fff', glow: '#fff', label: 'White' }
};

// Markdown to HTML conversion (simple)
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Escape special HTML characters first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // Code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--theme-glow);">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(\n<li>.*?<\/li>)+/s, function(match) {
    return '<ul>' + match + '</ul>';
  });
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  return html;
}

// LocalStorage management for preferences
const STORAGE_KEY = 'matrixEffectPreferences';
const DEFAULTS_STORAGE_KEY = 'matrixEffectDefaults';
const COLLAPSE_STATE_KEY = 'matrixEffectCollapseState';

function loadPreferences() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored preferences:', e);
      return getDefaultPreferences();
    }
  }
  return getDefaultPreferences();
}

function getDefaultPreferences() {
  // Check if user has saved custom defaults
  const customDefaults = localStorage.getItem(DEFAULTS_STORAGE_KEY);
  if (customDefaults) {
    try {
      return JSON.parse(customDefaults);
    } catch (e) {
      console.warn('Failed to parse custom defaults:', e);
    }
  }
  
  // Return hardcoded defaults
  return {
    font: 'monospace',
    fontSize: 14,
    density: 80,
    colorTheme: 'green',
    dataMode: false,
    matrixVisible: true
  };
}

function savePreferences() {
  const prefs = {
    font: currentFont,
    fontSize: currentFontSize,
    density: currentDensity,
    colorTheme: currentColorTheme,
    dataMode: dataMode,
    matrixVisible: matrixVisible
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function saveAsDefault() {
  const customDefaults = {
    font: currentFont,
    fontSize: currentFontSize,
    density: currentDensity,
    colorTheme: currentColorTheme,
    dataMode: dataMode,
    matrixVisible: matrixVisible
  };
  localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(customDefaults));
}

function resetPreferences() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DEFAULTS_STORAGE_KEY);
  localStorage.removeItem(COLLAPSE_STATE_KEY);
  location.reload();
}

// Collapse state management
function loadCollapseState() {
  const stored = localStorage.getItem(COLLAPSE_STATE_KEY);
  return stored === 'true'; // Default to true (collapsed/closed)
}

function saveCollapseState(isCollapsed) {
  localStorage.setItem(COLLAPSE_STATE_KEY, isCollapsed.toString());
}

// CSS Variable management for theming
function applyTheme(colorTheme) {
  const theme = colorThemes[colorTheme];
  const root = document.documentElement;
  root.style.setProperty('--theme-color', theme.color);
  root.style.setProperty('--theme-glow', theme.glow);
}

// Throttle animation frame updates
const FRAME_INTERVAL = 33; // ~30fps

// Debounce helper for slider updates
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function getTheme() {
  return colorThemes[currentColorTheme] || colorThemes.green;
}

function randomChar() {
  return dataMode ? (Math.random() < 0.5 ? '0' : '1') : chars[Math.floor(Math.random() * chars.length)];
}

function getCanvasFont() {
  // Quotes are fine even for generic families, and help with names like Courier New.
  return `${currentFontSize}px "${currentFont}", monospace`;
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  dpr = window.devicePixelRatio || 1;
  canvasWidth = Math.max(1, Math.floor(window.innerWidth));
  canvasHeight = Math.max(1, Math.floor(window.innerHeight));
  canvas.width = Math.floor(canvasWidth * dpr);
  canvas.height = Math.floor(canvasHeight * dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = 'top';
}

function spawnParticle({ atTop } = { atTop: false }) {
  const x = Math.random() * canvasWidth;
  const y = atTop ? (-20 - Math.random() * 120) : (Math.random() * canvasHeight);
  particles.push({
    x,
    y,
    speed: 2 + Math.random() * 6,
    char: randomChar(),
    nextChange: Math.random() * 100
  });
}

function trimToDensity() {
  while (particles.length > currentDensity) particles.pop();
}

function setCursorVisible(visible) {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  cursor.classList.toggle('visible', visible);
}

function detectSystemFont() {
  // Check if fonts are actually available by testing rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const testString = 'M';
  const testFontSize = '20px';
  
  // Get baseline width with fallback
  ctx.font = `${testFontSize} monospace`;
  const baselineWidth = ctx.measureText(testString).width;
  
  // Try each font to see if it renders differently (indicating it's available)
  for (let font of fontList) {
    try {
      ctx.font = `${testFontSize} "${font}", monospace`;
      const width = ctx.measureText(testString).width;
      // If width differs significantly, font is likely available
      if (Math.abs(width - baselineWidth) > 1) {
        currentFont = font;
        break;
      }
    } catch(e) {
      // Font not available, continue
    }
  }
  
  return currentFont;
}

function populateFontSelector() {
  const selector = document.getElementById('fontDropdown');
  fontList.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    if (font === currentFont) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
  
  selector.addEventListener('change', (e) => {
    currentFont = e.target.value;
    savePreferences();
  });
  
  // Add size slider control with debouncing
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeLabel = document.getElementById('sizeLabel');
  sizeSlider.value = currentFontSize;
  sizeLabel.textContent = currentFontSize + 'px';
  
  const debouncedSizeUpdate = debounce((value) => {
    currentFontSize = parseInt(value);
    sizeLabel.textContent = currentFontSize + 'px';
    savePreferences();
  }, 100);
  
  sizeSlider.addEventListener('input', (e) => {
    debouncedSizeUpdate(e.target.value);
  });

  // Add density slider control with debouncing
  const densitySlider = document.getElementById('densitySlider');
  const densityLabel = document.getElementById('densityLabel');
  densitySlider.value = currentDensity;
  densityLabel.textContent = currentDensity;
  
  const debouncedDensityUpdate = debounce((value) => {
    currentDensity = parseInt(value);
    densityLabel.textContent = currentDensity;
    trimToDensity();
    savePreferences();
  }, 150);
  
  densitySlider.addEventListener('input', (e) => {
    debouncedDensityUpdate(e.target.value);
  });

  // Add color theme selector
  const colorThemeSelector = document.getElementById('colorTheme');
  colorThemeSelector.value = currentColorTheme;
  colorThemeSelector.addEventListener('change', (e) => {
    currentColorTheme = e.target.value;
    applyTheme(currentColorTheme);
    savePreferences();
  });

  // Add data mode toggle
  const dataModeToggle = document.getElementById('dataModeToggle');
  dataModeToggle.checked = dataMode;
  dataModeToggle.addEventListener('change', (e) => {
    dataMode = e.target.checked;
    savePreferences();
  });

  // Add matrix display toggle
  const matrixToggleBtn = document.getElementById('matrixToggleBtn');
  const cursor = document.getElementById('cursor');
  
  matrixToggleBtn.addEventListener('click', () => {
    matrixVisible = !matrixVisible;
    if (matrixVisible) {
      // Water faucet ON: resume animation, hide cursor
      // Don't need to regenerate - animation will naturally refill as recycling resumes
      cursor.classList.remove('visible');
      matrixToggleBtn.style.opacity = '1';
    } else {
      // Water faucet OFF: freeze animation, show cursor
      // Cursor shows when the last characters finish draining.
      matrixToggleBtn.style.opacity = '0.5';
    }
    savePreferences();
  });
  // Set initial button state
  if (!matrixVisible) {
    matrixToggleBtn.style.opacity = '0.5';
  }

  // Add reset button functionality
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings to defaults?')) {
      resetPreferences();
    }
  });

  // Add save as default button functionality
  const saveDefaultBtn = document.getElementById('saveDefaultBtn');
  saveDefaultBtn.addEventListener('click', () => {
    saveAsDefault();
    alert('Current settings saved as defaults!');
  });

  // Add control panel toggle functionality
  const toggleBtn = document.getElementById('toggleBtn');
  const controlContent = document.getElementById('controlContent');
  const controlPanel = document.getElementById('controlPanel');
  let fadeTimeout;
  
  // Load and apply saved collapse state on page load
  const isCollapsed = loadCollapseState();
  if (isCollapsed) {
    controlContent.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    controlContent.classList.toggle('collapsed');
    const nowCollapsed = controlContent.classList.contains('collapsed');
    saveCollapseState(nowCollapsed);
    
    // Keep panel visible when toggling
    controlPanel.classList.remove('faded');
    clearTimeout(fadeTimeout);
  });

  // Fade out on mouse leave (only when collapsed)
  controlPanel.addEventListener('mouseleave', () => {
    if (controlContent.classList.contains('collapsed')) {
      fadeTimeout = setTimeout(() => {
        controlPanel.classList.add('faded');
      }, 2000); // 2 second delay before fading
    }
  });

  // Keep visible on mouse enter
  controlPanel.addEventListener('mouseenter', () => {
    clearTimeout(fadeTimeout);
    controlPanel.classList.remove('faded');
  });

  // Add refresh button functionality
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', () => {
    // Save current collapse state before reload
    const controlContent = document.getElementById('controlContent');
    saveCollapseState(controlContent.classList.contains('collapsed'));
    location.reload();
  });

  // Add README modal functionality
  const readmeBtn = document.getElementById('readmeBtn');
  const readmeModal = document.getElementById('readmeModal');
  const readmeCloseBtn = document.getElementById('readmeCloseBtn');
  const readmeContent = document.getElementById('readmeContent');

  readmeBtn.addEventListener('click', () => {
    // Toggle the modal visibility
    if (readmeModal.classList.contains('visible')) {
      // Close if already open
      readmeModal.classList.remove('visible');
    } else {
      // Open if closed
      try {
        const readmeElement = document.getElementById('readmeText');
        if (!readmeElement) throw new Error('README content not found');
        const markdown = readmeElement.textContent;
        readmeContent.innerHTML = markdownToHtml(markdown);
        readmeModal.classList.add('visible');
      } catch (error) {
        console.error('Error loading README:', error);
        readmeContent.innerHTML = '<p style="color: #f00;">Failed to load README: ' + error.message + '</p>';
        readmeModal.classList.add('visible');
      }
    }
  });

  readmeCloseBtn.addEventListener('click', () => {
    readmeModal.classList.remove('visible');
  });

  // Close modal when clicking outside of it
  readmeModal.addEventListener('click', (e) => {
    if (e.target === readmeModal) {
      readmeModal.classList.remove('visible');
    }
  });

  // Add Quote modal functionality
  const quoteBtn = document.getElementById('quoteBtn');
  const quoteModal = document.getElementById('quoteModal');
  const quoteCloseBtn = document.getElementById('quoteCloseBtn');
  const quoteContent = document.getElementById('quoteContent');

  quoteBtn.addEventListener('click', () => {
    // Toggle the modal visibility
    if (quoteModal.classList.contains('visible')) {
      // Close if already open
      quoteModal.classList.remove('visible');
    } else {
      // Open if closed
      try {
        const quoteElement = document.getElementById('quoteText');
        const attributionElement = document.getElementById('quoteAttribution');
        if (!quoteElement || !attributionElement) throw new Error('Quote content not found');
        const quoteText = quoteElement.textContent;
        const attribution = attributionElement.textContent;
        quoteContent.innerHTML = `<div class="quote-text">${quoteText}</div><div class="quote-attribution">${attribution}</div>`;
        quoteModal.classList.add('visible');
      } catch (error) {
        console.error('Error loading quote:', error);
        quoteContent.innerHTML = '<p style="color: #f00;">Failed to load quote: ' + error.message + '</p>';
        quoteModal.classList.add('visible');
      }
    }
  });

  quoteCloseBtn.addEventListener('click', () => {
    quoteModal.classList.remove('visible');
  });

  // Close modal when clicking outside of it
  quoteModal.addEventListener('click', (e) => {
    if (e.target === quoteModal) {
      quoteModal.classList.remove('visible');
    }
  });
}

// Wait for DOM to be ready before initializing
function initializeApp() {
  // Initialize
  const prefs = loadPreferences();
  currentFont = prefs.font;
  currentFontSize = prefs.fontSize;
  currentDensity = prefs.density;
  currentColorTheme = prefs.colorTheme;
  dataMode = prefs.dataMode || false;
  matrixVisible = prefs.matrixVisible !== false;

  detectSystemFont();
  populateFontSelector();
  applyTheme(currentColorTheme);

  canvas = document.getElementById('matrix');
  ctx = canvas?.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Start full (so initial load looks like a running system)
  for (let i = 0; i < currentDensity; i++) spawnParticle({ atTop: false });
  trimToDensity();

  let lastUpdate = 0;
  let regenCounter = 0;

  function animate() {
    const now = performance.now();
    if (now - lastUpdate >= FRAME_INTERVAL) {
      lastUpdate = now;

      // Cursor only appears when the matrix has fully drained.
      setCursorVisible(!matrixVisible && particles.length === 0);

      // If faucet ON, slowly refill to target density.
      if (matrixVisible && particles.length < currentDensity) {
        regenCounter++;
        if (regenCounter > 5) {
          spawnParticle({ atTop: true });
          regenCounter = 0;
        }
      } else if (!matrixVisible) {
        regenCounter = 0;
      }

      // When nothing to draw and faucet is OFF, keep canvas black.
      if (!ctx) {
        requestAnimationFrame(animate);
        return;
      }

      // Trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const theme = getTheme();
      ctx.font = getCanvasFont();
      ctx.fillStyle = theme.color;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 8;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drain always moves; OFF just stops recycling + char changes.
        p.y += p.speed;

        if (matrixVisible) {
          p.nextChange--;
          if (p.nextChange <= 0) {
            p.char = randomChar();
            p.nextChange = Math.random() * 100;
          }
        }

        // Off-screen handling
        if (p.y > canvasHeight + 30) {
          if (matrixVisible) {
            p.y = -20 - Math.random() * 120;
            p.x = Math.random() * canvasWidth;
            if (dataMode) p.char = randomChar();
            p.nextChange = Math.random() * 100;
          } else {
            // remove (swap-with-last)
            const last = particles.pop();
            if (last && i < particles.length) particles[i] = last;
            i--;
            continue;
          }
        }

        ctx.fillText(p.char, p.x, p.y);
      }

      // Keep CPU minimal when fully drained.
      if (!matrixVisible && particles.length === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }
    requestAnimationFrame(animate);
  }

  // Ensure initial cursor state is consistent.
  setCursorVisible(!matrixVisible && particles.length === 0);
  animate();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}
