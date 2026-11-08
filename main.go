package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"croc-interface/backend/server"
	"croc-interface/backend/service"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var appIcon []byte

const appName = "Croc Interface"

func main() {
	serverMode := flag.Bool("server", false, "Run in headless HTTP/WebSocket micro-daemon mode for mobile/web")
	port := flag.Int("port", 8080, "Port for HTTP micro-daemon mode")
	flag.Parse()

	appSvc := service.NewAppService()

	// Check environment variable as fallback
	if *serverMode || os.Getenv("CROC_UI_MODE") == "server" {
		distSub, err := fs.Sub(assets, "frontend/dist")
		if err != nil {
			log.Fatalf("failed to locate embedded frontend assets: %v", err)
		}

		httpSrv := server.NewHTTPServer(appSvc, http.FS(distSub))
		addr := fmt.Sprintf("0.0.0.0:%d", *port)
		log.Printf("[Croc UI] Micro-daemon listening at http://%s\n", addr)
		if err := http.ListenAndServe(addr, httpSrv.Router()); err != nil {
			log.Fatal(err)
		}
		return
	}

	opts := application.Options{
		Name:        "croc-wails-ui",
		Description: "Unofficial desktop GUI for croc encrypted peer-to-peer file transfer",
		Icon:        appIcon,
		Services: []application.Service{
			application.NewService(appSvc),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Linux: application.LinuxOptions{
			ProgramName: "croc-wails-ui",
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	}

	app := application.New(opts)

	// Wire backend events to Wails event bus
	appSvc.SetEventEmitter(func(event string, data any) {
		app.Event.Emit(event, data)
	})

	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            appName,
		Width:            800,
		Height:           640,
		MinWidth:         440,
		MinHeight:        520,
		BackgroundColour: application.NewRGB(248, 250, 252),
		EnableFileDrop:   true,
		URL:              "/",
	})

	// Bridge native file drops to the frontend
	win.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		paths := event.Context().DroppedFiles()
		if len(paths) > 0 {
			app.Event.Emit("files:dropped", paths)
		}
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
