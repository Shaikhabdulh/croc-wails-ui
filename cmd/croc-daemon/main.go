package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"croc-interface/backend/server"
	"croc-interface/backend/service"
)

func main() {
	port := flag.Int("port", 8080, "Port for HTTP micro-daemon mode")
	host := flag.String("host", "127.0.0.1", "Host address to bind")
	flag.Parse()

	appSvc := service.NewAppService()
	httpSrv := server.NewHTTPServer(appSvc, nil)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	srv := &http.Server{
		Addr:    addr,
		Handler: httpSrv.Router(),
	}

	go func() {
		log.Printf("[Croc Daemon] Micro-daemon listening at http://%s\n", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("[Croc Daemon] Shutting down...")
	_ = srv.Close()
	log.Println("[Croc Daemon] Stopped.")
}
