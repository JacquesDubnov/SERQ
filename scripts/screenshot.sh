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

# Get the SERQ window ID using AppleScript
WINDOW_ID=$(osascript -e '
tell application "System Events"
    set serqProcs to every process whose name contains "SERQ"
    if (count of serqProcs) = 0 then
        return "NOT_FOUND"
    end if
    set serqProc to item 1 of serqProcs
    try
        set w to window 1 of serqProc
        return id of w
    on error
        return "NO_WINDOW"
    end try
end tell
' 2>/dev/null)

if [ "$WINDOW_ID" = "NOT_FOUND" ]; then
    echo "ERROR: SERQ is not running"
    exit 1
fi

if [ "$WINDOW_ID" = "NO_WINDOW" ]; then
    echo "ERROR: SERQ has no visible window"
    exit 1
fi

# Use screencapture with window selection by window ID
# -l flag takes a CGWindowID. We need to get it differently.
# Actually, let's use the more reliable approach: capture by app name bounds

# Get window bounds via AppleScript
BOUNDS=$(osascript -e '
tell application "System Events"
    set serqProcs to every process whose name contains "SERQ"
    if (count of serqProcs) = 0 then return "0,0,0,0"
    set serqProc to item 1 of serqProcs
    try
        tell serqProc
            set {x, y} to position of window 1
            set {w, h} to size of window 1
            return (x as text) & "," & (y as text) & "," & (w as text) & "," & (h as text)
        end tell
    on error
        return "0,0,0,0"
    end try
end tell
' 2>/dev/null)

if [ "$BOUNDS" = "0,0,0,0" ]; then
    echo "ERROR: Could not get SERQ window bounds"
    exit 1
fi

# Parse bounds
IFS=',' read -r X Y W H <<< "$BOUNDS"

# screencapture with region: -R x,y,w,h
screencapture -R "${X},${Y},${W},${H}" -x "$OUTPUT" 2>/dev/null

if [ $? -eq 0 ] && [ -f "$OUTPUT" ]; then
    echo "OK: Screenshot saved to $OUTPUT (${W}x${H} at ${X},${Y})"
else
    echo "ERROR: screencapture failed"
    exit 1
fi
