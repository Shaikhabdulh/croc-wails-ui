SHELL := /bin/bash
BINARY_NAME := croc-wails-ui
OUTPUT_DIR := build/bin
OUTPUT_BIN := $(OUTPUT_DIR)/$(BINARY_NAME)

.PHONY: all build build-frontend test test-go test-frontend clean

all: build

build-frontend:
	@echo "==> Building frontend assets..."
	@cd frontend && bun install && bun run build

build: build-frontend
	@echo "==> Compiling standalone Wails v3 binary..."
	@mkdir -p $(OUTPUT_DIR)
	@host-spawn bash -c 'export PATH="$$HOME/.local/bin:$$HOME/.local/go/bin:$$PATH"; cd "$$(pwd)"; go build -tags gtk3 -o $(OUTPUT_BIN) .'
	@echo "==> Build successful: $(OUTPUT_BIN)"

test: test-go test-frontend

test-go:
	@echo "==> Running Go unit and integration tests..."
	@host-spawn bash -c 'export PATH="$$HOME/.local/bin:$$HOME/.local/go/bin:$$PATH"; cd "$$(pwd)"; go test -tags gtk3 ./backend/... ./e2e . -v'

test-frontend:
	@echo "==> Running frontend Vitest suite..."
	@cd frontend && bun run test

clean:
	@echo "==> Cleaning build artifacts..."
	@rm -rf $(OUTPUT_DIR) frontend/dist
