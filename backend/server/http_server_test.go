package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"croc-interface/backend/service"
)

func TestHTTPServerConfigEndpoints(t *testing.T) {
	appSvc := service.NewAppService()
	srv := NewHTTPServer(appSvc, nil)

	// Test GET /api/config
	req := httptest.NewRequest("GET", "/api/config", nil)
	w := httptest.NewRecorder()
	srv.Router().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /api/config, got %d", w.Code)
	}

	var cfg service.UserConfig
	if err := json.NewDecoder(w.Body).Decode(&cfg); err != nil {
		t.Fatalf("failed to decode config json: %v", err)
	}

	// Test POST /api/config
	cfg.Overwrite = true
	cfg.OnlyLocal = true
	body, _ := json.Marshal(cfg)
	req = httptest.NewRequest("POST", "/api/config", strings.NewReader(string(body)))
	w = httptest.NewRecorder()
	srv.Router().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK updating config, got %d", w.Code)
	}

	// Verify updated
	updatedCfg, err := appSvc.GetConfig()
	if err != nil {
		t.Fatalf("failed to get config: %v", err)
	}
	if !updatedCfg.Overwrite || !updatedCfg.OnlyLocal {
		t.Fatalf("expected updated config to be saved, got overwrite=%v, only_local=%v", updatedCfg.Overwrite, updatedCfg.OnlyLocal)
	}
}

func TestHTTPServerQRCodeEndpoint(t *testing.T) {
	appSvc := service.NewAppService()
	srv := NewHTTPServer(appSvc, nil)

	req := httptest.NewRequest("GET", "/api/qr?code=7777-test-code", nil)
	w := httptest.NewRecorder()
	srv.Router().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /api/qr, got %d", w.Code)
	}

	var resp map[string]string
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode qr response: %v", err)
	}

	if !strings.HasPrefix(resp["qr"], "data:image/png;base64,") {
		t.Fatalf("expected base64 data URI, got %s", resp["qr"])
	}
}
