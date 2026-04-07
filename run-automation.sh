#!/bin/bash

# =============================================================================
# run-automation.sh - Automated Task Runner
# =============================================================================
# This script runs Claude Code multiple times in a loop to automatically
# complete tasks defined in task-v1.2.0.json
#
# Usage: ./run-automation.sh <number_of_runs> [--llm <kimi|official>]
# Example: ./run-automation.sh 5
# Example: ./run-automation.sh 5 --llm official
# =============================================================================

set -e
set -o pipefail

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# LLM Configuration
LLM_TYPE="kimi"  # default to kimi

# API Keys (Kimi)
KIMI_API_KEY="sk-kimi-IbgKnhIbTN9e5cQGcvh6mtH1YRNziYCQ8LNgS8TEZesOvJvpHRbjsoIvaC9usiuc"

# Proxy settings (for official)
PROXY_URL="http://127.0.0.1:33210"

# Log cleanup configuration (customizable)
MAX_LOG_FILES="${MAX_LOG_FILES:-20}"      # Maximum number of log files to keep (default: 20)
MAX_LOG_SIZE="${MAX_LOG_SIZE:-2097152}"   # Maximum size per log file in bytes (default: 2MB = 2097152)

# Lock file (unique per project directory)
LOCK_FILE="/tmp/run-automation-$(cd "$(dirname "$0")" && pwd | tr '/' '_').lock"

# Background job PID (used by cleanup)
BG_PID=""
WATCHDOG_PID=""

# Soft-stop flag: set to 1 to finish current task then exit
SOFT_STOP=0

acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local existing_pid
        existing_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            echo -e "${RED}[ERROR]${NC} Another instance is running (PID: $existing_pid), please wait."
            echo -e "${YELLOW}[INFO]${NC} To force stop: kill $existing_pid"
            exit 1
        else
            echo -e "${YELLOW}[WARNING]${NC} Stale lock file found (PID: $existing_pid no longer exists), cleaning up..."
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

release_lock() {
    rm -f "$LOCK_FILE"
}

# Function to clean up old log files
# Keeps only the most recent MAX_LOG_FILES files
cleanup_logs() {
    local log_dir="$1"

    if [ ! -d "$log_dir" ]; then
        return 0
    fi

    # Count total log files (including .raw and numbered log files)
    local total_files
    total_files=$(find "$log_dir" -maxdepth 1 -type f \( -name "run-*.log" -o -name "run-*.log.*" \) 2>/dev/null | wc -l)

    if [ "$total_files" -eq 0 ]; then
        return 0
    fi

    # If exceeding max files, remove oldest ones
    if [ "$total_files" -gt "$MAX_LOG_FILES" ]; then
        local files_to_remove=$((total_files - MAX_LOG_FILES))
        echo -e "${YELLOW}[WARNING]${NC} Log files ($total_files) exceed limit ($MAX_LOG_FILES), removing $files_to_remove oldest..."

        # Get oldest files (sorted by modification time) and remove them
        find "$log_dir" -maxdepth 1 -type f \( -name "run-*.log" -o -name "run-*.log.*" \) \
            -printf '%T@ %p\n' 2>/dev/null | \
            sort -n | \
            head -n "$files_to_remove" | \
            cut -d' ' -f2- | \
            while read -r file; do
                rm -f "$file"
                echo -e "${BLUE}[INFO]${NC} Removed old log: $(basename "$file")"
            done
    fi
}

cleanup() {
    local exit_code=$?
    if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
        kill "$WATCHDOG_PID" 2>/dev/null || true
        wait "$WATCHDOG_PID" 2>/dev/null || true
    fi
    if [ -n "$BG_PID" ] && kill -0 "$BG_PID" 2>/dev/null; then
        kill "$BG_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$BG_PID" 2>/dev/null || true
        wait "$BG_PID" 2>/dev/null || true
    fi
    rm -f "$STOP_FILE" 2>/dev/null || true
    release_lock
    exit $exit_code
}

# Soft-stop handler: finish current task then exit gracefully
handle_soft_stop() {
    SOFT_STOP=1
    echo -e "\n${YELLOW}[SOFT-STOP]${NC} Signal received — will stop after current task completes."
    echo -e "${YELLOW}[SOFT-STOP]${NC} Press Ctrl+C again to force-stop immediately."
}

trap cleanup INT TERM EXIT
trap handle_soft_stop USR1

# Function to setup environment for different LLM types
# NOTE: Only sets environment variables — never touches .credentials.json
# to avoid invalidating the official token.
setup_llm_environment() {
    local llm_type=$1

    case "$llm_type" in
        official)
            echo -e "${BLUE}[INFO]${NC} Setting up Claude Official environment..."
            export https_proxy="$PROXY_URL"
            export ANTHROPIC_BASE_URL="https://api.anthropic.com"
            unset ANTHROPIC_AUTH_TOKEN
            ;;
        kimi)
            echo -e "${BLUE}[INFO]${NC} Setting up Kimi environment..."
            unset https_proxy
            export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"
            export ANTHROPIC_AUTH_TOKEN="$KIMI_API_KEY"
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Unknown LLM type: $llm_type"
            echo "Supported types: kimi, official"
            exit 1
            ;;
    esac
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"

    case $level in
        INFO) echo -e "${BLUE}[INFO]${NC} ${message}" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${message}" ;;
        WARNING) echo -e "${YELLOW}[WARNING]${NC} ${message}" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${message}" ;;
        PROGRESS) echo -e "${CYAN}[PROGRESS]${NC} ${message}" ;;
    esac
}

count_remaining_tasks() {
    local count=0
    if [ -f "task-v1.2.0.json" ]; then
        count=$(grep -c '"passes": false' task-v1.2.0.json 2>/dev/null | head -1)
    fi
    # Ensure we output a valid number (default to 0 if empty or invalid)
    if ! [[ "$count" =~ ^[0-9]+$ ]]; then
        count=0
    fi
    echo "$count"
}

# Parse arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <number_of_runs> [--llm <kimi|official>]"
    echo "Example: $0 5"
    echo "Example: $0 5 --llm official"
    exit 1
fi

if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "Error: Argument must be a positive integer"
    exit 1
fi

TOTAL_RUNS=$1

# Parse optional --llm argument
if [ -n "$2" ] && [ "$2" = "--llm" ] && [ -n "$3" ]; then
    LLM_TYPE="$3"
fi

# Validate LLM type
if [ "$LLM_TYPE" != "kimi" ] && [ "$LLM_TYPE" != "official" ]; then
    echo "Error: Invalid LLM type '$LLM_TYPE'"
    echo "Supported types: kimi, official"
    exit 1
fi

acquire_lock

# Setup environment for selected LLM
setup_llm_environment "$LLM_TYPE"

LOG_DIR="./automation-logs"
mkdir -p "$LOG_DIR"
STOP_FILE="$LOG_DIR/STOP"
# Clean up any leftover stop file from a previous run
rm -f "$STOP_FILE" 2>/dev/null || true

# Clean up old log files before starting
cleanup_logs "$LOG_DIR"

LOG_FILE="$LOG_DIR/automation-$(date +%Y%m%d_%H%M%S).log"

echo ""
echo "========================================"
echo "  Claude Code Automation Runner"
echo "========================================"
echo ""

log "INFO" "Starting automation with $TOTAL_RUNS runs"
log "INFO" "LLM Type: $LLM_TYPE"
log "INFO" "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
log "INFO" "Log file: $LOG_FILE"
log "INFO" "PID: $$"
echo -e "${CYAN}  Soft-stop methods (finish current task then exit):${NC}"
echo -e "${CYAN}    kill -USR1 $$${NC}          (send signal)"
echo -e "${CYAN}    touch $STOP_FILE${NC}  (create stop file)"
echo -e "${CYAN}  Hard-stop: Ctrl+C (immediate, current task aborted)${NC}"
echo ""

if [ ! -f "task-v1.2.0.json" ]; then
    log "ERROR" "task-v1.2.0.json not found! Please run this script from the project root."
    exit 1
fi

INITIAL_TASKS=$(count_remaining_tasks)
log "INFO" "Tasks remaining at start: $INITIAL_TASKS"

if ! command -v claude &> /dev/null; then
    log "ERROR" "claude command not found. Please install Claude Code CLI."
    exit 1
fi

log "INFO" "Checking Claude Code..."
if ! claude --version &>/dev/null; then
    log "ERROR" "Claude Code CLI not responding. Please check installation."
    exit 1
fi

for ((run=1; run<=TOTAL_RUNS; run++)); do
    echo ""
    echo "========================================"
    log "PROGRESS" "Run $run of $TOTAL_RUNS (LLM: $LLM_TYPE)"
    echo "========================================"

    # Check for soft-stop (signal or touch file) before starting a new run
    if [ "$run" -gt 1 ]; then
        if [ "$SOFT_STOP" -eq 1 ] || [ -f "$STOP_FILE" ]; then
            log "INFO" "Soft-stop: previous task completed. Stopping before run $run."
            break
        fi
    fi

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

    PROMPT_FILE=$(mktemp)
    cat > "$PROMPT_FILE" << 'EOF'
继续下一个任务，每次只完成一个任务，完成后输出结果并结束会话。
EOF

    EXIT_CODE_FILE=$(mktemp)
    WATCHDOG_TRIGGERED_FILE=$(mktemp)

    (
        sleep 3600
        echo "1" > "$WATCHDOG_TRIGGERED_FILE"
        if [ -n "$BG_PID" ] && kill -0 "$BG_PID" 2>/dev/null; then
            kill "$BG_PID" 2>/dev/null || true
        fi
    ) &
    WATCHDOG_PID=$!

    # Create JSON processor script - outputs human readable format with rolling logs
    JSON_PROCESSOR=$(mktemp)
    cat > "$JSON_PROCESSOR" << 'PROCESSOR_EOF'
#!/usr/bin/env python3
import sys
import json
import os
from datetime import datetime

if len(sys.argv) < 2:
    print("Usage: processor.py <log_file>", file=sys.stderr)
    sys.exit(1)

# Get max log size from env (default 2MB = 2097152 bytes)
MAX_LOG_SIZE = int(os.environ.get('MAX_LOG_SIZE', 2097152))
# Start rolling at 90% of max to avoid going over
ROLL_THRESHOLD = int(MAX_LOG_SIZE * 0.9)

base_log_file = sys.argv[1]
base_raw_file = base_log_file + ".raw"

class RollingLogWriter:
    """Handles rolling log files when size limit is reached."""
    def __init__(self, base_path, mode='w', encoding='utf-8'):
        self.base_path = base_path
        self.mode = mode
        self.encoding = encoding
        self.current_file = base_path
        self.roll_number = 0
        self._open()

    def _open(self):
        self.file = open(self.current_file, self.mode, encoding=self.encoding)
        self.current_size = os.path.getsize(self.current_file) if os.path.exists(self.current_file) else 0

    def _roll(self):
        """Close current file and create a new numbered file."""
        self.file.flush()
        self.file.close()
        self.roll_number += 1
        self.current_file = f"{self.base_path}.{self.roll_number}"
        self._open()
        ts = datetime.now().strftime("%H:%M:%S")
        self.file.write(f"[{ts}] --- Log continued from {self.base_path}" +
                       (f".{self.roll_number - 1}" if self.roll_number > 1 else "") + " ---\n\n")
        self.current_size = os.path.getsize(self.current_file)

    def write(self, data):
        data_bytes = data.encode(self.encoding)
        new_size = self.current_size + len(data_bytes)
        # Roll if approaching limit (but don't roll empty files)
        if new_size > ROLL_THRESHOLD and self.current_size > 0:
            self._roll()
            data_bytes = data.encode(self.encoding)
            new_size = self.current_size + len(data_bytes)
        self.file.write(data)
        self.current_size = new_size

    def flush(self):
        self.file.flush()

    def close(self):
        self.file.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

def process_event(event, log_writer, ts):
    """Process a single event and write to log."""
    # assistant event: Claude's response + tool calls
    if event.get("type") == "assistant":
        msg = event.get("message", {})
        content = msg.get("content", [])
        for block in content:
            if block.get("type") == "text" and block.get("text"):
                text = block["text"].strip()
                # Skip text that looks like tool call syntax
                if text.startswith("functions.") and ("{" in text or "}" in text):
                    continue
                log_writer.write(f"[{ts}][Claude]\n")
                log_writer.write(text)
                log_writer.write("\n\n")
            elif block.get("type") == "tool_use":
                name = block.get("name", "")
                input_data = block.get("input", {})
                try:
                    input_json = json.dumps(input_data, ensure_ascii=False, separators=(',', ':'))
                except:
                    input_json = str(input_data)
                log_writer.write(f"[{ts}][Tool: {name}]\n")
                log_writer.write(input_json)
                log_writer.write("\n\n")
        log_writer.flush()

    # user event: tool results
    elif event.get("type") == "user":
        msg = event.get("message", {})
        content = msg.get("content", [])
        for block in content:
            if block.get("type") == "tool_result":
                result_content = block.get("content", "")
                result_text = ""
                if isinstance(result_content, str):
                    result_text = result_content
                elif isinstance(result_content, list):
                    for item in result_content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            result_text += item.get("text", "")
                if result_text:
                    log_writer.write(f"[{ts}][Tool Result]\n")
                    log_writer.write(result_text.strip())
                    log_writer.write("\n\n")
                    log_writer.flush()

    # result event: session summary
    elif event.get("type") == "result":
        log_writer.write(f"[{ts}][Session End]\n")
        if "cost_usd" in event:
            log_writer.write(f"Cost:     ${event['cost_usd']}\n")
        if "duration_ms" in event:
            duration_s = int(event["duration_ms"] / 1000)
            log_writer.write(f"Duration: {duration_s}s\n")
        log_writer.write("\n")
        log_writer.flush()

def main():
    # Track if we need to add newline before next output
    need_newline = False
    # Track current block type to handle partial content
    current_block_type = None
    # Track which messages we've already output (to avoid duplicates)
    seen_message_ids = set()

    with RollingLogWriter(base_log_file) as log_writer, \
         RollingLogWriter(base_raw_file) as raw_writer:

        try:
            for line in sys.stdin:
                # Save raw JSON line
                raw_writer.write(line)
                raw_writer.flush()

                # Console: real-time text display from assistant events
                try:
                    event = json.loads(line)
                    event_type = event.get("type")

                    # Handle assistant events (complete messages)
                    if event_type == "assistant":
                        msg = event.get("message", {})
                        msg_id = msg.get("id")

                        # Skip if we've seen this message before
                        if msg_id in seen_message_ids:
                            continue
                        seen_message_ids.add(msg_id)

                        content = msg.get("content", [])
                        for block in content:
                            block_type = block.get("type")

                            if block_type == "text":
                                text = block.get("text", "")
                                if text:
                                    # Filter out tool call syntax just in case
                                    if not (text.strip().startswith("functions.") and ("{" in text or "}" in text)):
                                        sys.stdout.write(text)
                                        sys.stdout.flush()
                                        need_newline = True

                            elif block_type == "tool_use":
                                # Don't show tool calls in console
                                pass

                        # Add newline after assistant message if we output text
                        if need_newline:
                            sys.stdout.write("\n")
                            sys.stdout.flush()
                            need_newline = False

                    # Handle result event (session end)
                    elif event_type == "result":
                        if need_newline:
                            sys.stdout.write("\n")
                            sys.stdout.flush()
                            need_newline = False

                except json.JSONDecodeError:
                    pass

                # Log: human readable content
                ts = datetime.now().strftime("%H:%M:%S")

                try:
                    event = json.loads(line)
                    process_event(event, log_writer, ts)

                except json.JSONDecodeError:
                    # Non-JSON (stderr): console + log
                    sys.stdout.write(line)
                    sys.stdout.flush()
                    log_writer.write(f"[{ts}] {line}")
                    log_writer.flush()
                except Exception as e:
                    # Other errors
                    log_writer.write(f"[{ts}] Error processing line: {e}\n")
                    log_writer.flush()

        except KeyboardInterrupt:
            # Handle Ctrl+C gracefully
            ts = datetime.now().strftime("%H:%M:%S")
            log_writer.write(f"[{ts}] [Interrupted by user]\n")
            log_writer.flush()
            sys.exit(0)
        except BrokenPipeError:
            # Handle pipe break (e.g., when claude process is killed)
            sys.exit(0)

if __name__ == "__main__":
    main()
PROCESSOR_EOF
    chmod +x "$JSON_PROCESSOR"

    # Run claude with JSON output and process in real-time
    export LC_ALL=C.UTF-8
    export LANG=C.UTF-8
    export MAX_LOG_SIZE="$MAX_LOG_SIZE"

    # Run in subshell with pipefail to capture claude's exit code
    (
        set -o pipefail
        export MAX_LOG_SIZE="$MAX_LOG_SIZE"
        claude -p "$(cat "$PROMPT_FILE")" \
            --dangerously-skip-permissions \
            # --allowed-tools "Bash Edit Read Write Glob Grep TodoWrite TodoRead WebSearch WebFetch mcp__playwright__*" \
            --output-format stream-json \
            --verbose 2>&1 | "$JSON_PROCESSOR" "$RUN_LOG"
        echo $? > "$EXIT_CODE_FILE"
    ) &
    BG_PID=$!

    # Wait for completion
    wait "$BG_PID" 2>/dev/null || true
    BG_PID=""

    WATCHDOG_TRIGGERED=$(cat "$WATCHDOG_TRIGGERED_FILE" 2>/dev/null || echo "0")

    rm -f "$PROMPT_FILE" "$JSON_PROCESSOR"

    if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
        kill "$WATCHDOG_PID" 2>/dev/null || true
        wait "$WATCHDOG_PID" 2>/dev/null || true
    fi
    WATCHDOG_PID=""

    # Read exit code from file
    CLAUDE_EXIT=$(cat "$EXIT_CODE_FILE" 2>/dev/null || echo "1")
    rm -f "$EXIT_CODE_FILE" "$WATCHDOG_TRIGGERED_FILE"

    if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
        kill "$WATCHDOG_PID" 2>/dev/null || true
        wait "$WATCHDOG_PID" 2>/dev/null || true
    fi
    WATCHDOG_PID=""

    RUN_END=$(date +%s)
    RUN_DURATION=$((RUN_END - RUN_START))

    if [ "$WATCHDOG_TRIGGERED" = "1" ]; then
        log "ERROR" "Run $run TIMED OUT after 60 minutes. Stopping all subsequent runs."
        exit 1
    fi

    case "$CLAUDE_EXIT" in
        ''|*[!0-9]*) CLAUDE_EXIT=1 ;;
    esac

    if [ "$CLAUDE_EXIT" -eq 0 ]; then
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

echo ""
echo "========================================"
log "SUCCESS" "Automation completed!"
echo "========================================"

FINAL_REMAINING=$(count_remaining_tasks)
TOTAL_COMPLETED=$((INITIAL_TASKS - FINAL_REMAINING))

log "INFO" "Summary:"
log "INFO" "  - Total runs: $TOTAL_RUNS"
log "INFO" "  - LLM Type: $LLM_TYPE"
log "INFO" "  - Tasks completed: $TOTAL_COMPLETED"
log "INFO" "  - Tasks remaining: $FINAL_REMAINING"
log "INFO" "  - Log file: $LOG_FILE"

if [ "$FINAL_REMAINING" -eq 0 ]; then
    log "SUCCESS" "All tasks have been completed!"
else
    log "WARNING" "Some tasks remain. You may need to run more iterations."
fi
