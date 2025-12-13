// Font detection
const fontList = ['Monaco', 'Menlo', 'Courier New', 'Inconsolata', 'Courier', 'monospace'];
let currentFont = 'monospace';
let currentFontSize = 14;

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
  
  // Add size slider control
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeLabel = document.getElementById('sizeLabel');
  
  sizeSlider.addEventListener('input', (e) => {
    currentFontSize = parseInt(e.target.value);
    sizeLabel.textContent = currentFontSize + 'px';
    updatePixelFonts();
  });
}

function updatePixelFonts() {
  const pixelElements = document.querySelectorAll('.pixel');
  pixelElements.forEach(pixel => {
    pixel.style.fontFamily = currentFont;
    pixel.style.fontSize = currentFontSize + 'px';
  });
}

// Initialize
detectSystemFont();
populateFontSelector();

const matrixDiv = document.getElementById('matrix');
const numPixels = 150; // Number of falling characters
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
  
  pixel.style.left = x + 'px';
  pixel.style.top = y + 'px';
  pixel.style.opacity = opacity;
  pixel.style.fontFamily = currentFont;
  pixel.style.fontSize = currentFontSize + 'px';
  pixel.textContent = chars[Math.floor(Math.random() * chars.length)];
  
  matrixDiv.appendChild(pixel);
  pixels.push({ element: pixel, speed: speed, x: x, y: y });
}

// Animation loop
function animate() {
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    p.y += p.speed;
    
    // Reset to top when falling off screen
    if (p.y > window.innerHeight) {
      p.y = -20;
      p.x = Math.random() * window.innerWidth;
      p.element.style.left = p.x + 'px';
      p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
    }
    
    p.element.style.top = p.y + 'px';
    
    // Randomly change character
    if (Math.random() < 0.02) {
      p.element.textContent = chars[Math.floor(Math.random() * chars.length)];
    }
  }
  requestAnimationFrame(animate);
}

animate(); // Start the animation