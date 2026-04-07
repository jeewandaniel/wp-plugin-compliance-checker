#!/usr/bin/env bash
#
# Compatibility wrapper for the rules-driven runner.
# Preserves the legacy entrypoint while converging behavior on check-rules.sh.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/check-rules.sh"

exec bash "$RUNNER" "$@"
