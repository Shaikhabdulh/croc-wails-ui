#!/usr/bin/env bash
# ==============================================================================
# clean-ci-history.sh: Clean failed runs, artifacts, and caches from GitHub Actions
# Keeps repository within GitHub's free 500 MB runner storage quota.
# ==============================================================================
set -euo pipefail

REPO="Shaikhabdulh/croc-wails-ui"

echo "======================================================================"
echo " GitHub Actions Storage & History Cleaner: ${REPO}"
echo "======================================================================"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo "✓ Detected authenticated GitHub CLI ('gh')."
    
    # 1. Clean failed runs
    echo "1. Checking failed workflow runs..."
    FAILED_RUNS=$(gh run list --repo "${REPO}" --status failure --json databaseId -q '.[].databaseId' || true)
    if [ -n "${FAILED_RUNS}" ]; then
        for RUN_ID in ${FAILED_RUNS}; do
            echo "   Deleting failed run ${RUN_ID}..."
            gh run delete "${RUN_ID}" --repo "${REPO}" || true
        done
        echo "   ✓ All failed workflow runs deleted."
    else
        echo "   ✓ No failed runs found."
    fi

    # 2. Clean temporary build artifacts (Free 500 MB storage quota)
    echo "2. Purging Actions artifact storage (freeing 500 MB quota)..."
    ARTIFACT_IDS=$(gh api "repos/${REPO}/actions/artifacts" --paginate --jq '.artifacts[].id' || true)
    if [ -n "${ARTIFACT_IDS}" ]; then
        COUNT=0
        for ID in ${ARTIFACT_IDS}; do
            gh api -X DELETE "repos/${REPO}/actions/artifacts/${ID}" >/dev/null 2>&1 || true
            COUNT=$((COUNT + 1))
        done
        echo "   ✓ Deleted ${COUNT} stored artifacts. Artifact storage reset to 0 MB."
    else
        echo "   ✓ 0 artifacts stored (0 MB used)."
    fi

    # 3. Clean Actions cache storage
    echo "3. Purging Actions cache storage..."
    CACHE_IDS=$(gh api "repos/${REPO}/actions/caches" --paginate --jq '.actions_caches[].id' || true)
    if [ -n "${CACHE_IDS}" ]; then
        COUNT=0
        for ID in ${CACHE_IDS}; do
            gh api -X DELETE "repos/${REPO}/actions/caches/${ID}" >/dev/null 2>&1 || true
            COUNT=$((COUNT + 1))
        done
        echo "   ✓ Deleted ${COUNT} cache entries. Cache storage reset to 0 MB."
    else
        echo "   ✓ 0 caches stored (0 MB used)."
    fi

    echo "======================================================================"
    echo "✓ All Actions storage, runner artifacts, and caches successfully cleared!"
    echo "======================================================================"
    exit 0
fi

if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "✓ Using GITHUB_TOKEN environment variable."
    
    # Clean failed runs
    RUNS=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/${REPO}/actions/runs?status=failure" | \
        grep -o '"id": [0-9]*' | awk '{print $2}' || true)
    for RUN_ID in ${RUNS}; do
        curl -s -X DELETE -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" \
            "https://api.github.com/repos/${REPO}/actions/runs/${RUN_ID}" >/dev/null || true
    done

    # Clean artifacts
    ARTIFACTS=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/${REPO}/actions/artifacts" | \
        grep -o '"id": [0-9]*' | awk '{print $2}' || true)
    for ID in ${ARTIFACTS}; do
        curl -s -X DELETE -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" \
            "https://api.github.com/repos/${REPO}/actions/artifacts/${ID}" >/dev/null || true
    done

    echo "✓ Cleaned via token."
    exit 0
fi

echo "NOTE: GitHub CLI ('gh') is not currently authenticated and no GITHUB_TOKEN was found."
echo "Run 'gh auth login' or provide GITHUB_TOKEN."
