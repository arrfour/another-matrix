# Matrix Rain Effect

A browser-based visual effect inspired by the iconic "digital rain" from The Matrix. Features cascading characters with fully customizable fonts, sizes, density, and color themes.

## Features

- **Cascading Characters**: Animated katakana, numbers, and letters falling vertically with variable opacity for depth
- **Font Detection**: Automatically selects the best available monospace font on your system
- **Font Switching**: Change between Monaco, Menlo, Courier New, Inconsolata, Courier, or monospace
- **Dynamic Size Control**: Real-time adjustment from 8px to 32px
- **Density Control**: Adjust character count from 20 to 200 in real-time
- **5 Color Themes**: Green, Cyan, Purple, Blue, White with automatic glow effects
- **Collapsible Control Panel**: Minimizes to just a header; remembers your preference
- **User Preferences**: Saves all settings (font, size, density, theme, panel state) to browser storage
- **Custom Defaults**: Save current settings as new defaults
- **Performance Optimized**: 30fps animation, GPU-accelerated transforms, minimal CPU usage

## Project Structure

```
gemma3-4b-matrix/
├── index.html      # HTML structure and styling
├── script.js       # Animation logic and controls
└── README.md       # This file
```

## How to Use

1. Open `index.html` in any modern web browser
2. Watch the characters cascade down the screen
3. Use the control panel to customize:
   - **Font**: Select from available monospace fonts
   - **Size**: Slider to scale characters (8-32px)
   - **Density**: Adjust number of falling characters (20-200)
   - **Color Theme**: Choose from 5 color schemes (Green, Cyan, Purple, Blue, White)
4. **Save Current**: Click to save your current settings as defaults
5. **Reset to Defaults**: Revert all settings to hardcoded defaults
6. **Refresh**: Reload the page while preserving your settings
7. **Toggle Panel**: Click the header to collapse/expand (state is remembered)

## Technical Details

### Technologies
- **HTML5**: Semantic markup and responsive structure
- **CSS3**: CSS Custom Properties for dynamic theming, GPU-accelerated animations
- **Vanilla JavaScript**: No dependencies; pure ES6 with Canvas API for font detection

### Architecture

**CSS Custom Properties**
- Dynamic theming via `--theme-color` and `--theme-glow` variables
- Single point of color management for entire UI
- Instant theme switching without DOM manipulation

**localStorage Persistence**
- Preferences: font, size, density, color theme
- Custom defaults override hardcoded values
- Control panel collapse state (defaults to closed)
- Survives page refreshes and browser restarts

**Animation Engine**
- 30fps throttled rendering (33ms frame interval)
- GPU-accelerated CSS transforms (translate3d)
- Random character cycling with configurable probability
- Variable opacity for depth effect

## Browser Compatibility

Works on all modern browsers supporting:
- ES6+ JavaScript
- Canvas API (for font detection)
- CSS Custom Properties
- `requestAnimationFrame`
- localStorage

## Customization

### Quick Customization (No Code Editing)
Use the control panel to adjust fonts, sizes, density, and colors. Click **Save Current** to make your preferences the new defaults.

### Advanced Customization (Editing Files)

**Colors & Themes** - Edit `script.js`:
```javascript
const colorThemes = {
  green: { color: '#0f0', glow: '#0f0', label: 'Green' },
  cyan: { color: '#0ff', glow: '#0ff', label: 'Cyan' },
  // Add custom themes here
};
```

**Character Set** - Edit `script.js`:
```javascript
const chars = 'ｦｧｨｩｪｫｬｭｮｯ...'; // Modify katakana or other characters
```

**Default Values** - Edit `script.js` in `getDefaultPreferences()`:
```javascript
return {
  font: 'monospace',
  fontSize: 14,
  density: 80,
  colorTheme: 'green'
};
```

**Animation Speed** - Edit `script.js`:
```javascript
const FRAME_INTERVAL = 33; // milliseconds (lower = faster, higher = slower)
```

## Notes

Originally created by Gemma 3:4b local instance. Evolved through multiple iterations with CSS positioning fixes, proper animation, font detection, theme system, user preference persistence, and UI polish.

Current version (v1.1) includes full theming support, localStorage persistence, and collapsible control panel.

## License

Free to use and modify for personal or commercial projects.
