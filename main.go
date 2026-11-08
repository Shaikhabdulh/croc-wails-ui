package main

import (
	"embed"
	"log"

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
	appSvc := service.NewAppService()

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
