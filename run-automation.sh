#!/bin/bash

# =============================================================================
# run-automation.sh - Automated Task Runner
# =============================================================================
# This script runs Claude Code multiple times in a loop to automatically
# complete tasks defined in task.json
#
# Usage: ./run-automation.sh <number_of_runs>
# Example: ./run-automation.sh 5
# =============================================================================

set -e
set -o pipefail

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Lock file (unique per project directory)
LOCK_FILE="/tmp/run-automation-$(cd "$(dirname "$0")" && pwd | tr '/' '_').lock"

# Background job PID (used by cleanup)
BG_PID=""

acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local existing_pid
        existing_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            echo -e "${RED}[ERROR]${NC} 另一个实例正在运行（PID: $existing_pid），请等待其完成后再试。"
            echo -e "${YELLOW}[INFO]${NC} 如需强制终止，请执行: kill $existing_pid"
            exit 1
        else
            echo -e "${YELLOW}[WARNING]${NC} 发现残留锁文件（PID: $existing_pid 已不存在），清理后继续..."
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

release_lock() {
    rm -f "$LOCK_FILE"
}

cleanup() {
    release_lock
    if [ -n "$BG_PID" ]; then
        kill "$BG_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$BG_PID" 2>/dev/null || true
    fi
}

# Ctrl+C / kill: 立即触发 cleanup（因为 claude 是后台运行，wait 可被中断）
trap 'cleanup; exit 130' INT TERM
# 正常退出也释放锁
trap 'release_lock' EXIT

acquire_lock

# Log file
LOG_DIR="./automation-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/automation-$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"

    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${message}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}"
            ;;
        PROGRESS)
            echo -e "${CYAN}[PROGRESS]${NC} ${message}"
            ;;
    esac
}

# Function to count remaining tasks
count_remaining_tasks() {
    if [ -f "task.json" ]; then
        local count=$(grep -c '"passes": false' task.json 2>/dev/null || echo "0")
        echo "$count"
    else
        echo "0"
    fi
}

# Check if number argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <number_of_runs>"
    echo "Example: $0 5"
    exit 1
fi

# Validate input is a number
if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "Error: Argument must be a positive integer"
    exit 1
fi

TOTAL_RUNS=$1

# Banner
echo ""
echo "========================================"
echo "  Claude Code Automation Runner"
echo "========================================"
echo ""

log "INFO" "Starting automation with $TOTAL_RUNS runs"
log "INFO" "Log file: $LOG_FILE"

# Check if task.json exists
if [ ! -f "task.json" ]; then
    log "ERROR" "task.json not found! Please run this script from the project root."
    exit 1
fi

# Initial task count
INITIAL_TASKS=$(count_remaining_tasks)
log "INFO" "Tasks remaining at start: $INITIAL_TASKS"

# Main loop
for ((run=1; run<=TOTAL_RUNS; run++)); do
    echo ""
    echo "========================================"
    log "PROGRESS" "Run $run of $TOTAL_RUNS"
    echo "========================================"

    REMAINING=$(count_remaining_tasks)

    if [ "$REMAINING" -eq 0 ]; then
        log "SUCCESS" "All tasks completed! No more tasks to process."
        log "INFO" "Automation finished early after $((run-1)) runs"
        exit 0
    fi

    log "INFO" "Tasks remaining before this run: $REMAINING"

    RUN_START=$(date +%s)
    RUN_LOG="$LOG_DIR/run-${run}-$(date +%Y%m%d_%H%M%S).log"

    log "INFO" "Starting Claude Code session..."
    log "INFO" "Run log: $RUN_LOG"

    PROMPT="Please follow the workflow in CLAUDE.md:
1. Read task.json and select the next task with passes: false
2. Implement the task following all steps
3. Test thoroughly (run npm run lint and npm run build in hello-nextjs/)
4. Update progress.txt with your work
5. Commit all changes including task.json update in a single commit

Start by reading task.json to find your task.
Please complete only one task in this session, and stop once you are done or if you encounter an unresolvable issue."

    # 用临时文件保存 claude 真实退出码
    EXIT_CODE_FILE=$(mktemp)

    # 后台运行 pipeline，使得 Ctrl+C 可以立即通过 trap 响应
    # timeout 2小时超时
    {
        timeout 7200 claude -p "$PROMPT" \
            --dangerously-skip-permissions \
            --allowed-tools "Bash Edit Read Write Glob Grep TodoWrite TodoRead WebSearch WebFetch mcp__playwright__*"
        echo $? > "$EXIT_CODE_FILE"
    } 2>&1 | tee "$RUN_LOG" &

    BG_PID=$!

    # wait 可被 Ctrl+C 中断，立即触发 trap
    wait "$BG_PID" || true

    CLAUDE_EXIT=$(cat "$EXIT_CODE_FILE" 2>/dev/null || echo "1")
    rm -f "$EXIT_CODE_FILE"
    BG_PID=""

    RUN_END=$(date +%s)
    RUN_DURATION=$((RUN_END - RUN_START))

    if [ "$CLAUDE_EXIT" -eq 124 ]; then
        log "ERROR" "Run $run TIMED OUT after 2 hours. Stopping all subsequent runs."
        exit 1
    elif [ "$CLAUDE_EXIT" -eq 0 ]; then
        log "SUCCESS" "Run $run completed in ${RUN_DURATION} seconds"
    else
        log "WARNING" "Run $run finished with exit code $CLAUDE_EXIT after ${RUN_DURATION} seconds"
    fi

    REMAINING_AFTER=$(count_remaining_tasks)
    COMPLETED=$((REMAINING - REMAINING_AFTER))

    if [ "$COMPLETED" -gt 0 ]; then
        log "SUCCESS" "Task(s) completed this run: $COMPLETED"
    else
        log "WARNING" "No tasks marked as completed this run"
    fi

    log "INFO" "Tasks remaining after run $run: $REMAINING_AFTER"

    echo "" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    if [ $run -lt $TOTAL_RUNS ]; then
        log "INFO" "Waiting 2 seconds before next run..."
        sleep 2
    fi
done

# Final summary
echo ""
echo "========================================"
log "SUCCESS" "Automation completed!"
echo "========================================"

FINAL_REMAINING=$(count_remaining_tasks)
TOTAL_COMPLETED=$((INITIAL_TASKS - FINAL_REMAINING))

log "INFO" "Summary:"
log "INFO" "  - Total runs: $TOTAL_RUNS"
log "INFO" "  - Tasks completed: $TOTAL_COMPLETED"
log "INFO" "  - Tasks remaining: $FINAL_REMAINING"
log "INFO" "  - Log file: $LOG_FILE"

if [ "$FINAL_REMAINING" -eq 0 ]; then
    log "SUCCESS" "All tasks have been completed!"
else
    log "WARNING" "Some tasks remain. You may need to run more iterations."
fi
