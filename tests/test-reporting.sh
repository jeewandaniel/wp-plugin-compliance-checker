#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI="$REPO_ROOT/bin/wp-plugin-compliance"
RUNNER="$REPO_ROOT/scripts/check-rules.sh"
REPORTER="$REPO_ROOT/scripts/render-markdown-report.sh"
FIXTURES_DIR="$REPO_ROOT/fixtures"
PLUGIN_CHECK_FIXTURE="$REPO_ROOT/tests/plugin-check-sample.json"
PLUGIN_CHECK_STREAM_FIXTURE="$REPO_ROOT/tests/plugin-check-results.txt"

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

run_reporting_case() {
    local name="$1"
    local fixture_path="$2"
    local expected_status="$3"
    local json_expr="$4"
    local markdown_needle="$5"
    shift 5
    local -a scan_args=("$@")
    local json_file markdown_file status

    json_file="$(mktemp)"
    markdown_file="$(mktemp)"
    status=0

    if [ "${#scan_args[@]}" -gt 0 ]; then
        if bash "$CLI" scan --format=json "${scan_args[@]}" "$fixture_path" >"$json_file" 2>&1; then
            status=0
        else
            status=$?
        fi
    else
        if bash "$CLI" scan --format=json "$fixture_path" >"$json_file" 2>&1; then
            status=0
        else
            status=$?
        fi
    fi

    assert_exit_code "$status" "$expected_status" "$name cli scan"
    assert_json_expr "$json_file" "$json_expr" "$name cli scan"

    bash "$CLI" report "$json_file" >"$markdown_file"

    assert_contains "$markdown_file" "# WordPress.org Compliance Report" "$name markdown"
    assert_contains "$markdown_file" "$markdown_needle" "$name markdown"

    rm -f "$json_file" "$markdown_file"
}

run_auto_reporting_case() {
    local name="$1"
    local temp_root plugin_dir json_file markdown_file status

    temp_root="$(mktemp -d)"
    plugin_dir="$temp_root/release-artifacts"
    json_file="$(mktemp)"
    markdown_file="$(mktemp)"
    status=0

    cp -R "$FIXTURES_DIR/fail/release-artifacts" "$plugin_dir"
    cp "$PLUGIN_CHECK_STREAM_FIXTURE" "$temp_root/plugin-check-results.txt"

    if (
        cd "$temp_root" &&
        bash "$CLI" scan --format=json --plugin-check-auto "$plugin_dir" >"$json_file" 2>&1
    ); then
        status=0
    else
        status=$?
    fi

    # Exit code 1 = findings exist (standardized exit codes)
    assert_exit_code "$status" 1 "$name cli scan"
    assert_json_expr "$json_file" '.summary.errors == 3 and .summary.warnings == 1 and .sources.plugin_check.findings == 2' "$name cli scan"

    bash "$CLI" report "$json_file" >"$markdown_file"

    assert_contains "$markdown_file" "# WordPress.org Compliance Report" "$name markdown"
    assert_contains "$markdown_file" "Imported Plugin Check findings: 2" "$name markdown"

    rm -rf "$temp_root"
    rm -f "$json_file" "$markdown_file"
}

run_reporting_case \
    "minimal-pass" \
    "$FIXTURES_DIR/pass/minimal-pass" \
    0 \
    '.summary.errors == 0 and (.findings | length) == 0' \
    "Ready for deeper review."

# Exit code 1 = findings exist (standardized exit codes)
run_reporting_case \
    "release-artifacts" \
    "$FIXTURES_DIR/fail/release-artifacts" \
    1 \
    '.summary.errors == 2 and (.findings | map(.rule_id) | index("plugin_repo.forbidden_release_files")) != null' \
    "plugin_repo.forbidden_release_files"

# Exit code 1 = findings exist (standardized exit codes)
run_reporting_case \
    "merged-plugin-check" \
    "$FIXTURES_DIR/fail/release-artifacts" \
    1 \
    '.summary.errors == 3 and .summary.warnings == 1 and .sources.plugin_check.findings == 2 and (.findings | map(.source) | index("plugin_check")) != null' \
    "Source: plugin_check" \
    --plugin-check-json "$PLUGIN_CHECK_FIXTURE"

# Exit code 1 = findings exist (standardized exit codes)
run_reporting_case \
    "merged-plugin-check-stream" \
    "$FIXTURES_DIR/fail/release-artifacts" \
    1 \
    '.summary.errors == 3 and .summary.warnings == 1 and .imports[0].format == "cli-json-stream"' \
    "plugin_header_fields" \
    --plugin-check-report "$PLUGIN_CHECK_STREAM_FIXTURE"

run_auto_reporting_case "auto-plugin-check-discovery"

if [ "$FAILURES" -gt 0 ]; then
    echo "Reporting tests failed: $FAILURES"
    exit 1
fi

echo "All reporting tests passed."
