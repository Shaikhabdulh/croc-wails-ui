SHELL := /bin/bash
BINARY_NAME := croc-wails-ui
OUTPUT_DIR := build/bin
OUTPUT_BIN := $(OUTPUT_DIR)/$(BINARY_NAME)

HOST_SPAWN := $(shell command -v host-spawn 2>/dev/null)
RUN_CMD := $(if $(HOST_SPAWN),$(HOST_SPAWN) bash -c,bash -c)

.PHONY: all build build-frontend test test-go test-frontend clean package-linux package-deb package-appimage package-tar check-ci check-ci-watch

all: build

build-frontend:
	@echo "==> Building frontend assets..."
	@cd frontend && bun install && bun run build

build: build-frontend
	@echo "==> Compiling optimized standalone Wails v3 binary..."
	@mkdir -p $(OUTPUT_DIR)
	@$(RUN_CMD) 'export PATH="$$HOME/.local/bin:$$HOME/.local/go/bin:$$PATH"; cd "$$(pwd)"; go build -tags "gtk3 croc_no_tailcat" -ldflags="-s -w" -o $(OUTPUT_BIN) .'
	@echo "==> Build successful: $(OUTPUT_BIN) ($$(ls -lh $(OUTPUT_BIN) | awk '{print $$5}'))"

package-linux: build
	@echo "==> Generating Linux distribution packages..."
	@./scripts/package-linux.sh

package-deb: package-linux
package-appimage: package-linux
package-tar: package-linux

test: build-frontend test-go test-frontend

test-go:
	@echo "==> Running Go unit and integration tests..."
	@$(RUN_CMD) 'export PATH="$$HOME/.local/bin:$$HOME/.local/go/bin:$$PATH"; cd "$$(pwd)"; go test -tags "gtk3 croc_no_tailcat" ./backend/... ./e2e . -v'

test-frontend:
	@echo "==> Running frontend Vitest suite..."
	@cd frontend && bun run test

check-ci:
	@./scripts/check-ci.sh

check-ci-watch:
	@./scripts/check-ci.sh --watch

clean-ci:
	@./scripts/clean-ci-history.sh

clean:
	@echo "==> Cleaning build artifacts..."
	@rm -rf $(OUTPUT_DIR) build/dist build/tmp_* frontend/dist
