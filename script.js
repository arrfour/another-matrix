// Font detection
const fontList = ['Monaco', 'Menlo', 'Courier New', 'Inconsolata', 'Courier', 'monospace'];
let currentFont = 'monospace';
let currentFontSize = 14;
let currentDensity = 80;
let currentColorTheme = 'green';
let dataMode = false; // Toggle for hex/binary data display

// Global character set and pixel storage
const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const pixels = [];
let matrixDiv = null; // Will be initialized when DOM loads

// Data encoding helpers for 4-bit (nibble) and 8-bit (byte) display
function generateRandomByte() {
  return Math.floor(Math.random() * 256);
}

function byteToHex(byte) {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

function generateRandomDataSequence(length = 3) {
  // In data mode, return a single random bit (0 or 1)
  return Math.random() < 0.5 ? '0' : '1';
}

// Color themes
const colorThemes = {
  green: { color: '#0f0', glow: '#0f0', label: 'Green' },
  cyan: { color: '#0ff', glow: '#0ff', label: 'Cyan' },
  purple: { color: '#f0f', glow: '#f0f', label: 'Purple' },
  blue: { color: '#00f', glow: '#00f', label: 'Blue' },
  white: { color: '#fff', glow: '#fff', label: 'White' }
};

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
    dataMode: false
  };
}

function savePreferences() {
  const prefs = {
    font: currentFont,
    fontSize: currentFontSize,
    density: currentDensity,
    colorTheme: currentColorTheme,
    dataMode: dataMode
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function saveAsDefault() {
  const newDefaults = {
    font: currentFont,
    fontSize: currentFontSize,
    density: currentDensity,
    colorTheme: currentColorTheme,
    dataMode: dataMode
  };
  localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(newDefaults));
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

// Performance optimization: throttle animation frame updates
let lastFrameTime = 0;
const FRAME_INTERVAL = 33; // ~30fps instead of 60fps

// Debounce helper for slider updates
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
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
    updatePixelFonts();
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
    updatePixelFonts();
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
    updateDensity(currentDensity);
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
    updatePixelColors();
    // Reset characters to make color change more noticeable
    resetAllCharacters();
    savePreferences();
  });

  // Add data mode toggle
  const dataModeToggle = document.getElementById('dataModeToggle');
  dataModeToggle.checked = dataMode;
  dataModeToggle.addEventListener('change', (e) => {
    dataMode = e.target.checked;
    resetAllCharacters();
    savePreferences();
  });

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
  const controlHeader = document.getElementById('controlHeader');
  const controlContent = document.getElementById('controlContent');
  const toggleIcon = document.getElementById('toggleIcon');
  
  // Load and apply saved collapse state on page load
  const isCollapsed = loadCollapseState();
  if (isCollapsed) {
    controlContent.classList.add('collapsed');
    toggleIcon.textContent = '+';
  }

  controlHeader.addEventListener('click', () => {
    controlContent.classList.toggle('collapsed');
    const nowCollapsed = controlContent.classList.contains('collapsed');
    toggleIcon.textContent = nowCollapsed ? '+' : '−';
    saveCollapseState(nowCollapsed);
  });

  // Add refresh button functionality
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', () => {
    // Save current collapse state before reload
    const controlContent = document.getElementById('controlContent');
    saveCollapseState(controlContent.classList.contains('collapsed'));
    location.reload();
  });
}

function updatePixelFonts() {
  const pixelElements = document.querySelectorAll('.pixel');
  pixelElements.forEach(pixel => {
    pixel.style.fontFamily = currentFont;
    pixel.style.fontSize = currentFontSize + 'px';
  });
  
  // Update control panel font
  const controlPanel = document.getElementById('controlPanel');
  controlPanel.style.fontFamily = currentFont + ', monospace';
  
  // Also update selects and inputs in control panel
  const inputs = controlPanel.querySelectorAll('select, input[type="range"], button, label');
  inputs.forEach(input => {
    input.style.fontFamily = currentFont + ', monospace';
  });
}

function updatePixelColors() {
  const theme = colorThemes[currentColorTheme];
  const pixelElements = document.querySelectorAll('.pixel');
  pixelElements.forEach(pixel => {
    pixel.style.color = theme.color;
    pixel.style.textShadow = `0 0 3px ${theme.glow}`;
  });
  
  // Update CSS variables for control panel and all elements
  applyTheme(currentColorTheme);
}

function updateControlPanelColor() {
  // CSS variables now handle all styling automatically
  // This function is kept for compatibility but is now minimal
  applyTheme(currentColorTheme);
}

function resetAllCharacters() {
  // Reset all characters to make color/visual changes more dynamic
  pixels.forEach(p => {
    if (dataMode) {
      p.textContent = generateRandomDataSequence(3);
    } else {
      p.textContent = chars[Math.floor(Math.random() * chars.length)];
    }
    // Reset position to top with new random x for more visible change
    p.y = -20 + Math.random() * 100;
    p.x = Math.random() * window.innerWidth;
  });
}

function updateDensity(newDensity) {
  const matrixDiv = document.getElementById('matrix');
  const difference = newDensity - pixels.length;
  
  if (difference > 0) {
    // Add new pixels
    for (let i = 0; i < difference; i++) {
      addPixel();
    }
  } else if (difference < 0) {
    // Remove pixels
    for (let i = 0; i < Math.abs(difference); i++) {
      const pixel = pixels.pop();
      if (pixel) {
        pixel.element.remove();
      }
    }
  }
}

function addPixel() {
  const pixel = document.createElement('div');
  pixel.classList.add('pixel');
  
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const speed = 2 + Math.random() * 6;
  const opacity = 0.3 + Math.random() * 0.7;
  
  pixel.style.opacity = opacity;
  pixel.style.fontFamily = currentFont;
  pixel.style.fontSize = currentFontSize + 'px';
  const theme = colorThemes[currentColorTheme];
  pixel.style.color = theme.color;
  pixel.style.textShadow = `0 0 3px ${theme.glow}`;
  pixel.style.transform = `translate(${x}px, ${y}px)`;
  if (dataMode) {
    pixel.textContent = generateRandomDataSequence(3);
  } else {
    pixel.textContent = chars[Math.floor(Math.random() * chars.length)];
  }
  
  matrixDiv.appendChild(pixel);
  pixels.push({ element: pixel, speed: speed, x: x, y: y });
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

  detectSystemFont();
  populateFontSelector();
  applyTheme(currentColorTheme); // Apply initial theme

  matrixDiv = document.getElementById('matrix');
  const numPixels = 80; // Initial density

  // Create the falling characters
  for (let i = 0; i < numPixels; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const speed = 2 + Math.random() * 6;
    const opacity = 0.3 + Math.random() * 0.7;
    
    pixel.style.opacity = opacity;
    pixel.style.fontFamily = currentFont;
    pixel.style.fontSize = currentFontSize + 'px';
    const theme = colorThemes[currentColorTheme];
    pixel.style.color = theme.color;
    pixel.style.textShadow = `0 0 3px ${theme.glow}`;
    pixel.style.transform = `translate(${x}px, ${y}px)`;
    
    // Set content based on mode
    if (dataMode) {
      pixel.textContent = generateRandomDataSequence(3);
    } else {
      pixel.textContent = chars[Math.floor(Math.random() * chars.length)];
    }
    
    matrixDiv.appendChild(pixel);
    pixels.push({ element: pixel, speed: speed, x: x, y: y });
  }

  // Animation loop with frame throttling
  let lastUpdate = 0;
  function animate() {
    const now = performance.now();
    
    // Only update every FRAME_INTERVAL milliseconds (~30fps)
    if (now - lastUpdate >= FRAME_INTERVAL) {
      lastUpdate = now;
      
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        p.y += p.speed;
        
        // Reset to top when falling off screen
        if (p.y > window.innerHeight) {
          p.y = -20;
          p.x = Math.random() * window.innerWidth;
          if (dataMode) {
            p.element.textContent = generateRandomDataSequence(3);
          } else {
            p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
          }
          // Update color to current theme when character resets
          const theme = colorThemes[currentColorTheme];
          p.element.style.color = theme.color;
          p.element.style.textShadow = `0 0 3px ${theme.glow}`;
        }
        
        // Use transform for GPU acceleration instead of top/left
        p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
        
        // Randomly change character (reduced frequency)
        if (Math.random() < 0.01) {
          if (dataMode) {
            p.element.textContent = generateRandomDataSequence(3);
          } else {
            p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
          }
        }
      }
    }
    requestAnimationFrame(animate);
  }

  animate(); // Start the animation
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}