#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$REPO_ROOT/scripts/check-rules.sh"
FIXTURES_DIR="$REPO_ROOT/fixtures"

FAILURES=0

assert_exit_code() {
    local actual="$1"
    local expected="$2"
    local label="$3"

    if [ "$actual" -ne "$expected" ]; then
        echo "FAIL: $label expected exit $expected but got $actual"
        ((FAILURES++)) || true
    else
        echo "PASS: $label exit code"
    fi
}

assert_contains() {
    local haystack_file="$1"
    local needle="$2"
    local label="$3"

    if grep -F "$needle" "$haystack_file" >/dev/null 2>&1; then
        echo "PASS: $label contains $needle"
    else
        echo "FAIL: $label missing $needle"
        ((FAILURES++)) || true
    fi
}

assert_json_expr() {
    local json_file="$1"
    local jq_expr="$2"
    local label="$3"

    if jq -e "$jq_expr" "$json_file" >/dev/null 2>&1; then
        echo "PASS: $label json assertion"
    else
        echo "FAIL: $label json assertion failed: $jq_expr"
        ((FAILURES++)) || true
    fi
}

run_case() {
    local name="$1"
    local fixture_path="$2"
    local expected_status="$3"
    shift 3
    local -a needles=("$@")
    local output_file
    local status=0

    output_file="$(mktemp)"

    if bash "$RUNNER" "$fixture_path" >"$output_file" 2>&1; then
        status=0
    else
        status=$?
    fi

    assert_exit_code "$status" "$expected_status" "$name"

    for needle in "${needles[@]}"; do
        assert_contains "$output_file" "$needle" "$name"
    done

    rm -f "$output_file"
}

run_json_case() {
    local name="$1"
    local fixture_path="$2"
    local expected_status="$3"
    local jq_expr="$4"
    local output_file
    local status=0

    output_file="$(mktemp)"

    if bash "$RUNNER" --format=json "$fixture_path" >"$output_file" 2>&1; then
        status=0
    else
        status=$?
    fi

    assert_exit_code "$status" "$expected_status" "$name json"
    assert_json_expr "$output_file" "$jq_expr" "$name json"

    rm -f "$output_file"
}

run_case \
    "minimal-pass" \
    "$FIXTURES_DIR/pass/minimal-pass" \
    0 \
    "No findings from executable rules."

run_case \
    "inline-style" \
    "$FIXTURES_DIR/fail/inline-style" \
    1 \
    "plugin_repo.no_inline_style_tags"

run_case \
    "naming-and-readme" \
    "$FIXTURES_DIR/fail/naming-and-readme" \
    3 \
    "plugin_repo.leading_underscore_functions" \
    "plugin_repo.readme_tag_limit" \
    "plugin_repo.direct_file_access"

run_case \
    "release-artifacts" \
    "$FIXTURES_DIR/fail/release-artifacts" \
    2 \
    "plugin_repo.forbidden_release_files" \
    "plugin_repo.forbidden_ai_artifacts"

run_case \
    "localhost-and-heredoc" \
    "$FIXTURES_DIR/fail/localhost-and-heredoc" \
    0 \
    "plugin_repo.localhost_references" \
    "plugin_repo.heredoc_usage"

run_json_case \
    "minimal-pass" \
    "$FIXTURES_DIR/pass/minimal-pass" \
    0 \
    '.summary.errors == 0 and (.findings | length) == 0 and .runner == "check-rules.sh"'

run_json_case \
    "naming-and-readme" \
    "$FIXTURES_DIR/fail/naming-and-readme" \
    3 \
    '.summary.errors == 3 and (.findings | map(.rule_id) | index("plugin_repo.direct_file_access")) != null'

if [ "$FAILURES" -gt 0 ]; then
    echo "Tests failed: $FAILURES"
    exit 1
fi

echo "All rules runner tests passed."
