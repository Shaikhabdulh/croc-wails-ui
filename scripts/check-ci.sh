#!/usr/bin/env bash
# ==============================================================================
# check-ci.sh - Automated GitHub Actions CI/CD Monitor for croc-wails-ui
# ==============================================================================
# Usage:
#   ./scripts/check-ci.sh             # Check latest runs once
#   ./scripts/check-ci.sh --watch     # Poll until all active runs complete
#   ./scripts/check-ci.sh <run_id>    # Inspect a specific run
# ==============================================================================

set -euo pipefail

REPO="Shaikhabdulh/croc-wails-ui"
API_BASE="https://api.github.com/repos/${REPO}"
WATCH_MODE=false
SPECIFIC_RUN=""

for arg in "$@"; do
  case "$arg" in
    --watch|-w)
      WATCH_MODE=true
      ;;
    *)
      if [[ "$arg" =~ ^[0-9]+$ ]]; then
        SPECIFIC_RUN="$arg"
      fi
      ;;
  esac
done

fetch_runs() {
  if [ -n "$SPECIFIC_RUN" ]; then
    curl -s "${API_BASE}/actions/runs/${SPECIFIC_RUN}" | jq '[.]'
  else
    # Fetch latest 2 runs (CI tests and Build matrix)
    curl -s "${API_BASE}/actions/runs?per_page=2" | jq '.workflow_runs'
  fi
}

check_once() {
  local runs_json
  runs_json=$(fetch_runs)

  local has_in_progress=false
  local has_failure=false

  echo "======================================================================"
  echo " GitHub Actions Status: ${REPO}"
  echo " Checked at: $(date -u '+%Y-%m-%d %H:%M:%SZ')"
  echo "======================================================================"

  local num_runs
  num_runs=$(echo "$runs_json" | jq 'length')

  if [ "$num_runs" -eq 0 ]; then
    echo "No workflow runs found."
    return 0
  fi

  for i in $(seq 0 $((num_runs - 1))); do
    local run_id workflow_name status conclusion commit_sha html_url
    run_id=$(echo "$runs_json" | jq -r ".[$i].id")
    workflow_name=$(echo "$runs_json" | jq -r ".[$i].name")
    status=$(echo "$runs_json" | jq -r ".[$i].status")
    conclusion=$(echo "$runs_json" | jq -r ".[$i].conclusion // \"pending\"")
    commit_sha=$(echo "$runs_json" | jq -r ".[$i].head_sha[0:7]")
    html_url=$(echo "$runs_json" | jq -r ".[$i].html_url")

    local status_color="\033[33m"
    if [ "$status" = "completed" ]; then
      if [ "$conclusion" = "success" ]; then
        status_color="\033[32m"
      elif [ "$conclusion" = "failure" ]; then
        status_color="\033[31m"
        has_failure=true
      fi
    else
      has_in_progress=true
    fi

    echo ""
    echo -e "Workflow: \033[1m${workflow_name}\033[0m (Run #${run_id}) [commit: ${commit_sha}]"
    echo -e "Status:   ${status_color}${status} (${conclusion})\033[0m"
    echo -e "URL:      ${html_url}"
    echo "Jobs:"

    local jobs_json
    jobs_json=$(curl -s "${API_BASE}/actions/runs/${run_id}/jobs")

    local num_jobs
    num_jobs=$(echo "$jobs_json" | jq '.jobs | length')

    for j in $(seq 0 $((num_jobs - 1))); do
      local job_id job_name job_status job_conclusion
      job_id=$(echo "$jobs_json" | jq -r ".jobs[$j].id")
      job_name=$(echo "$jobs_json" | jq -r ".jobs[$j].name")
      job_status=$(echo "$jobs_json" | jq -r ".jobs[$j].status")
      job_conclusion=$(echo "$jobs_json" | jq -r ".jobs[$j].conclusion // \"in_progress\"")

      local mark="[..]"
      if [ "$job_status" = "completed" ]; then
        if [ "$job_conclusion" = "success" ]; then
          mark="\033[32m[PASS]\033[0m"
        elif [ "$job_conclusion" = "failure" ]; then
          mark="\033[31m[FAIL]\033[0m"
          has_failure=true
        elif [ "$job_conclusion" = "skipped" ]; then
          mark="\033[90m[SKIP]\033[0m"
        fi
      else
        mark="\033[33m[RUNNING]\033[0m"
        has_in_progress=true
      fi

      echo -e "  ${mark} ${job_name}"

      # If job failed, print failing steps and annotations
      if [ "$job_conclusion" = "failure" ]; then
        local failed_step
        failed_step=$(echo "$jobs_json" | jq -r ".jobs[$j].steps[] | select(.conclusion == \"failure\") | .name" | head -n 1)
        if [ -n "$failed_step" ]; then
          echo -e "         \033[31m--> Failed at step: '${failed_step}'\033[0m"
        fi

        # Check annotations
        local annotations
        annotations=$(curl -s "${API_BASE}/check-runs/${job_id}/annotations" | jq -r '.[] | select(.annotation_level == "failure") | .message' 2>/dev/null || true)
        if [ -n "$annotations" ]; then
          echo -e "         \033[31m--> Error: ${annotations}\033[0m"
        fi
      fi
    done
  done

  echo ""
  echo "======================================================================"

  if [ "$has_in_progress" = true ]; then
    return 2 # Still running
  elif [ "$has_failure" = true ]; then
    return 1 # Finished with failures
  else
    return 0 # All finished with success
  fi
}

if [ "$WATCH_MODE" = true ]; then
  echo "Watching GitHub Actions runs for ${REPO}..."
  while true; do
    set +e
    check_once
    ret=$?
    set -e
    if [ "$ret" -eq 2 ]; then
      echo "Workflows still in progress. Checking again in 15 seconds..."
      sleep 15
    elif [ "$ret" -eq 1 ]; then
      echo "Completed with failures."
      exit 1
    else
      echo "All workflows completed successfully!"
      exit 0
    fi
  done
else
  set +e
  check_once
  exit $?
fi
