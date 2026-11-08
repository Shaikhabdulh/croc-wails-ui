package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"croc-interface/backend/service"
)

// HTTPServer provides a lightweight local REST and SSE API for headless, mobile, and web runtimes.
type HTTPServer struct {
	svc      *service.AppService
	staticFS http.FileSystem
	router   *http.ServeMux
	mu       sync.RWMutex
	clients  map[chan string]struct{}
}

// NewHTTPServer initializes the HTTP daemon and wires the AppService event emitter to SSE clients.
func NewHTTPServer(svc *service.AppService, staticFS http.FileSystem) *HTTPServer {
	s := &HTTPServer{
		svc:      svc,
		staticFS: staticFS,
		router:   http.NewServeMux(),
		clients:  make(map[chan string]struct{}),
	}

	// Wire service events to SSE clients
	svc.SetEventEmitter(func(event string, data any) {
		s.broadcastEvent(event, data)
	})

	s.routes()
	return s
}

// Router returns the underlying HTTP handler.
func (s *HTTPServer) Router() http.Handler {
	return s.withCORS(s.router)
}

func (s *HTTPServer) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *HTTPServer) broadcastEvent(event string, data any) {
	payload, err := json.Marshal(map[string]any{
		"event": event,
		"data":  data,
	})
	if err != nil {
		return
	}

	msg := string(payload)
	s.mu.RLock()
	defer s.mu.RUnlock()

	for ch := range s.clients {
		select {
		case ch <- msg:
		default:
		}
	}
}

func (s *HTTPServer) routes() {
	// API Endpoints
	s.router.HandleFunc("/api/config", s.handleConfig)
	s.router.HandleFunc("/api/send", s.handleSend)
	s.router.HandleFunc("/api/receive", s.handleReceive)
	s.router.HandleFunc("/api/cancel", s.handleCancel)
	s.router.HandleFunc("/api/qr", s.handleQRCode)
	s.router.HandleFunc("/api/relay/status", s.handleRelayStatus)
	s.router.HandleFunc("/api/relay/start", s.handleRelayStart)
	s.router.HandleFunc("/api/relay/stop", s.handleRelayStop)
	s.router.HandleFunc("/api/open-url", s.handleOpenURL)
	s.router.HandleFunc("/api/events", s.handleSSE)

	// Static assets handler for browser & webview
	if s.staticFS != nil {
		s.router.Handle("/", http.FileServer(s.staticFS))
	}
}

func (s *HTTPServer) handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		cfg, err := s.svc.GetConfig()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(cfg)
		return
	}

	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		var cfg service.UserConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := s.svc.UpdateConfig(cfg); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
		return
	}

	http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (s *HTTPServer) handleSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Paths     []string `json:"paths"`
		LocalOnly bool     `json:"local_only"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	code, err := s.svc.SendFiles(req.Paths, req.LocalOnly)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"code": code})
}

func (s *HTTPServer) handleReceive(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Code      string `json:"code"`
		LocalOnly bool   `json:"local_only"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	go func() {
		_ = s.svc.ReceiveFile(req.Code, req.LocalOnly)
	}()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (s *HTTPServer) handleCancel(w http.ResponseWriter, r *http.Request) {
	if err := s.svc.CancelTransfer(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (s *HTTPServer) handleQRCode(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code param", http.StatusBadRequest)
		return
	}

	qr, err := s.svc.GenerateQRCode(code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"qr": qr})
}

func (s *HTTPServer) handleRelayStatus(w http.ResponseWriter, r *http.Request) {
	status, err := s.svc.GetEmbeddedRelayStatus()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}

func (s *HTTPServer) handleRelayStart(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Port     string `json:"port"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	status, _ := s.svc.StartEmbeddedRelay(req.Port, req.Password)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}

func (s *HTTPServer) handleRelayStop(w http.ResponseWriter, r *http.Request) {
	status, _ := s.svc.StopEmbeddedRelay()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}

func (s *HTTPServer) handleOpenURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.URL == "" {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	_ = s.svc.OpenURL(req.URL)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (s *HTTPServer) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	msgChan := make(chan string, 16)
	s.mu.Lock()
	s.clients[msgChan] = struct{}{}
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, msgChan)
		close(msgChan)
		s.mu.Unlock()
	}()

	notify := r.Context().Done()
	for {
		select {
		case <-notify:
			return
		case msg := <-msgChan:
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		}
	}
}
