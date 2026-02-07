# Storage Overflow Fix

**Status: ✅ FIXED**

## Problem

The container was experiencing storage overflow over time, causing the container's footprint to grow continuously on the host/partition. This made long-running deployments consume excessive disk space.

## Root Cause

The issue was caused by unbounded nginx log file growth:

1. **Access logs** (`/var/log/nginx/access.log`) were growing without limits
2. **Error logs** (`/var/log/nginx/error.log`) were also growing unbounded
3. Previous log rotation only worked in interactive mode, not in background/daemon mode
4. Error logs had no rotation mechanism at all
5. No nginx configuration existed to manage log sizes

## Solution

A comprehensive log rotation strategy was implemented across all deployment modes:

### 1. Docker/Podman Containers

#### Added `docker/nginx.conf`
- Custom nginx configuration to properly manage logs
- Replaces default nginx:alpine configuration

#### Updated `docker/entrypoint.sh`
- **New `rotate_logs()` function**: Handles both access and error logs
  - Keeps logs under 5000 lines
  - Rotates to last 1000 lines when threshold is exceeded
  - Logs rotation events for troubleshooting
  
- **Background Mode Enhancement**: 
  - Previously just ran nginx with `exec`
  - Now monitors nginx AND rotates logs every 60 seconds
  - Ensures logs never grow unbounded even in daemon mode
  
- **Interactive Mode Enhancement**:
  - Already had rotation, but now uses the shared `rotate_logs()` function
  - Consistent behavior across both modes
  - Handles both access and error logs

#### Updated `docker/Dockerfile`
- Copies the new `nginx.conf` to `/etc/nginx/nginx.conf`
- Ensures custom configuration is used

### 2. Proxmox LXC Deployments

#### Updated `deploy/setup.sh`
- **Added logrotate configuration** for nginx logs:
  - Daily rotation
  - Keeps 7 days of logs
  - Compresses old logs
  - Automatically reloads nginx after rotation
  - Applies to both access and error logs

## Technical Details

### Log Rotation Thresholds
- **Line count threshold**: 5000 lines
- **Retention after rotation**: 1000 most recent lines
- **Rotation frequency (containers)**: Every 60 seconds
- **Rotation frequency (LXC)**: Daily via logrotate

### Files Modified
1. `docker/nginx.conf` - NEW
2. `docker/entrypoint.sh` - UPDATED
3. `docker/Dockerfile` - UPDATED
4. `deploy/setup.sh` - UPDATED

## Testing

The fix was validated by:
1. Building the Docker image successfully
2. Running container in background mode and verifying log rotation message
3. Confirming nginx serves content correctly
4. Verifying the entrypoint process is running and monitoring

## Impact

### Before Fix
- Logs grew indefinitely (could reach GB sizes)
- Container storage footprint increased continuously
- Required manual intervention to clean logs
- Risk of filling up host partition

### After Fix
- Logs are capped at ~5000 lines (~500KB typical size)
- Automatic rotation in all modes (interactive, background, LXC)
- Both access and error logs are managed
- Container storage remains stable over time
- No manual intervention required

## Recommendations for Users

### Docker/Podman Users
- No action required - automatic log rotation is built-in
- Logs are kept small and rotated automatically
- Both background (`-d`) and interactive (`-it`) modes are protected

### LXC Users
- Re-run `deploy/setup.sh` to apply logrotate configuration
- Or manually add the logrotate config from the updated script
- Logrotate runs daily via system cron

### Existing Deployments
To apply the fix to existing containers/LXCs:

**Docker/Podman:**
```bash
# Rebuild and restart
docker build -t matrix-effect -f docker/Dockerfile .
docker stop matrix && docker rm matrix
docker run -d --name matrix -p 8880:80 matrix-effect
```

**LXC:**
```bash
# Re-run setup script or manually add logrotate config
cd /path/to/matrix-files
bash setup.sh
```

## Related Issues

This fix addresses:
- Original issue: "storage overflow?" - Container taking up tons of space over time
- Complements the previous CPU usage fix (v2.1) which addressed process spinning

## Version

Fixed in the current version (post-v2.1)
