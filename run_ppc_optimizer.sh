#!/bin/bash
#
# Amazon PPC Optimizer Runner Script
# Runs every 2 hours via scheduled task
#

set -e

# Configuration
SCRIPT_DIR="/home/ubuntu"
LOG_DIR="$SCRIPT_DIR/ppc_logs"
PYTHON_SCRIPT="$SCRIPT_DIR/amazon_ppc_optimizer_advanced.py"
CONFIG_FILE="$SCRIPT_DIR/ppc_optimizer_config.yaml"
PROFILE_ID="1780498399290938"

# Create log directory
mkdir -p "$LOG_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/ppc_run_$TIMESTAMP.log"

echo "========================================" | tee -a "$LOG_FILE"
echo "Amazon PPC Optimizer - Scheduled Run" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "ERROR: Python script not found: $PYTHON_SCRIPT" | tee -a "$LOG_FILE"
    exit 1
fi

# Run the optimizer
echo "Running PPC Optimizer..." | tee -a "$LOG_FILE"
python3 "$PYTHON_SCRIPT" \
    --profile-id "$PROFILE_ID" \
    --scope NA \
    2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Completed: $(date)" | tee -a "$LOG_FILE"
echo "Exit Code: $EXIT_CODE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Keep only last 30 days of logs
find "$LOG_DIR" -name "ppc_run_*.log" -mtime +30 -delete
find "$LOG_DIR" -name "bid_audit_*.csv" -mtime +30 -delete

exit $EXIT_CODE
