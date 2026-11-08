package service

import (
	"context"
	"errors"
	"fmt"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/schollz/croc/v11/src/tcp"
)

// RelayStatus contains real-time status and configuration of the in-app embedded relay.
type RelayStatus struct {
	IsRunning     bool     `json:"is_running"`
	ControlPort   string   `json:"control_port"`
	DataPorts     []string `json:"data_ports"`
	Addresses     []string `json:"addresses"`
	Password      string   `json:"password"`
	UptimeSeconds int64    `json:"uptime_seconds"`
	ErrorMessage  string   `json:"error_message,omitempty"`
}

// EmbeddedRelayManager manages the lifecycle of an in-process croc relay server.
type EmbeddedRelayManager struct {
	mu          sync.RWMutex
	cancel      context.CancelFunc
	isRunning   bool
	controlPort string
	dataPorts   []string
	password    string
	startTime   time.Time
}

// NewEmbeddedRelayManager initializes a new embedded relay manager.
func NewEmbeddedRelayManager() *EmbeddedRelayManager {
	return &EmbeddedRelayManager{}
}

// GetLocalIPv4Addresses returns non-loopback active IPv4 addresses for peer discovery.
func GetLocalIPv4Addresses() []string {
	var ips []string
	interfaces, err := net.Interfaces()
	if err != nil {
		return []string{"127.0.0.1"}
	}
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.IsLoopback() {
				continue
			}
			ip = ip.To4()
			if ip != nil {
				ips = append(ips, ip.String())
			}
		}
	}
	if len(ips) == 0 {
		ips = append(ips, "127.0.0.1")
	}
	return ips
}

// Start launches the in-process croc TCP relay on the designated control port and data ports.
func (m *EmbeddedRelayManager) Start(controlPort string, dataPortsCount int, password string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.isRunning {
		return errors.New("embedded relay server is already running")
	}

	if strings.TrimSpace(controlPort) == "" {
		controlPort = "9009"
	}

	cPortNum, err := strconv.Atoi(controlPort)
	if err != nil || cPortNum <= 1024 || cPortNum > 65530 {
		return fmt.Errorf("invalid control port: %s (must be between 1025 and 65530)", controlPort)
	}

	if dataPortsCount < 1 {
		dataPortsCount = 3
	}

	var dataPorts []string
	for i := 1; i <= dataPortsCount; i++ {
		dataPorts = append(dataPorts, strconv.Itoa(cPortNum+i))
	}

	// Verify all ports are free
	allPorts := append([]string{controlPort}, dataPorts...)
	for _, p := range allPorts {
		l, err := net.Listen("tcp", net.JoinHostPort("0.0.0.0", p))
		if err != nil {
			return fmt.Errorf("port %s is already in use by another service: %w", p, err)
		}
		_ = l.Close()
	}

	ctx, cancel := context.WithCancel(context.Background())
	m.cancel = cancel
	m.controlPort = controlPort
	m.dataPorts = dataPorts
	m.password = password
	m.isRunning = true
	m.startTime = time.Now()

	// 1. Start control server (with banner of consecutive data ports)
	go func() {
		_ = tcp.RunCtx(ctx, "warn", "0.0.0.0", controlPort, password, strings.Join(dataPorts, ","))
	}()

	// 2. Start each data port server
	for _, dp := range dataPorts {
		p := dp
		go func() {
			_ = tcp.RunCtx(ctx, "warn", "0.0.0.0", p, password)
		}()
	}

	// 3. Confirm control port is listening
	deadline := time.Now().Add(2 * time.Second)
	ready := false
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", controlPort), 50*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			ready = true
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if !ready {
		cancel()
		m.isRunning = false
		m.cancel = nil
		return fmt.Errorf("embedded relay control port %s failed to start", controlPort)
	}

	return nil
}

// Stop shuts down the in-process croc relay server.
func (m *EmbeddedRelayManager) Stop() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.isRunning {
		return nil
	}

	if m.cancel != nil {
		m.cancel()
		m.cancel = nil
	}

	m.isRunning = false
	m.startTime = time.Time{}
	return nil
}

// Status returns the current live status and addresses of the embedded relay.
func (m *EmbeddedRelayManager) Status() RelayStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var uptime int64
	if m.isRunning && !m.startTime.IsZero() {
		uptime = int64(time.Since(m.startTime).Seconds())
	}

	ips := GetLocalIPv4Addresses()
	var addrs []string
	port := m.controlPort
	if port == "" {
		port = "9009"
	}
	for _, ip := range ips {
		addrs = append(addrs, net.JoinHostPort(ip, port))
	}

	return RelayStatus{
		IsRunning:     m.isRunning,
		ControlPort:   m.controlPort,
		DataPorts:     m.dataPorts,
		Addresses:     addrs,
		Password:      m.password,
		UptimeSeconds: uptime,
	}
}
