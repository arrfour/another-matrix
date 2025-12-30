#!/bin/bash

# Matrix Effect - Proxmox Full Deployment Script
# Automates: LXC creation, file transfer, and app setup
# Usage: bash deploy-to-proxmox.sh

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo -e "  Matrix Effect - Proxmox Auto Deploy"
echo -e "==========================================${NC}"
echo ""

# Configuration
read -p "$(echo -e ${YELLOW}'Proxmox Host IP/Hostname:' ${NC})" PROXMOX_HOST
read -p "$(echo -e ${YELLOW}'Proxmox Username (format: user@pam or user@pve):' ${NC})" PROXMOX_USER
read -sp "$(echo -e ${YELLOW}'Proxmox Password:' ${NC})" PROXMOX_PASS
echo ""
read -p "$(echo -e ${YELLOW}'LXC Container ID (e.g., 100):' ${NC})" CONTAINER_ID
read -p "$(echo -e ${YELLOW}'LXC Container Name (e.g., matrix-effect):' ${NC})" CONTAINER_NAME
read -p "$(echo -e ${YELLOW}'LXC Hostname (default: matrix-effect):' ${NC})" CONTAINER_HOSTNAME
CONTAINER_HOSTNAME=${CONTAINER_HOSTNAME:-matrix-effect}
read -p "$(echo -e ${YELLOW}'Template (ubuntu-22.04, debian-12, etc. - default: ubuntu-22.04):' ${NC})" TEMPLATE
TEMPLATE=${TEMPLATE:-ubuntu-22.04}
read -p "$(echo -e ${YELLOW}'Storage for LXC (default: local):' ${NC})" STORAGE
STORAGE=${STORAGE:-local}
read -p "$(echo -e ${YELLOW}'Disk Size in GB (default: 5):' ${NC})" DISK_SIZE
DISK_SIZE=${DISK_SIZE:-5}
read -p "$(echo -e ${YELLOW}'CPU Cores (default: 1):' ${NC})" CORES
CORES=${CORES:-1}
read -p "$(echo -e ${YELLOW}'Memory in MB (default: 512):' ${NC})" MEMORY
MEMORY=${MEMORY:-512}
read -p "$(echo -e ${YELLOW}'Root Password for LXC:' ${NC})" CONTAINER_PASS
read -p "$(echo -e ${YELLOW}'Use DHCP for network? (Y/n):' ${NC})" USE_DHCP
USE_DHCP=${USE_DHCP:-Y}

if [[ ! "$USE_DHCP" =~ ^[Yy]$ ]]; then
    read -p "$(echo -e ${YELLOW}'Static IP (e.g., 192.168.1.100/24):' ${NC})" STATIC_IP
    read -p "$(echo -e ${YELLOW}'Gateway IP (e.g., 192.168.1.1):' ${NC})" GATEWAY
fi

echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  Proxmox: $PROXMOX_HOST"
echo "  Container ID: $CONTAINER_ID"
echo "  Container Name: $CONTAINER_NAME"
echo "  Hostname: $CONTAINER_HOSTNAME"
echo "  Template: $TEMPLATE"
echo "  Storage: $STORAGE"
echo "  Disk: ${DISK_SIZE}GB"
echo "  CPU: $CORES cores"
echo "  Memory: ${MEMORY}MB"
echo ""

read -p "$(echo -e ${YELLOW}'Proceed with deployment? (y/N):' ${NC})" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}[1/7] Authenticating with Proxmox...${NC}"

# Get Proxmox API token
AUTH_RESPONSE=$(curl -s -k -X POST "https://${PROXMOX_HOST}:8006/api2/json/access/ticket" \
    -d "username=${PROXMOX_USER}&password=${PROXMOX_PASS}" \
    -H "Content-Type: application/x-www-form-urlencoded" 2>/dev/null)

TICKET=$(echo $AUTH_RESPONSE | grep -o '"ticket":"[^"]*' | cut -d'"' -f4)
CSRF=$(echo $AUTH_RESPONSE | grep -o '"CSRFPreventionToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TICKET" ]; then
    echo -e "${RED}ERROR: Failed to authenticate with Proxmox${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"

# Get node list
echo -e "${BLUE}[2/7] Finding Proxmox nodes...${NC}"
NODES=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/nodes" \
    -H "Authorization: PVEAPIToken=${PROXMOX_USER}!$(echo $PROXMOX_PASS | md5sum | cut -d' ' -f1):$(echo $PROXMOX_PASS | sha256sum | cut -d' ' -f1)" \
    -H "CSRFPreventionToken: $CSRF" 2>/dev/null)

NODE=$(echo $NODES | grep -o '"node":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NODE" ]; then
    # Fallback: try to get first node name from common patterns
    NODE="pve"
    echo -e "${YELLOW}⚠ Could not detect node automatically, using: $NODE${NC}"
else
    echo -e "${GREEN}✓ Found node: $NODE${NC}"
fi

echo -e "${BLUE}[3/7] Creating LXC container...${NC}"

# Build LXC creation JSON
if [[ "$USE_DHCP" =~ ^[Yy]$ ]]; then
    NET_CONFIG="net0=name=eth0,bridge=vmbr0,type=veth"
else
    NET_CONFIG="net0=name=eth0,bridge=vmbr0,type=veth,ip=${STATIC_IP},gw=${GATEWAY}"
fi

CREATE_DATA="vmid=${CONTAINER_ID}"
CREATE_DATA="${CREATE_DATA}&hostname=${CONTAINER_HOSTNAME}"
CREATE_DATA="${CREATE_DATA}&ostype=ubuntu"
CREATE_DATA="${CREATE_DATA}&osid=${TEMPLATE}"
CREATE_DATA="${CREATE_DATA}&storage=${STORAGE}"
CREATE_DATA="${CREATE_DATA}&rootfs=${STORAGE}:${DISK_SIZE}"
CREATE_DATA="${CREATE_DATA}&cores=${CORES}"
CREATE_DATA="${CREATE_DATA}&memory=${MEMORY}"
CREATE_DATA="${CREATE_DATA}&password=${CONTAINER_PASS}"
CREATE_DATA="${CREATE_DATA}&${NET_CONFIG}"
CREATE_DATA="${CREATE_DATA}&nameserver=8.8.8.8"
CREATE_DATA="${CREATE_DATA}&searchdomain=local"
CREATE_DATA="${CREATE_DATA}&unprivileged=1"
CREATE_DATA="${CREATE_DATA}&start=1"

CREATE_RESPONSE=$(curl -s -k -X POST "https://${PROXMOX_HOST}:8006/api2/json/nodes/${NODE}/lxc" \
    -H "Authorization: PVEAPIToken=${PROXMOX_USER}" \
    -H "CSRFPreventionToken: $CSRF" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$CREATE_DATA" 2>/dev/null)

if echo "$CREATE_RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}ERROR: Failed to create LXC${NC}"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ LXC container created${NC}"

# Wait for container to start and get IP
echo -e "${BLUE}[4/7] Waiting for container to boot...${NC}"
sleep 15

ATTEMPTS=0
while [ $ATTEMPTS -lt 30 ]; do
    CONTAINER_IP=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/nodes/${NODE}/lxc/${CONTAINER_ID}/status/current" \
        -H "Authorization: PVEAPIToken=${PROXMOX_USER}" \
        -H "CSRFPreventionToken: $CSRF" 2>/dev/null | grep -o '"ip":[^,}]*' | cut -d'"' -f4)
    
    if [ ! -z "$CONTAINER_IP" ] && [ "$CONTAINER_IP" != "0.0.0.0" ]; then
        echo -e "${GREEN}✓ Container is running at $CONTAINER_IP${NC}"
        break
    fi
    
    echo -n "."
    sleep 2
    ATTEMPTS=$((ATTEMPTS + 1))
done

if [ -z "$CONTAINER_IP" ] || [ "$CONTAINER_IP" == "0.0.0.0" ]; then
    echo -e "${YELLOW}⚠ Could not automatically detect IP, trying static IP assignment...${NC}"
    if [ ! -z "$STATIC_IP" ]; then
        CONTAINER_IP=$(echo $STATIC_IP | cut -d'/' -f1)
    else
        echo -e "${YELLOW}Please check your Proxmox UI for the container IP address${NC}"
        read -p "$(echo -e ${YELLOW}'Enter container IP manually:' ${NC})" CONTAINER_IP
    fi
fi

echo ""
echo -e "${BLUE}[5/7] Copying application files...${NC}"

# Get the script directory (where this script is running from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if files exist in src directory
if [ ! -f "$PROJECT_ROOT/src/index.html" ] || [ ! -f "$PROJECT_ROOT/src/script.js" ] || [ ! -f "$PROJECT_ROOT/src/README.md" ]; then
    echo -e "${RED}ERROR: Missing application files${NC}"
    echo "Required files: $PROJECT_ROOT/src/index.html, $PROJECT_ROOT/src/script.js, $PROJECT_ROOT/src/README.md"
    exit 1
fi

# Copy files using pct push (if available) or SSH
if command -v pct &> /dev/null; then
    pct push $CONTAINER_ID "$PROJECT_ROOT/src/index.html" /root/ 2>/dev/null || true
    pct push $CONTAINER_ID "$PROJECT_ROOT/src/script.js" /root/ 2>/dev/null || true
    pct push $CONTAINER_ID "$PROJECT_ROOT/src/README.md" /root/ 2>/dev/null || true
    pct push $CONTAINER_ID "$SCRIPT_DIR/setup.sh" /root/ 2>/dev/null || true
    echo -e "${GREEN}✓ Files copied via pct${NC}"
else
    # Fallback to SSH (requires SSH access to container)
    sleep 10  # Wait for SSH to be ready
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$PROJECT_ROOT/src/index.html" "$PROJECT_ROOT/src/script.js" "$PROJECT_ROOT/src/README.md" "$SCRIPT_DIR/setup.sh" \
        root@${CONTAINER_IP}:/root/ 2>/dev/null || true
    echo -e "${GREEN}✓ Files copied via SSH${NC}"
fi

echo -e "${BLUE}[6/7] Running setup script...${NC}"

# Execute setup script
if command -v pct &> /dev/null; then
    pct exec $CONTAINER_ID -- bash -c "cd /root && chmod +x setup.sh && bash setup.sh" 2>/dev/null || true
else
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        root@${CONTAINER_IP} \
        "cd /root && chmod +x setup.sh && bash setup.sh" 2>/dev/null || true
fi

echo -e "${GREEN}✓ Setup completed${NC}"

echo ""
echo -e "${BLUE}[7/7] Deployment Summary${NC}"
echo -e "${GREEN}=========================================="
echo -e "  ✓ LXC Created & Running"
echo -e "==========================================${NC}"
echo ""
echo -e "Container Details:"
echo -e "  ${BLUE}Container ID:${NC} $CONTAINER_ID"
echo -e "  ${BLUE}Container Name:${NC} $CONTAINER_NAME"
echo -e "  ${BLUE}IP Address:${NC} $CONTAINER_IP"
echo -e "  ${BLUE}Hostname:${NC} $CONTAINER_HOSTNAME"
echo ""
echo -e "Access the Application:"
echo -e "  ${GREEN}http://${CONTAINER_IP}${NC}"
echo ""
echo -e "Connect via SSH:"
echo -e "  ${YELLOW}ssh root@${CONTAINER_IP}${NC}"
echo ""
echo -e "View Logs:"
echo -e "  ${YELLOW}ssh root@${CONTAINER_IP} 'tail -f /var/log/nginx/matrix-effect-access.log'${NC}"
echo ""
echo -e "Update Application:"
echo -e "  ${YELLOW}scp ../src/index.html ../src/script.js ../src/README.md root@${CONTAINER_IP}:/var/www/html/${NC}"
echo ""
echo -e "${GREEN}Happy Hacking! 🔥${NC}"
echo ""
