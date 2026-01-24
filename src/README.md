# Matrix Rain Effect

A browser-based visual effect inspired by the iconic "digital rain" from The Matrix. Features cascading characters with fully customizable fonts, sizes, density, and color themes. Can be run locally or deployed via Docker/Podman container with an interactive terminal UI.

## Features

- **Cascading Characters**: Animated katakana, numbers, and letters falling vertically with variable opacity for depth
- **Font Detection**: Automatically selects the best available monospace font on your system
- **Font Switching**: Change between Monaco, Menlo, Courier New, Inconsolata, Courier, or monospace
- **Dynamic Size Control**: Real-time adjustment from 8px to 60px
- **Density Control**: Adjust character count from 25 to 500 in real-time
- **5 Color Themes**: Green, Cyan, Purple, Blue, White with automatic glow effects
- **Data Mode**: Toggle to display 3-bit binary sequences (e.g., "101", "010") instead of characters
- **Matrix Display Toggle**: Show/hide the animation with a single click (▮ button)
- **Blinking Cursor**: Terminal-like cursor appears when matrix is hidden
- **Collapsible Control Panel**: Remembers your preference; minimizes to button bar
- **Universal Glyph Support**: HTML entity-based buttons for cross-browser compatibility
- **Quote Viewer**: Separate modal displaying the Kurt Vonnegut inspiration quote
- **Dynamic README Viewer**: Loads latest README.md from server when info button is clicked
- **User Preferences**: Saves all settings (font, size, density, theme, panel state, data mode, matrix visibility) to browser storage
- **Custom Defaults**: Save current settings as new defaults
- **Container Deployment**: Docker/Podman support with nginx web server and interactive terminal UI

## Project Structure

```
root-folder/
├── src/
│   ├── index.html        # HTML structure and styling
│   ├── script.js         # Animation logic and controls
│   └── README.md         # This file (loaded dynamically in app)
├── docker/
│   ├── Dockerfile        # Container image definition
│   ├── .dockerignore     # Container build exclusions
│   └── entrypoint.sh     # Terminal UI script for container
├── deploy/
│   ├── setup.sh          # LXC setup automation script
│   ├── deploy-to-proxmox.sh  # Proxmox deployment automation
│   └── PROXMOX_DEPLOYMENT.md # Proxmox deployment guide (also in docs/)
└── docs/
    ├── PROXMOX_DEPLOYMENT.md # Detailed Proxmox LXC deployment guide
    ├── ISSUES.md         # Issue tracking and resolved bugs
    └── agent-instructions.md # Project instructions
```

## How to Use

### Option 1: Local File Access

1. Open `src/index.html` in any modern web browser
2. Watch the characters cascade down the screen
3. Use the control panel to customize settings

### Option 2: Container Deployment (Recommended)

The container image is designed to be versatile, supporting both standard server deployments and interactive monitoring.

**Build the image:**

```bash
docker build -t matrix-effect -f docker/Dockerfile .
# OR
podman build -t matrix-effect -f docker/Dockerfile .
```

**Run in Dashboard Mode (Interactive):**
Use `-it` to enable the interactive terminal UI.

```bash
docker run -it --rm -p 8880:80 matrix-effect
```

- **Real-time Logs**: Shows the last 30 nginx requests.

- **Controls**: Press `q` to quit, `c` to clear the log.
- **Safety**: Automatically restores terminal settings on exit.

**Run in Server Mode (Background):**
Omit `-it` or use `-d` for a clean, low-resource background service.

```bash
docker run -d --name matrix -p 8880:80 matrix-effect
```

- **Optimization**: Automatically detects the absence of a TTY and disables the dashboard to save CPU/Memory.

- **Production Ready**: Uses standard nginx foreground execution.

**Access in browser:**

- Open `http://localhost:8880`

### Option 3: Proxmox LXC Deployment (Advanced)

See [deploy/PROXMOX_DEPLOYMENT.md](deploy/PROXMOX_DEPLOYMENT.md) or [docs/PROXMOX_DEPLOYMENT.md](docs/PROXMOX_DEPLOYMENT.md) for automated deployment scripts and detailed instructions.

## Control Panel Usage

Use the control panel to customize:

- **Font**: Select from available monospace fonts
- **Size**: Slider to scale characters (8-60px)
- **Density**: Adjust number of falling characters (25-500)
- **Color Theme**: Choose from 5 color schemes (Green, Cyan, Purple, Blue, White)
- **Data Mode**: Toggle to display 3-bit binary sequences instead of characters

**Control Panel Buttons** (left to right):

- **↻ Reset**: Revert all settings to hardcoded defaults
- **💾 Save**: Save your current settings as new defaults
- **⟲ Refresh**: Reload the page while preserving your settings
- **« Inspiration**: Toggle the Kurt Vonnegut quote modal on/off
- **ℹ Info**: Toggle README documentation modal on/off (loads latest from server)
- **▮ Matrix**: Toggle matrix animation display on/off (shows blinking cursor when hidden)
- **− Panel**: Collapse/expand the control panel (state is remembered)

## Technical Details

### Technologies

- **HTML5**: Semantic markup and responsive structure
- **CSS3**: CSS Custom Properties for dynamic theming, GPU-accelerated animations, HTML entity glyphs
- **Vanilla JavaScript**: No dependencies; pure ES6 with Canvas API for font detection and Fetch API for README loading
- **nginx (alpine)**: Lightweight web server for container deployment (~10MB base image)
- **POSIX shell**: Interactive terminal UI for container management

### Architecture

**CSS Custom Properties**

- Dynamic theming via `--theme-color` and `--theme-glow` variables
- Single point of color management for entire UI
- Instant theme switching without DOM manipulation

**localStorage Persistence**

- Preferences: font, size, density, color theme, data mode, matrix visibility
- Custom defaults override hardcoded values
- Control panel collapse state (defaults to closed)
- Survives page refreshes and browser restarts

**Animation Engine**

- 30fps throttled rendering (33ms frame interval) for smooth motion
- Selective DOM updates: only updates when position changes >0.5px
- Batched character changes reduce Math.random() calls
- GPU-accelerated CSS transforms (translate3d)
- Variable opacity for depth effect
- ~35-40% CPU reduction vs naive implementation while maintaining visual quality
- Data mode generates 3-bit sequences dynamically

**Container Architecture**

- nginx:alpine base for minimal footprint
- Custom shell entrypoint with auto-switching modes (Interactive vs. Background)
- **TTY Detection**: uses `[ -t 0 ]` to decide whether to launch the Terminal UI or just Nginx
- Real-time log monitoring with graceful shutdown handling
- Spin-protection: uses `sleep 1` to prevent CPU exhaustion if stdin is lost

## Browser Compatibility

Works on all modern browsers supporting:

- ES6+ JavaScript (async/await, fetch)
- Canvas API (for font detection)
- CSS Custom Properties
- `requestAnimationFrame`
- localStorage

## Customization

### Quick Customization (No Code Editing)

Use the control panel to adjust fonts, sizes, density, and colors. Click **Save Current** to make your preferences the new defaults.

### Advanced Customization (Editing Files)

**Colors & Themes** - Edit `src/script.js`:

```javascript
const colorThemes = {
  green: { color: '#0f0', glow: '#0f0', label: 'Green' },
  cyan: { color: '#0ff', glow: '#0ff', label: 'Cyan' },
  // Add custom themes here
};
```

**Character Set** - Edit `src/script.js`:

```javascript
const chars = 'アイウエオカキクケコ...'; // Modify katakana or other characters
```

**Data Mode Sequence Length** - Edit `src/script.js`:

```javascript
function generateRandomDataSequence(length = 3) {
  // Change default length parameter to adjust bit sequence length
}
```

**Default Values** - Edit `src/script.js` in `getDefaultPreferences()`:

```javascript
return {
  font: 'monospace',
  fontSize: 14,
  density: 80,
  colorTheme: 'green'
};
```

**Animation Speed** - Edit `src/script.js`:

```javascript
const FRAME_INTERVAL = 33; // milliseconds (lower = faster, higher = slower)
```

## Notes

Originally created by Gemma 3:4b local instance. Evolved through multiple iterations with CSS positioning fixes, proper animation, font detection, theme system, user preference persistence, modal viewers, and intuitive UI design.

**Current version (v2.1)** adds:

- **Intelligent Entrypoint**: Fixed high CPU usage/hanging when running without `-it`.
- **Automatic Mode Selection**: Detects TTY to switch between Dashboard and Server modes.
- **Terminal Restoration**: Ensured terminal settings are reset on container exit.
- Docker/Podman containerization with nginx web server
- Interactive terminal UI with log monitoring and graceful shutdown
- Dynamic README loading via Fetch API (no longer embedded in HTML)
- Folder structure organization (src/, docker/, deploy/, docs/)

All preferences (including matrix visibility state) are saved to localStorage for seamless state restoration across sessions.

## License

Free to use and modify for personal or commercial projects.
