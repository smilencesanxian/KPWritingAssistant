#!/bin/bash
# =============================================================================
# watch-logs.sh - Follow the latest automation log, auto-switch to new files
# =============================================================================
# Usage: ./watch-logs.sh [log-dir]
# Default log-dir: ./automation-logs
# =============================================================================

LOG_DIR="${1:-./automation-logs}"

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

CURRENT_LOG=""
TAIL_PID=""

cleanup() {
    [ -n "$TAIL_PID" ] && kill "$TAIL_PID" 2>/dev/null
    echo ""
    exit 0
}
trap cleanup INT TERM

echo -e "${CYAN}Watching logs in: $LOG_DIR${NC}"
echo -e "${CYAN}Press Ctrl+C to stop${NC}"

while true; do
    # Get the most recently modified run-*.log (exclude .raw and rolled files like .1/.2)
    LATEST=$(ls -t "$LOG_DIR"/run-*.log 2>/dev/null | head -1)

    if [ -z "$LATEST" ]; then
        printf "\r${YELLOW}[Waiting for log files...]${NC}  "
        sleep 2
        continue
    fi

    if [ "$LATEST" != "$CURRENT_LOG" ]; then
        # Kill previous tail
        if [ -n "$TAIL_PID" ] && kill -0 "$TAIL_PID" 2>/dev/null; then
            kill "$TAIL_PID" 2>/dev/null
            wait "$TAIL_PID" 2>/dev/null
        fi
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  Now following: $(basename "$LATEST")${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        CURRENT_LOG="$LATEST"
        tail -f "$CURRENT_LOG" &
        TAIL_PID=$!
    fi

    sleep 3
done
