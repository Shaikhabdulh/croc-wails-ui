#!/usr/bin/env bash
# ==============================================================================
# clean-ci-history.sh: Clean failed or old workflow runs from GitHub Actions
# ==============================================================================
set -euo pipefail

REPO="Shaikhabdulh/croc-wails-ui"

echo "======================================================================"
echo " GitHub Actions Run History Cleaner: ${REPO}"
echo "======================================================================"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo "✓ Detected authenticated GitHub CLI ('gh')."
    echo "Fetching failed workflow runs..."
    
    # List failed runs
    FAILED_RUNS=$(gh run list --repo "${REPO}" --status failure --json databaseId -q '.[].databaseId')
    
    if [ -z "${FAILED_RUNS}" ]; then
        echo "No failed workflow runs found."
    else
        for RUN_ID in ${FAILED_RUNS}; do
            echo "Deleting failed run: ${RUN_ID}..."
            gh run delete "${RUN_ID}" --repo "${REPO}" || true
        done
        echo "✓ All failed workflow runs have been deleted."
    fi
    exit 0
fi

if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "✓ Using GITHUB_TOKEN environment variable."
    RUNS=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/${REPO}/actions/runs?status=failure" | \
        grep -o '"id": [0-9]*' | awk '{print $2}')
    
    if [ -z "${RUNS}" ]; then
        echo "No failed workflow runs found or token has insufficient permissions."
    else
        for RUN_ID in ${RUNS}; do
            echo "Deleting failed run ID ${RUN_ID}..."
            curl -s -X DELETE \
                -H "Authorization: Bearer ${GITHUB_TOKEN}" \
                -H "Accept: application/vnd.github+json" \
                "https://api.github.com/repos/${REPO}/actions/runs/${RUN_ID}"
        done
        echo "✓ Failed runs deleted."
    fi
    exit 0
fi

echo "NOTE: GitHub CLI ('gh') is not currently authenticated and no GITHUB_TOKEN was found."
echo ""
echo "To clean workflow runs automatically, choose one of these options:"
echo "  Option A (Recommended via Web UI - no password or token setup needed):"
echo "    1. Go to https://github.com/${REPO}/actions"
echo "    2. Click on the failed run you want to remove."
echo "    3. Click the '...' (three dots) button in the upper right corner."
echo "    4. Select 'Delete workflow run'."
echo ""
echo "  Option B (Via GitHub CLI in terminal):"
echo "    1. Run: gh auth login"
echo "    2. Run: ./scripts/clean-ci-history.sh"
echo ""
echo "  Option C (Via Token):"
echo "    GITHUB_TOKEN=your_pat_token ./scripts/clean-ci-history.sh"
echo "======================================================================"
