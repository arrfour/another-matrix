# Matrix Rain Effect

A browser-based visual effect inspired by the iconic "digital rain" from The Matrix. Features cascading characters with interactive controls for font selection and dynamic size adjustment.

## Features

- **Cascading Characters**: Animated katakana, numbers, and letters falling vertically across the screen
- **Font Detection**: Automatically detects and selects the best available monospace font on your system
- **Font Switching**: Dynamically change between available fonts (Monaco, Menlo, Courier New, Inconsolata, Courier, monospace)
- **Size Control**: Real-time font size adjustment with slider (8px - 32px)
- **Matrix Styling**: Authentic green-on-black theme with glow effects
- **Performance**: Optimized rendering with 150 characters for smooth animation

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
3. Use the control panel in the bottom-right corner to:
   - **Change Font**: Select from available monospace fonts
   - **Adjust Size**: Use the slider to scale characters (8-32px)

## Technical Details

### Technologies
- **HTML5**: Semantic markup and structure
- **CSS3**: Styling, flexbox, and effects
- **Vanilla JavaScript**: Animation using `requestAnimationFrame`

### Key Features

**Font Detection**
- Automatically tests available fonts using Canvas API
- Falls back to system monospace if preferred fonts unavailable
- Supports: Monaco, Menlo, Courier New, Inconsolata, Courier

**Animation**
- 150 characters with random speeds (2-8px per frame)
- Variable opacity for depth effect
- Automatic character cycling
- Reset to top when falling off screen

**Performance**
- Uses `requestAnimationFrame` for smooth 60fps animation
- Canvas-based font detection (no DOM layout thrashing)
- Efficient DOM updates

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript
- Canvas API
- CSS Flexbox
- `requestAnimationFrame`

## Customization

Edit `script.js` to customize:
- **Character Set**: Modify the `chars` string (line ~74)
- **Number of Characters**: Change `numPixels` (line ~73)
- **Speed Range**: Adjust the speed calculation (line ~94)
- **Opacity Range**: Change opacity values (line ~95)
- **Character Change Frequency**: Adjust the `0.02` probability (line ~126)

Edit `index.html` to customize:
- **Colors**: Modify `#0f0` (green) to any CSS color
- **Glow Effect**: Adjust `text-shadow` values
- **Font Size Range**: Change slider `min` and `max` attributes

## Notes

This project was originally created by a local instance of Gemma 3:4b and has been enhanced with proper positioning, font detection, and interactive controls.

## License

Free to use and modify for personal or commercial projects.
