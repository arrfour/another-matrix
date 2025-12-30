# Matrix Effect - Proxmox LXC Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create a Fresh LXC in Proxmox

In Proxmox UI:
1. Click **Datacenter** → **Create LXC**
2. Configure:
   - **Hostname**: `matrix-effect` (or your choice)
   - **Resource Pool**: Default
   - **Password**: Set a secure password
   - **Template**: `ubuntu-22.04` or `debian-12` (or latest available)
   - **Storage**: Your preferred storage
   - **Disk Size**: 5GB minimum
   - **CPU Cores**: 1
   - **Memory**: 512MB minimum (1GB recommended)
   - **Network**: Default (DHCP or static IP)
3. Click **Finish** and wait for creation
4. Start the LXC

### Step 2: Get Your LXC IP Address

In Proxmox:
1. Click on your LXC container
2. Go to **Summary** tab
3. Note the IP address shown (e.g., `192.168.1.100`)

Or inside the container:
```bash
ip addr show
```

### Step 3: Copy Files to LXC

From your local machine where you have the Matrix Effect files:

```bash
# From your project directory (deploy/ subdirectory)
scp ../src/index.html root@<lxc-ip>:/root/
scp ../src/script.js root@<lxc-ip>:/root/
scp ../src/README.md root@<lxc-ip>:/root/
scp setup.sh root@<lxc-ip>:/root/
```

Or use Proxmox's `pct` command:
```bash
pct push <container-id> ../src/index.html /root/
pct push <container-id> ../src/script.js /root/
pct push <container-id> ../src/README.md /root/
pct push <container-id> setup.sh /root/
```

### Step 4: Run Setup Script

SSH into your LXC:
```bash
ssh root@<lxc-ip>
# or via Proxmox: pct enter <container-id>
```

Inside the LXC:
```bash
cd /root
chmod +x setup.sh
bash setup.sh
```

The script will:
- Update system packages
- Install nginx
- Configure web server
- Set up your application
- Start nginx automatically

### Step 5: Access Your Application

Open your browser and go to:
```
http://<lxc-ip>
```

For example: `http://192.168.1.100`

## Advanced Configuration

### Custom Port (if not using port 80)

Edit `/etc/nginx/sites-available/matrix-effect`:
```bash
# Change this line:
listen 8880 default_server;

# Then restart nginx:
systemctl restart nginx
```

### HTTPS Setup

To enable HTTPS with Let's Encrypt:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your.domain.com
```

Then edit `/etc/nginx/sites-available/matrix-effect` to add redirect:
```nginx
server {
    listen 80;
    server_name your.domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Static IP Address

To assign a static IP in your LXC, edit `/etc/netplan/config.yaml`:
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

Then apply:
```bash
netplan apply
```

### Update Application Files

To update HTML/JavaScript/README files:

```bash
# Copy new files to LXC
scp ../src/index.html root@<lxc-ip>:/var/www/html/
scp ../src/script.js root@<lxc-ip>:/var/www/html/
scp ../src/README.md root@<lxc-ip>:/var/www/html/

# Or inside LXC, directly edit:
nano /var/www/html/script.js
```

No nginx restart needed - changes are immediate.

### Monitoring & Logs

Check nginx status:
```bash
systemctl status nginx
```

View access logs:
```bash
tail -f /var/log/nginx/matrix-effect-access.log
```

View error logs:
```bash
tail -f /var/log/nginx/matrix-effect-error.log
```

### Backup Your LXC

In Proxmox:
1. Right-click your LXC
2. Select **Backup**
3. Choose backup location and schedule

This creates a snapshot you can restore anytime.

## Troubleshooting

### LXC won't start
- Check system resources (CPU, memory, disk space)
- Check Proxmox logs

### Can't access the application
- Verify LXC is running: `pct list`
- Check IP address: `pct exec <id> ip addr show`
- Check nginx: `pct exec <id> systemctl status nginx`
- Check firewall rules on host

### Nginx not responding
```bash
# Inside LXC, restart nginx:
systemctl restart nginx

# Check configuration:
nginx -t
```

### Files not found
Make sure all three files exist in `/var/www/html/`:
```bash
ls -la /var/www/html/
```

Should show:
- index.html
- script.js
- README.md

## Performance Tips

- **Memory**: 1GB+ for smooth operation
- **CPU**: 2+ cores for better responsiveness
- **Disk**: NVMe storage recommended for faster load times

## Uninstall / Clean Up

To remove and restart:
```bash
# Remove all application files but keep system
rm -rf /var/www/html/*

# Or completely remove the LXC from Proxmox:
pct destroy <container-id>
```

## Support

For issues or improvements, check:
- Application README: `http://<lxc-ip>/README.md` (or click ℹ in app)
- Browser console for errors: F12 → Console tab
- nginx error logs: `/var/log/nginx/matrix-effect-error.log`

---

**Happy Hacking! 🔥**
