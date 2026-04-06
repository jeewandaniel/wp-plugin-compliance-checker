#!/bin/bash
#
# WordPress.org Plugin Compliance Checker
# Quick check script for common rejection reasons
#
# Usage: ./check-compliance.sh /path/to/plugin
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if plugin path provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide plugin directory path${NC}"
    echo "Usage: $0 /path/to/plugin"
    exit 1
fi

PLUGIN_DIR="$1"

# Verify directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
    echo -e "${RED}Error: Directory not found: $PLUGIN_DIR${NC}"
    exit 1
fi

echo "=========================================="
echo " WordPress.org Plugin Compliance Checker"
echo "=========================================="
echo ""
echo "Checking: $PLUGIN_DIR"
echo ""

ERRORS=0
WARNINGS=0

# Function to check and report
check() {
    local type="$1"
    local message="$2"
    local result="$3"

    if [ -n "$result" ]; then
        if [ "$type" = "ERROR" ]; then
            echo -e "${RED}[ERROR]${NC} $message"
            echo "$result" | head -10
            ((ERRORS++)) || true
        else
            echo -e "${YELLOW}[WARN]${NC} $message"
            echo "$result" | head -5
            ((WARNINGS++)) || true
        fi
        echo ""
    fi
}

echo "=== PHASE 1: Inline Styles & Scripts ==="
echo ""

result=$(grep -rn "<style" --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "preg_replace\|wp_kses\|esc_\|htmlspecialchars" || true)
check "ERROR" "Inline <style> tags found (use wp_enqueue_style + wp_add_inline_style)" "$result"

result=$(grep -rn "<script" --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "preg_replace\|wp_kses\|esc_\|htmlspecialchars\|type=.application/json" || true)
check "ERROR" "Inline <script> tags found (use wp_enqueue_script + wp_add_inline_script)" "$result"

echo "=== PHASE 2: Input Sanitization ==="
echo ""

result=$(grep -rn '\$_POST\[' --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "sanitize_\|absint\|intval\|wp_unslash\|isset.*\$_POST\|phpcs:ignore\|phpcs:disable" || true)
check "ERROR" "Unsanitized \$_POST usage" "$result"

result=$(grep -rn '\$_GET\[' --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "sanitize_\|absint\|intval\|wp_unslash\|isset.*\$_GET\|phpcs:ignore\|phpcs:disable" || true)
check "ERROR" "Unsanitized \$_GET usage" "$result"

result=$(grep -rn '\$_REQUEST\[' --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "sanitize_\|absint\|intval\|wp_unslash\|phpcs:ignore\|phpcs:disable" || true)
check "ERROR" "Unsanitized \$_REQUEST usage" "$result"

echo "=== PHASE 3: Output Escaping ==="
echo ""

result=$(grep -rn "echo \$" --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "esc_\|wp_kses\|wp_json_encode\|json_encode\|phpcs:ignore\|phpcs:disable" || true)
check "ERROR" "Unescaped echo statements" "$result"

echo "=== PHASE 4: Function Naming ==="
echo ""

result=$(grep -rn "function _[a-z]" --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "__construct\|__destruct\|__get\|__set\|__call\|__toString\|__wakeup\|__sleep\|phpcs:ignore" || true)
check "ERROR" "Functions with leading underscore" "$result"

echo "=== PHASE 5: Forbidden Patterns ==="
echo ""

result=$(grep -rn "eval(\|passthru(\|proc_open(\|create_function(" --include="*.php" "$PLUGIN_DIR" 2>/dev/null || true)
check "ERROR" "Forbidden functions (eval, passthru, proc_open, create_function)" "$result"

result=$(grep -rn "ALLOW_UNFILTERED_UPLOADS" --include="*.php" "$PLUGIN_DIR" 2>/dev/null || true)
check "ERROR" "ALLOW_UNFILTERED_UPLOADS found" "$result"

result=$(grep -rn "localhost\|127\.0\.0\.1" --include="*.php" "$PLUGIN_DIR" 2>/dev/null | grep -v "phpcs:ignore" || true)
check "WARN" "Localhost references found" "$result"

result=$(grep -rn "<<<" --include="*.php" "$PLUGIN_DIR" 2>/dev/null || true)
check "WARN" "HEREDOC/NOWDOC usage (prevents escaping detection)" "$result"

echo "=== PHASE 6: File Structure ==="
echo ""

result=$(find "$PLUGIN_DIR" \( -name "*.sh" -o -name "*.phar" -o -name "*.exe" -o -name "*.zip" \) 2>/dev/null || true)
check "ERROR" "Forbidden files found" "$result"

result=$(find "$PLUGIN_DIR" -type d \( -name "node_modules" -o -name ".git" -o -name ".svn" -o -name ".cursor" -o -name ".claude" \) 2>/dev/null || true)
check "ERROR" "Forbidden directories found" "$result"

result=$(find "$PLUGIN_DIR" \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".cursorrules" \) 2>/dev/null || true)
check "ERROR" "AI instruction files found" "$result"

echo "=== PHASE 7: Version Consistency ==="
echo ""

if [ -f "$PLUGIN_DIR/readme.txt" ]; then
    STABLE_TAG=$(grep -i "Stable tag:" "$PLUGIN_DIR/readme.txt" 2>/dev/null | head -1 | cut -d':' -f2 | tr -d ' ')
    PLUGIN_VERSION=$(grep -i "Version:" "$PLUGIN_DIR"/*.php 2>/dev/null | head -1 | cut -d':' -f2 | tr -d ' ')

    if [ "$STABLE_TAG" = "trunk" ]; then
        echo -e "${RED}[ERROR]${NC} Stable tag is 'trunk' - must be version number"
        ((ERRORS++)) || true
    elif [ "$STABLE_TAG" != "$PLUGIN_VERSION" ]; then
        echo -e "${RED}[ERROR]${NC} Version mismatch: readme.txt=$STABLE_TAG, plugin=$PLUGIN_VERSION"
        ((ERRORS++)) || true
    else
        echo -e "${GREEN}[OK]${NC} Versions match: $STABLE_TAG"
    fi

    TAG_COUNT=$(grep -i "^Tags:" "$PLUGIN_DIR/readme.txt" 2>/dev/null | tr ',' '\n' | wc -l | tr -d ' ')
    if [ "$TAG_COUNT" -gt 5 ]; then
        echo -e "${RED}[ERROR]${NC} Too many tags ($TAG_COUNT) - maximum is 5"
        ((ERRORS++)) || true
    fi
else
    echo -e "${RED}[ERROR]${NC} readme.txt not found"
    ((ERRORS++)) || true
fi

echo ""
echo "=========================================="
echo " SUMMARY"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo "Your plugin appears ready for submission."
    echo ""
    echo "Recommended: Also run the official Plugin Check tool"
    echo "https://wordpress.org/plugins/plugin-check/"
else
    echo -e "Errors: ${RED}$ERRORS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}NOT READY for submission - fix errors first${NC}"
    else
        echo -e "${YELLOW}Review warnings before submission${NC}"
    fi
fi

exit $ERRORS
