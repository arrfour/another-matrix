# Changelog

## [2.2.0] - 2026-01-24 - Intelligent Container Entrypoint

### Added

- **TTY Auto-Detection**: Container now automatically switches between Interactive Dashboard and Background Server modes.
- **Spin Protection**: Added safety loops to `entrypoint.sh` to prevent CPU exhaustion if stdin is lost.
- **Improved Process Management**: Graceful cleanup of background Nginx processes on container stop.
- **Podman/Docker Parity**: Updated documentation to provide identical commands for both runtimes.

### Fixed

- **High CPU Usage**: Resolved issue where running the container without `-it` caused a tight process loop (>100% CPU).
- **Terminal Settings**: Fixed issue where terminal echo/cbreak settings weren't properly restored on exit.
- **Orphan Processes**: Prevented the accumulation of `dd` and `timeout` processes in non-interactive environments.

## [2.1.0] - 2024-12-30 - Project Reorganization

### Added

- New organized folder structure (src/, docker/, deploy/, docs/)
- Root-level README.md with project overview and quick start guide
- docs/REORGANIZATION.md detailing all changes made
- .dockerignore updates to exclude deploy/ and docs/ directories

### Changed

- Moved index.html, script.js, and feature README.md to src/
- Moved Dockerfile, entrypoint.sh, and .dockerignore to docker/
- Moved setup.sh and deploy-to-proxmox.sh to deploy/
- Moved PROXMOX_DEPLOYMENT.md, ISSUES.md, and agent-instructions.md to docs/
- Updated Dockerfile paths to reference src/ subdirectory
- Updated deploy-to-proxmox.sh with automatic path detection
- Updated PROXMOX_DEPLOYMENT.md file copy examples
- Updated src/README.md project structure section

### Fixed

- All shell scripts made executable (chmod +x)
- Docker build verified working with new paths
- All deployment scripts tested for correct path resolution

### Migration

- Old way: `open index.html` → New way: `open src/index.html`
- Old way: `podman build .` → New way: `podman build -f docker/Dockerfile .`
- Old way: `./deploy-to-proxmox.sh` → New way: `cd deploy && ./deploy-to-proxmox.sh`

## [2.0.0] - Previous Release

### Added

- Docker/Podman containerization with nginx
- Interactive terminal UI for container
- Dynamic README loading via Fetch API
- Blinking cursor with typing messages
- Cyberpunk data generators (18+ types)
- Progress bars in data display
- Emoji integration
- Font/color/size tracking for cursor
- Keyboard spacebar interaction
- Proxmox LXC automated deployment scripts

### Fixed

- generateRandomDataSequence bug (proper bit sequences)
- Button glyphs encoding (HTML entities)
- Cursor display issues (charset, blinking, animation)
- Terminal log scrolling

## [1.1.0] - Earlier Release

### Fixed

- Control panel styling to reflect selected theme
- Font selection updates across all UI elements

## [1.0.0] - Initial Release

### Added

- Basic Matrix rain animation
- Font detection and selection
- Size and density controls
- Color themes (5 options)
- Data mode toggle
- localStorage persistence
- Control panel with collapse state
