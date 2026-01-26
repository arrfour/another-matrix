# Matrix Rain Effect - Organized Project Structure

A browser-based Matrix rain effect with Docker/Podman containerization and Proxmox LXC deployment support.

## Project Structure

```text
another-matrix/
├── src/                          # Application source code
│   ├── index.html               # HTML structure and embedded CSS
│   ├── script.js                # Animation logic and controls
│   └── README.md                # Full feature documentation
│
├── docker/                       # Docker/Podman containerization
│   ├── Dockerfile               # Container image definition
│   ├── .dockerignore            # Build exclusions
│   └── entrypoint.sh            # Interactive terminal UI for container
│
├── deploy/                       # Deployment automation scripts
│   ├── setup.sh                 # LXC setup script (runs inside container)
│   └── deploy-to-proxmox.sh     # Proxmox API automation (runs on Proxmox host)
│
├── docs/                         # Documentation
│   ├── PROXMOX_DEPLOYMENT.md    # Complete Proxmox LXC guide
│   ├── REORGANIZATION.md        # Summary of folder structure changes
│   ├── ISSUES.md                # Issue tracking and resolved bugs
│   └── agent-instructions.md    # Project development notes
│
├── CHANGELOG.md                 # Version history and updates
└── README.md                     # This file (project overview)
```

## Quick Start

### Local Browser (Fastest)

```bash
# Simply open src/index.html in your web browser
# Or use a local server:
cd src && python3 -m http.server 8000
# Then open http://localhost:8000
```

### Docker / Podman Container

The container automatically detects if you're running interactively or in the background.

**Option A: Background Mode (Standard)**
Runs as a lightweight web server. Best for persistent deployments.

```bash
# Docker
docker run -d --name matrix -p 8880:80 matrix-effect
# Podman
podman run -d --name matrix -p 8880:80 matrix-effect
```

**Option B: Dashboard Mode (Interactive)**
Runs a terminal-based dashboard with real-time logs and controls.

```bash
# Docker
docker run -it --rm -p 8880:80 matrix-effect
# Podman
podman run -it --rm -p 8880:80 matrix-effect
```

**Access the web UI at:** `http://localhost:8880`

### Proxmox LXC (Advanced)

```bash
# Run from deploy directory
cd deploy
./deploy-to-proxmox.sh
# Follow interactive prompts for Proxmox API credentials and LXC configuration
```

## What's Where

| Task | File(s) |
| ---- | ------- |
| **Run locally** | Open `src/index.html` in browser |
| **View features** | Read `src/README.md` |
| **Docker build** | Use `docker/Dockerfile` |
| **Container terminal UI** | Auto-runs via `docker/entrypoint.sh` |
| **LXC direct setup** | Run `deploy/setup.sh` inside LXC |
| **Proxmox automation** | Execute `deploy/deploy-to-proxmox.sh` |
| **Deployment docs** | See `docs/PROXMOX_DEPLOYMENT.md` |
| **Project history** | Read `CHANGELOG.md` |
| **Structure changes** | Read `docs/REORGANIZATION.md` |
| **Bug tracking** | Check `docs/ISSUES.md` |

## Features Included

✅ Cascading matrix rain animation  
✅ Font, size, density, color customization  
✅ Binary data mode toggle  
✅ Matrix display toggle with blinking cursor  
✅ Dynamic README loading  
✅ Quote viewer modal  
✅ Control panel with collapse state memory  
✅ localStorage preference persistence  
✅ HTML entity glyphs for universal compatibility  
✅ Docker/Podman containerization  
✅ Interactive container terminal UI  
✅ Proxmox LXC automated deployment  

## File Dependencies

**Dockerfile** references:

- `src/index.html`
- `src/script.js`
- `src/README.md`
- `docker/entrypoint.sh`

**deploy-to-proxmox.sh** references:

- `src/index.html`
- `src/script.js`
- `src/README.md`
- `deploy/setup.sh`

**setup.sh** expects files in current directory after transfer (internal script)

**index.html** expects:

- `script.js` in same directory
- `README.md` in same directory

## Build & Deployment

### Docker / Podman

**Building:**

```bash
docker build -t matrix-effect -f docker/Dockerfile .
# OR
podman build -t matrix-effect -f docker/Dockerfile .
```

**Running:**

```bash
# Interactive Dashboard mode
docker run -it --rm -p 8880:80 matrix-effect

# Background / Server mode
docker run -d --name matrix -p 8880:80 matrix-effect
```

### Proxmox LXC

```bash
cd deploy
./deploy-to-proxmox.sh
# Interactive configuration for:
# - Proxmox host and credentials
# - LXC specs (CPU, RAM, disk, network)
# - Automatic file transfer and setup
```

## Notes

- All source files are in `src/` for clean organization
- Deployment scripts are in `deploy/` for easy access
- Docker configuration is in `docker/` alongside the Dockerfile
- Documentation is in `docs/` for centralized reference
- Root-level files reference the new structure with proper paths

## Technologies Used

- HTML5 + CSS3 (embedded in index.html)
- Vanilla JavaScript ES6+ (no dependencies)
- nginx alpine container
- POSIX shell automation scripts

## License

Free to use and modify.
