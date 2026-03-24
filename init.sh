#!/bin/bash

# =============================================================================
# init.sh - Project Initialization Script
# =============================================================================
# Run this script at the start of every session to ensure the environment
# is properly set up and the development server is running.
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Initializing KPWritingAssistant project...${NC}"

# Install dependencies
echo "Installing dependencies..."
cd KPWritingAssistant-web && npm install && cd ..

# Kill any existing process on port 3000 before starting
echo "Checking for existing processes on port 3000..."
if fuser 3000/tcp > /dev/null 2>&1; then
    echo "Killing existing process on port 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 1
fi

# Start development server in background
echo "Starting development server..."
cd KPWritingAssistant-web
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 3

echo -e "${GREEN}✓ Initialization complete!${NC}"
echo -e "${GREEN}✓ Dev server running at http://localhost:3000 (PID: $SERVER_PID)${NC}"
echo ""
echo "Ready to continue development."
