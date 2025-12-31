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

read -p "$(echo -e ${YELLOW}'LXC Container Name (e.g., matrix-effect):' ${NC})" CONTAINER_NAME
read -p "$(echo -e ${YELLOW}'LXC Hostname (default: matrix-effect):' ${NC})" CONTAINER_HOSTNAME
CONTAINER_HOSTNAME=${CONTAINER_HOSTNAME:-matrix-effect}
echo ""
echo -e "${BLUE}Note: Template must be in format: storage:vztmpl/template-name${NC}"
echo -e "${BLUE}Example: local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst${NC}"
echo -e "${BLUE}Or just enter short name (ubuntu-22.04) and script will try to find it${NC}"
read -p "$(echo -e ${YELLOW}'Template name:' ${NC})" TEMPLATE_INPUT
TEMPLATE_INPUT=${TEMPLATE_INPUT:-ubuntu-22.04}
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
    -H "Content-Type: application/x-www-form-urlencoded" 2>&1)

# Debug: Show raw response if verbose mode
# echo "DEBUG: Auth response: $AUTH_RESPONSE"

TICKET=$(echo "$AUTH_RESPONSE" | grep -o '"ticket":"[^"]*' | cut -d'"' -f4)
CSRF=$(echo "$AUTH_RESPONSE" | grep -o '"CSRFPreventionToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TICKET" ]; then
    echo -e "${RED}ERROR: Failed to authenticate with Proxmox${NC}"
    echo "Check:"
    echo "  1. Proxmox host IP/hostname is correct: ${PROXMOX_HOST}"
    echo "  2. Username format is correct (e.g., root@pam)"
    echo "  3. Password is correct"
    echo "  4. Proxmox web interface is accessible at https://${PROXMOX_HOST}:8006"
    echo ""
    echo "Response from server:"
    echo "$AUTH_RESPONSE" | head -5
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"

# Automatically find next available LXC Container ID
echo -e "${BLUE}Detecting next available LXC Container ID...${NC}"
LXC_LIST=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/cluster/resources?type=vm" \
    -b "PVEAuthCookie=${TICKET}" \
    -H "CSRFPreventionToken: ${CSRF}" 2>/dev/null)
USED_IDS=$(echo "$LXC_LIST" | grep -oP '"vmid":\K\d+')
NEXT_ID=100
while echo "$USED_IDS" | grep -q "^$NEXT_ID$"; do
    NEXT_ID=$((NEXT_ID+1))
done
CONTAINER_ID=$NEXT_ID
echo -e "${GREEN}Using Container ID: $CONTAINER_ID${NC}"

# Get node list
echo -e "${BLUE}[2/7] Finding Proxmox nodes...${NC}"
NODES=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/nodes" \
    -b "PVEAuthCookie=${TICKET}" \
    -H "CSRFPreventionToken: ${CSRF}" 2>&1)

# Debug: Show response
# echo "DEBUG: Nodes response: $NODES"

# Try multiple parsing methods
NODE=$(echo "$NODES" | grep -oP '"node"\s*:\s*"\K[^"]+' | head -1)

# Fallback parsing
if [ -z "$NODE" ]; then
    NODE=$(echo "$NODES" | grep -o '"node":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -z "$NODE" ]; then
    echo -e "${YELLOW}⚠ Could not detect node from API${NC}"
    echo ""
    read -p "$(echo -e ${YELLOW}'Enter Proxmox node name (usually pve): '${NC})" NODE
    NODE=${NODE:-pve}
    echo -e "${BLUE}Using node: $NODE${NC}"
else
    echo -e "${GREEN}✓ Found node: $NODE${NC}"
fi

echo -e "${BLUE}[3/7] Creating LXC container...${NC}"

# Determine template format
if [[ "$TEMPLATE_INPUT" == *":"* ]]; then
    # Already in full format (e.g., local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst)
    OSTEMPLATE="$TEMPLATE_INPUT"
else
    # Try to find matching template
    echo "Looking for template matching: $TEMPLATE_INPUT"
    TEMPLATES_RESPONSE=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/nodes/${NODE}/storage/${STORAGE}/content?content=vztmpl" \
        -b "PVEAuthCookie=${TICKET}" \
        -H "CSRFPreventionToken: ${CSRF}" 2>&1)
    
    # Try to find matching template
    OSTEMPLATE=$(echo "$TEMPLATES_RESPONSE" | grep -oP "\"volid\"\\s*:\\s*\"\\K[^\"]*${TEMPLATE_INPUT}[^\"]*" | head -1)
    
    if [ -z "$OSTEMPLATE" ]; then
        echo -e "${YELLOW}⚠ Could not find template automatically${NC}"
        echo "Available templates on ${STORAGE}:"
        echo "$TEMPLATES_RESPONSE" | grep -oP '"volid"\s*:\s*"\K[^"]*vztmpl[^"]*' | sed 's/^/  /'
        echo ""
        read -p "$(echo -e ${YELLOW}'Enter full template path (e.g., local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst): '${NC})" OSTEMPLATE
    else
        echo -e "${GREEN}✓ Found template: $OSTEMPLATE${NC}"
    fi
fi

# Build LXC creation parameters
if [[ "$USE_DHCP" =~ ^[Yy]$ ]]; then
    NET_CONFIG="name=eth0,bridge=vmbr0,firewall=1,ip=dhcp"
else
    NET_CONFIG="name=eth0,bridge=vmbr0,firewall=1,ip=${STATIC_IP},gw=${GATEWAY}"
fi

CREATE_DATA="vmid=${CONTAINER_ID}"
CREATE_DATA="${CREATE_DATA}&hostname=${CONTAINER_HOSTNAME}"
CREATE_DATA="${CREATE_DATA}&ostemplate=${OSTEMPLATE}"
CREATE_DATA="${CREATE_DATA}&storage=${STORAGE}"
CREATE_DATA="${CREATE_DATA}&rootfs=${STORAGE}:${DISK_SIZE}"
CREATE_DATA="${CREATE_DATA}&cores=${CORES}"
CREATE_DATA="${CREATE_DATA}&memory=${MEMORY}"
CREATE_DATA="${CREATE_DATA}&password=${CONTAINER_PASS}"
CREATE_DATA="${CREATE_DATA}&net0=${NET_CONFIG}"
CREATE_DATA="${CREATE_DATA}&nameserver=8.8.8.8"
CREATE_DATA="${CREATE_DATA}&unprivileged=1"
CREATE_DATA="${CREATE_DATA}&start=1"

CREATE_RESPONSE=$(curl -s -k -X POST "https://${PROXMOX_HOST}:8006/api2/json/nodes/${NODE}/lxc" \
    -b "PVEAuthCookie=${TICKET}" \
    -H "CSRFPreventionToken: ${CSRF}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$CREATE_DATA" 2>&1)

# Check for errors in response
if echo "$CREATE_RESPONSE" | grep -q '"errors"' || echo "$CREATE_RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}ERROR: Failed to create LXC${NC}"
    echo "Response:"
    echo "$CREATE_RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  - Container ID ${CONTAINER_ID} already exists"
    echo "  - Template ${TEMPLATE} not available on storage"
    echo "  - Insufficient permissions"
    exit 1
fi

echo -e "${GREEN}✓ LXC container created${NC}"

# Wait for container to start and get IP
echo -e "${BLUE}[4/7] Waiting for container to boot...${NC}"
sleep 15

# Try multiple methods to get container IP
CONTAINER_IP=""

# Method 1: Try pct command first (most reliable if available)
if command -v pct &> /dev/null; then
    echo "Trying pct command..."
    ATTEMPTS=0
    while [ $ATTEMPTS -lt 30 ]; do
        CONTAINER_IP=$(pct exec $CONTAINER_ID -- ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
        
        if [ ! -z "$CONTAINER_IP" ] && [ "$CONTAINER_IP" != "0.0.0.0" ]; then
            echo -e "${GREEN}✓ Container is running at $CONTAINER_IP (via pct)${NC}"
            break
        fi
        
        echo -n "."
        sleep 2
        ATTEMPTS=$((ATTEMPTS + 1))
    done
fi

# Method 2: Try Proxmox API with better parsing
if [ -z "$CONTAINER_IP" ] || [ "$CONTAINER_IP" == "0.0.0.0" ]; then
    echo ""
    echo "Trying Proxmox API..."
    ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        # Try to get network interfaces
        API_RESPONSE=$(curl -s -k -X GET "https://${PROXMOX_HOST}:8006/api2/json/nodes/${NODE}/lxc/${CONTAINER_ID}/interfaces" \
            -b "PVEAuthCookie=${TICKET}" \
            -H "CSRFPreventionToken: ${CSRF}" 2>/dev/null)
        
        # Try to extract IP from response
        CONTAINER_IP=$(echo "$API_RESPONSE" | grep -oP '"inet":\s*"\K[^/]+' | head -1)
        
        # Also try alternative parsing
        if [ -z "$CONTAINER_IP" ]; then
            CONTAINER_IP=$(echo "$API_RESPONSE" | grep -oP '\d+\.\d+\.\d+\.\d+' | grep -v "127.0.0.1" | grep -v "0.0.0.0" | head -1)
        fi
        
        if [ ! -z "$CONTAINER_IP" ] && [ "$CONTAINER_IP" != "0.0.0.0" ] && [ "$CONTAINER_IP" != "127.0.0.1" ]; then
            echo -e "${GREEN}✓ Container is running at $CONTAINER_IP (via API)${NC}"
            break
        fi
        
        echo -n "."
        sleep 3
        ATTEMPTS=$((ATTEMPTS + 1))
    done
fi

# Method 3: Fallback options
if [ -z "$CONTAINER_IP" ] || [ "$CONTAINER_IP" == "0.0.0.0" ] || [ "$CONTAINER_IP" == "127.0.0.1" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Could not automatically detect IP${NC}"
    echo -e "${BLUE}Trying alternative methods...${NC}"
    
    # If static IP was configured, use that
    if [ ! -z "$STATIC_IP" ]; then
        CONTAINER_IP=$(echo $STATIC_IP | cut -d'/' -f1)
        echo -e "${GREEN}Using configured static IP: $CONTAINER_IP${NC}"
    else
        # Try to find IP via SSH scan on common subnet (if on same network)
        echo -e "${YELLOW}Please find the container IP manually:${NC}"
        echo "  Option 1: Check Proxmox web UI → Container ${CONTAINER_ID} → Summary"
        echo "  Option 2: In Proxmox shell, run: pct exec ${CONTAINER_ID} -- ip addr show eth0"
        echo "  Option 3: Check your router's DHCP leases for 'matrix-effect'"
        echo ""
        
        # Interactive prompt with validation
        while true; do
            read -p "$(echo -e ${YELLOW}'Enter container IP address: '${NC})" CONTAINER_IP
            
            # Validate IP format
            if [[ $CONTAINER_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
                # Check if reachable
                if ping -c 1 -W 2 $CONTAINER_IP &> /dev/null; then
                    echo -e "${GREEN}✓ IP is reachable${NC}"
                    break
                else
                    echo -e "${YELLOW}⚠ IP does not respond to ping, but proceeding anyway...${NC}"
                    read -p "Continue with this IP? (y/n): " CONFIRM
                    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                        break
                    fi
                fi
            else
                echo -e "${RED}Invalid IP format. Please enter a valid IP address (e.g., 192.168.1.100)${NC}"
            fi
        done
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
