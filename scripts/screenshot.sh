#!/bin/bash
# SERQ Debug Screenshot Tool
# Captures a screenshot of the SERQ window for Claude Code to analyze.
#
# Usage:
#   ./scripts/screenshot.sh              # Save to ~/.serq-screenshot.png
#   ./scripts/screenshot.sh custom.png   # Save to custom path
#
# Claude Code can then read the image and analyze the UI state.

OUTPUT="${1:-$HOME/.serq-screenshot.png}"

# Get window bounds via AppleScript
BOUNDS=$(osascript -e '
tell application "System Events"
    set serqProcs to every process whose name is "serq"
    if (count of serqProcs) = 0 then
        return "NOT_FOUND"
    end if
    set serqProc to item 1 of serqProcs
    try
        tell serqProc
            set wCount to count of windows
            if wCount = 0 then
                return "NO_WINDOW"
            end if
            set {x, y} to position of window 1
            set {w, h} to size of window 1
            return (x as text) & "," & (y as text) & "," & (w as text) & "," & (h as text)
        end tell
    on error
        return "ERROR"
    end try
end tell
' 2>/dev/null)

if [ "$BOUNDS" = "NOT_FOUND" ]; then
    echo "ERROR: SERQ is not running"
    exit 1
fi

if [ "$BOUNDS" = "NO_WINDOW" ]; then
    echo "ERROR: SERQ has no visible window"
    exit 1
fi

if [ "$BOUNDS" = "ERROR" ]; then
    echo "ERROR: Could not get SERQ window info"
    exit 1
fi

# Parse bounds
IFS=',' read -r X Y W H <<< "$BOUNDS"

# Validate we got numbers
if ! [[ "$W" =~ ^[0-9]+$ ]] || ! [[ "$H" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid window dimensions"
    exit 1
fi

# screencapture with region: -R x,y,w,h
screencapture -R "${X},${Y},${W},${H}" -x "$OUTPUT" 2>/dev/null

if [ $? -eq 0 ] && [ -f "$OUTPUT" ]; then
    echo "OK: Screenshot saved to $OUTPUT (${W}x${H} at ${X},${Y})"
else
    echo "ERROR: screencapture failed"
    exit 1
fi
