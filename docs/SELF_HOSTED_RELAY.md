# Self-Hosting Your Own Croc Relay Server

This guide provides step-by-step instructions for deploying, configuring, and connecting to your own private **Croc Relay Server**.

---

## Table of Contents
1. [Architecture & Security Overview](#architecture--security-overview)
2. [Method 1: In-App 1-Click Embedded Relay (Desktop UI)](#method-1-in-app-1-click-embedded-relay-desktop-ui)
3. [Method 2: 24/7 Cloud Deployment with Docker](#method-2-247-cloud-deployment-with-docker)
4. [Method 3: Native Linux Service with systemd](#method-3-native-linux-service-with-systemd)
5. [Firewall & Cloud Security Group Rules](#firewall--cloud-security-group-rules)
6. [Connecting Clients to Your Relay](#connecting-clients-to-your-relay)
7. [Verification & Troubleshooting](#verification--troubleshooting)

---

## Architecture & Security Overview

### Zero-Knowledge PAKE Encryption
Croc is designed with end-to-end security by default. The relay server acts **strictly as an untrusted rendezvous and forwarding bridge**:
- **PAKE (Password Authenticated Key Exchange)**: Sender and receiver use PAKE (via SPAKE2) to authenticate using the shared code phrase and derive a strong ephemeral cryptographic key.
- **End-to-End Encryption**: The payload data is encrypted client-side using authenticated encryption (ChaCha20-Poly1305 / AES-GCM).
- **Zero Inspection**: The relay server **never** sees unencrypted file content, filenames, file sizes, or decryption keys.
- **No Disk Storage**: Relayed packets are streamed strictly in-memory between active TCP connections; nothing is written to disk on the relay.

### Port Requirements
A croc relay requires **5 TCP ports**:
- **Control / Rendezvous Port (`9009` TCP by default)**: Handles peer discovery, handshake negotiation, and local IP exchange.
- **Data Multiplex Ports (`9010, 9011, 9012, 9013` TCP by default)**: Used for high-speed multi-stream data transfer whenever peers cannot establish a direct P2P connection (e.g., across symmetric NATs or corporate firewalls).

```
   Sender (Client)                            Receiver (Client)
        |                                             |
        |---- 1. Join Room (TCP 9009) --------------->|
        |           [Private Relay Server]            |
        |<--- 2. Exchange Ephemeral Public Keys ------>|
        |                                             |
        |=== Direct P2P Transfer (if LAN / UPnP) ====>|
        |                    - OR -                   |
        |=== Relayed TCP Stream (Ports 9010-9013) ===>|
```

---

## Method 1: In-App 1-Click Embedded Relay (Desktop UI)

Best for:
- Ad-hoc transfers between computers on the same local network or VPN (Tailscale, WireGuard).
- Air-gapped office environments without access to the public internet (`getcroc.com`).
- Zero cloud hosting fees.

### Steps:
1. Launch **Croc UI**.
2. Click the **Settings (⚙️)** gear icon in the top right.
3. Scroll down to the **Host Private Relay** section.
4. (Optional) Customize the **Control Port** (default: `9009`) and set an optional **Relay Password**.
5. Switch the **Host Relay Server on this Computer** toggle to **ON**.
6. The status badge will switch to `● Relay Active` and automatically display your computer's local IP address (e.g., `192.168.1.150:9009`).
7. Click **Copy** next to your local IP address and share it with the other devices on your network.
8. If you want this computer to also route through this local relay, click **Use as Active Relay**.

---

## Method 2: 24/7 Cloud Deployment with Docker

Best for:
- Teams, organizations, and power users needing permanent 24/7 global access across the internet.
- Hosting on VPS providers (DigitalOcean, AWS, Linode, Hetzner, Oracle Cloud Free Tier).

### Quick 1-Liner:
```bash
docker run -d \
  --name croc-relay \
  --restart always \
  -p 9009:9009 \
  -p 9010-9013:9010-9013 \
  -e CROC_PASS="your-strong-relay-passphrase" \
  schollz/croc relay
```

### Production `docker-compose.yml`:
Create a directory on your server (e.g. `/opt/croc-relay`) and create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  croc-relay:
    image: schollz/croc:latest
    container_name: croc-relay
    restart: always
    environment:
      # Optional: set a passphrase so only authorized clients can use your relay
      - CROC_PASS=your-strong-relay-passphrase
    command: relay --ports 9009,9010,9011,9012,9013
    ports:
      - "9009:9009/tcp"
      - "9010-9013:9010-9013/tcp"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
```

Start the container:
```bash
docker compose up -d
```

View live logs:
```bash
docker compose logs -f
```

---

## Method 3: Native Linux Service with systemd

Best for lightweight VPS setups without Docker overhead.

### Step 1: Install the croc binary
```bash
curl https://getcroc.schollz.com | bash
```
Verify the installation:
```bash
croc --version
```

### Step 2: Create a dedicated system user
```bash
sudo useradd --system --no-create-home --shell /bin/false croc
```

### Step 3: Create the systemd service file
Create `/etc/systemd/system/croc-relay.service`:
```ini
[Unit]
Description=Croc P2P Private Relay Server
After=network.target

[Service]
Type=simple
User=croc
Group=croc
Environment="CROC_PASS=your-strong-relay-passphrase"
ExecStart=/usr/local/bin/croc relay --ports 9009,9010,9011,9012,9013
Restart=on-failure
RestartSec=5s
LimitNOFILE=65535

# Security sandbox
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

### Step 4: Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now croc-relay
```

Check the status:
```bash
sudo systemctl status croc-relay
```

---

## Firewall & Cloud Security Group Rules

Your relay requires incoming TCP connections on port **9009** and ports **9010 through 9013**.

### Ubuntu / Debian (UFW)
```bash
sudo ufw allow 9009/tcp comment 'Croc Control Port'
sudo ufw allow 9010:9013/tcp comment 'Croc Data Ports'
sudo ufw reload
```

### RHEL / AlmaLinux / Rocky Linux (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=9009/tcp
sudo firewall-cmd --permanent --add-port=9010-9013/tcp
sudo firewall-cmd --reload
```

### Cloud Providers (AWS / GCP / DigitalOcean / Hetzner)
In your cloud management console, edit your **Inbound Security Group / Firewall Rules**:
| Protocol | Port Range | Source | Description |
|---|---|---|---|
| TCP | `9009` | `0.0.0.0/0` (or your company IP) | Croc Rendezvous / Control |
| TCP | `9010-9013` | `0.0.0.0/0` (or your company IP) | Croc Multiplex Data Streams |

---

## Connecting Clients to Your Relay

### In the Desktop Application (Croc UI):
1. Click **Settings (⚙️)** in the top right.
2. Under **Network & Peer Discovery**, switch the **Custom Relay Server** toggle to **ON**.
3. In the **Relay Address** field, enter your server's domain or public IP with port 9009:
   - Example: `relay.yourdomain.com:9009`
   - Or IP: `198.51.100.42:9009`
4. If you configured a password (`CROC_PASS`), enter it in the **Relay Password** field.
5. Close Settings. All Send and Receive operations will now seamlessly use your private relay!

### In the Croc CLI:
```bash
# Sending a file via your private relay:
croc --relay "relay.yourdomain.com:9009" --pass "your-strong-relay-passphrase" send document.pdf

# Receiving a file via your private relay:
croc --relay "relay.yourdomain.com:9009" --pass "your-strong-relay-passphrase" <code-phrase>
```

#### Persisting CLI Defaults:
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export CROC_RELAY="relay.yourdomain.com:9009"
export CROC_PASS="your-strong-relay-passphrase"
```

---

## Verification & Troubleshooting

### 1. Test TCP reachability from client
From any client machine, test if the control port is accessible:
```bash
nc -zv relay.yourdomain.com 9009
```
Expected output:
```
Connection to relay.yourdomain.com 9009 port [tcp/*] succeeded!
```

### 2. Verify Data Ports are bound
On your server, check that all 5 ports are actively listening:
```bash
ss -tulpn | grep -E '9009|9010|9011|9012|9013'
```

### 3. "Password incorrect" or Handshake Timeout
- Ensure that both the sender and the receiver have configured the exact same **Relay Password** in their settings if `CROC_PASS` is set on the server.
- Verify that data ports `9010-9013` are opened in your cloud firewall, not just port `9009`.
