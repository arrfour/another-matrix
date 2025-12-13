// Font detection
const fontList = ['Monaco', 'Menlo', 'Courier New', 'Inconsolata', 'Courier', 'monospace'];
let currentFont = 'monospace';
let currentFontSize = 14;
let currentDensity = 80;
let currentColorTheme = 'green';

// Color themes
const colorThemes = {
  green: { color: '#0f0', glow: '#0f0', label: 'Green' },
  cyan: { color: '#0ff', glow: '#0ff', label: 'Cyan' },
  purple: { color: '#f0f', glow: '#f0f', label: 'Purple' },
  blue: { color: '#00f', glow: '#00f', label: 'Blue' },
  white: { color: '#fff', glow: '#fff', label: 'White' }
};

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
  });
  
  // Add size slider control with debouncing
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeLabel = document.getElementById('sizeLabel');
  
  const debouncedSizeUpdate = debounce((value) => {
    currentFontSize = parseInt(value);
    sizeLabel.textContent = currentFontSize + 'px';
    updatePixelFonts();
  }, 100);
  
  sizeSlider.addEventListener('input', (e) => {
    debouncedSizeUpdate(e.target.value);
  });

  // Add density slider control with debouncing
  const densitySlider = document.getElementById('densitySlider');
  const densityLabel = document.getElementById('densityLabel');
  
  const debouncedDensityUpdate = debounce((value) => {
    currentDensity = parseInt(value);
    densityLabel.textContent = currentDensity;
    updateDensity(currentDensity);
  }, 150);
  
  densitySlider.addEventListener('input', (e) => {
    debouncedDensityUpdate(e.target.value);
  });

  // Add color theme selector
  const colorThemeSelector = document.getElementById('colorTheme');
  colorThemeSelector.addEventListener('change', (e) => {
    currentColorTheme = e.target.value;
    updatePixelColors();
    // Reset characters to make color change more noticeable
    resetAllCharacters();
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
}

function updatePixelColors() {
  const theme = colorThemes[currentColorTheme];
  const pixelElements = document.querySelectorAll('.pixel');
  pixelElements.forEach(pixel => {
    pixel.style.color = theme.color;
    pixel.style.textShadow = `0 0 3px ${theme.glow}`;
  });
  
  // Update control panel color
  updateControlPanelColor();
}

function updateControlPanelColor() {
  const theme = colorThemes[currentColorTheme];
  const controlPanel = document.getElementById('controlPanel');
  const cssVars = `
    --theme-color: ${theme.color};
    --theme-glow: ${theme.glow};
  `;
  controlPanel.style.borderColor = theme.color;
  controlPanel.setAttribute('data-theme', currentColorTheme);
  
  // Update all label colors and select/input border colors
  const labels = controlPanel.querySelectorAll('label');
  labels.forEach(label => {
    label.style.color = theme.color;
  });
  
  const selects = controlPanel.querySelectorAll('select, input[type="range"]');
  selects.forEach(select => {
    select.style.borderColor = theme.color;
    select.style.color = theme.color;
  });
  
  const valueLabels = controlPanel.querySelectorAll('.value-label');
  valueLabels.forEach(label => {
    label.style.color = theme.color;
  });
}

function resetAllCharacters() {
  // Reset all characters to make color/visual changes more dynamic
  pixels.forEach(p => {
    p.textContent = chars[Math.floor(Math.random() * chars.length)];
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
  pixel.textContent = chars[Math.floor(Math.random() * chars.length)];
  
  matrixDiv.appendChild(pixel);
  pixels.push({ element: pixel, speed: speed, x: x, y: y });
}

// Initialize
detectSystemFont();
populateFontSelector();

const matrixDiv = document.getElementById('matrix');
const numPixels = 80; // Initial density
const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Store pixel data with speeds
const pixels = [];

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
  pixel.textContent = chars[Math.floor(Math.random() * chars.length)];
  
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
        p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
      }
      
      // Use transform for GPU acceleration instead of top/left
      p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
      
      // Randomly change character (reduced frequency)
      if (Math.random() < 0.01) {
        p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
      }
    }
  }
  requestAnimationFrame(animate);
}

animate(); // Start the animation