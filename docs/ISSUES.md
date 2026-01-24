# Issue: Control Panel Styling Not Reflecting Selected Theme

**Status: ✅ CLOSED (v1.1)**

## Problem

- Control panel colors don't dynamically update to match the selected color theme
- Control panel font doesn't match the selected font in the app
- Only the Matrix characters change color/font, but the control panel remains static

## Expected Behavior

- Control panel border, text, and interactive elements should match the selected color theme
- Control panel should use the same font as selected in the Font dropdown
- Changes should be reflected immediately when theme/font is changed

## Affected Features

- Font selection (control panel doesn't update)
- Color theme selection (control panel doesn't update)

## Root Cause

- `updatePixelColors()` and `updatePixelFonts()` only updated the falling characters
- Control panel styling was not included in these functions

## Solution

- Extended `updatePixelColors()` to update all control panel elements
- Extended `updatePixelFonts()` to update control panel and its children
- Ensured control panel header, buttons, labels, and inputs all reflect current state

## Resolution

Fixed in commit `aaf5055` and released in **v1.1**

- Control panel now updates dynamically with all theme/font changes
- All UI elements maintain visual consistency with app state

# Issue: High CPU Usage and Process Spinning without TTY

**Status: ✅ CLOSED (v2.1)**

## Problem

- When running the container without an interactive terminal (`docker run` without `-it`), the `entrypoint.sh` script would enter a tight loop.
- The `timeout 15 dd` command would return immediately with EOF, causing the loop to rerun hundreds of times per second.
- This resulted in >100% CPU usage and hundreds of orphan processes inside the container.

## Affected Features

- Docker/Podman deployments in background or non-TTY environments.

## Root Cause

- `dd` expects an interactive input stream; when missing (non-interactive mode), it returns immediately.
- Lack of a "fallback" mode for non-interactive environments in `entrypoint.sh`.

## Solution

- Added TTY detection to `entrypoint.sh` using `[ -t 0 ]`.
- Implemented a "Foreground Only" fallback that skips the Dashboard more and starts nginx directly if no TTY is present.
- Added a safety `sleep 1` in the interactive loop to prevent spinning if input fails.
- Improved process management to ensure nginx dies if the script exits.

## Resolution

Fixed in **v2.1**

- Container is now safe to run with or without `-it`.
- CPU usage is negligible in non-interactive mode.
- Dashboard only activates when a TTY is available.
