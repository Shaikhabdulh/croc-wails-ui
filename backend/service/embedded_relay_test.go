package service

import (
	"math/rand"
	"net"
	"strconv"
	"testing"
	"time"
)

func findConsecutiveTestPorts(t *testing.T, count int) []string {
	t.Helper()
	for range 50 {
		base := 32000 + rand.Intn(25000)
		listeners := make([]net.Listener, 0, count)
		ports := make([]string, 0, count)
		ok := true
		for i := 0; i < count; i++ {
			p := strconv.Itoa(base + i)
			l, err := net.Listen("tcp", net.JoinHostPort("0.0.0.0", p))
			if err != nil {
				ok = false
				break
			}
			listeners = append(listeners, l)
			ports = append(ports, p)
		}
		for _, l := range listeners {
			_ = l.Close()
		}
		if ok {
			time.Sleep(20 * time.Millisecond)
			return ports
		}
	}
	t.Fatalf("could not find %d consecutive ports", count)
	return nil
}

func TestEmbeddedRelayLifecycle(t *testing.T) {
	manager := NewEmbeddedRelayManager()

	status := manager.Status()
	if status.IsRunning {
		t.Fatal("expected relay to not be running initially")
	}

	var controlPort string
	var err error
	for attempt := 0; attempt < 5; attempt++ {
		ports := findConsecutiveTestPorts(t, 4)
		controlPort = ports[0]
		err = manager.Start(controlPort, 3, "testpass123")
		if err == nil {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	if err != nil {
		t.Fatalf("failed to start embedded relay: %v", err)
	}

	status = manager.Status()
	if !status.IsRunning {
		t.Fatal("expected relay to be running")
	}
	if status.ControlPort != controlPort {
		t.Fatalf("expected control port %s, got %s", controlPort, status.ControlPort)
	}
	if len(status.DataPorts) != 3 {
		t.Fatalf("expected 3 data ports, got %d", len(status.DataPorts))
	}
	if len(status.Addresses) == 0 {
		t.Fatal("expected non-empty addresses list")
	}

	// Dial control port to verify TCP readiness
	conn, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", controlPort), 200*time.Millisecond)
	if err != nil {
		t.Fatalf("failed to connect to running embedded relay: %v", err)
	}
	_ = conn.Close()

	// Stopping relay
	err = manager.Stop()
	if err != nil {
		t.Fatalf("failed to stop embedded relay: %v", err)
	}

	status = manager.Status()
	if status.IsRunning {
		t.Fatal("expected relay to be stopped")
	}
}

func TestLocalIPv4Addresses(t *testing.T) {
	ips := GetLocalIPv4Addresses()
	if len(ips) == 0 {
		t.Fatal("expected at least one IP address")
	}
}
