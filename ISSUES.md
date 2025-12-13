# Issue: Control Panel Styling Not Reflecting Selected Theme

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
- `updatePixelColors()` and `updatePixelFonts()` only update the falling characters
- Control panel styling is not updated in these functions

## Solution
- Extend `updatePixelColors()` to also update control panel colors
- Extend `updatePixelFonts()` to also update control panel font
- Ensure control panel reflects current app state at all times
