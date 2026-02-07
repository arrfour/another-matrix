#!/bin/bash

# Matrix Effect - Proxmox LXC Setup Script
# Run this script inside a fresh Proxmox LXC (Ubuntu/Debian based)
# Usage: bash setup.sh

set -e

echo "=========================================="
echo "  Matrix Effect - LXC Setup Script"
echo "=========================================="
echo ""

# Update system
echo "[1/5] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install dependencies
echo "[2/5] Installing nginx..."
apt-get install -y -qq nginx curl wget

# Create web root if it doesn't exist
echo "[3/5] Setting up web directories..."
mkdir -p /var/www/html

# Download or copy files
echo "[4/5] Setting up application files..."

# Check if files are in current directory
if [ -f "./index.html" ] && [ -f "./script.js" ] && [ -f "./README.md" ]; then
    echo "  Copying files from current directory..."
    cp ./index.html /var/www/html/
    cp ./script.js /var/www/html/
    cp ./README.md /var/www/html/
else
    echo "  Files not found in current directory."
    echo "  Please ensure index.html, script.js, and README.md are in the same directory as this script."
    exit 1
fi

# Ensure proper permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Configure nginx
echo "[5/5] Configuring nginx..."

# Create nginx config for the app
cat > /etc/nginx/sites-available/matrix-effect << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(js|css|html|md)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    error_log /var/log/nginx/matrix-effect-error.log;
    access_log /var/log/nginx/matrix-effect-access.log;
}
EOF

# Enable the site
if [ -L /etc/nginx/sites-enabled/matrix-effect ]; then
    rm /etc/nginx/sites-enabled/matrix-effect
fi
ln -s /etc/nginx/sites-available/matrix-effect /etc/nginx/sites-enabled/

# Disable default site
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t > /dev/null 2>&1 || {
    echo "ERROR: nginx configuration failed"
    exit 1
}

# Set up logrotate for nginx logs to prevent storage overflow
echo "Setting up log rotation..."
cat > /etc/logrotate.d/nginx-matrix << 'LOGROTATE_EOF'
/var/log/nginx/matrix-effect-*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
LOGROTATE_EOF

# Start nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Matrix Effect is now running on this LXC."
echo ""
echo "Access the application at:"
echo "  http://<lxc-ip-address>"
echo ""
echo "To find your LXC IP address, run:"
echo "  ip addr show"
echo ""
echo "Application files are located at:"
echo "  /var/www/html/"
echo ""
echo "Web server logs:"
echo "  Access: /var/log/nginx/matrix-effect-access.log"
echo "  Error:  /var/log/nginx/matrix-effect-error.log"
echo ""
echo "To update the README or application files:"
echo "  Just edit or replace files in /var/www/html/"
echo "  No restart needed for HTML/JS changes"
echo ""
