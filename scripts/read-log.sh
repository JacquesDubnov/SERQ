#!/bin/bash
# SERQ Debug Log Reader
# Quick access to the debug bridge log file.
#
# Usage:
#   ./scripts/read-log.sh          # Show last 50 lines
#   ./scripts/read-log.sh 100      # Show last 100 lines
#   ./scripts/read-log.sh all      # Show entire log
#   ./scripts/read-log.sh clear    # Clear the log file
#   ./scripts/read-log.sh errors   # Show only errors
#   ./scripts/read-log.sh watch    # Live tail (Ctrl+C to stop)

LOG_FILE="$HOME/.serq-debug.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "No debug log found at $LOG_FILE"
    echo "Start SERQ with 'npm run tauri dev' to begin logging."
    exit 0
fi

case "${1:-50}" in
    clear)
        > "$LOG_FILE"
        echo "Debug log cleared."
        ;;
    all)
        cat "$LOG_FILE"
        ;;
    errors)
        grep -i "ERROR\|UNCAUGHT\|UNHANDLED" "$LOG_FILE" | tail -n "${2:-50}"
        ;;
    watch)
        echo "Watching $LOG_FILE (Ctrl+C to stop)..."
        tail -f "$LOG_FILE"
        ;;
    *)
        tail -n "$1" "$LOG_FILE"
        ;;
esac
