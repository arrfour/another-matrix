#!/bin/sh

# Check if we have a TTY for interactive mode
if [ ! -t 0 ]; then
  echo "Non-interactive environment detected. Starting nginx in foreground..."
  exec nginx -g 'daemon off;'
fi

# Start nginx in the background for interactive mode
nginx -g 'daemon off;' &
NGINX_PID=$!

# Function to cleanup on exit
cleanup() {
  echo "Shutting down..."
  kill $NGINX_PID 2>/dev/null
  wait $NGINX_PID 2>/dev/null
  stty echo cbreak 2>/dev/null || true
  exit 0
}

trap cleanup SIGTERM SIGINT

# Make stdin non-blocking
stty -echo cbreak 2>/dev/null || true

# Main loop
while true; do
  # Check if nginx is still running
  if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "Nginx process died. Exiting..."
    exit 1
  fi

  clear
  
  # Draw header
  echo "=========================================="
  echo "  Matrix Effect - Running on localhost:8880"
  echo "=========================================="
  echo ""
  echo "Commands: [q] Quit | [c] Clear Log"
  echo ""
  echo "--- Server Log (Last 30 Requests) ---"
  echo ""
  
  # Show last 30 lines of access log
  if [ -f /var/log/nginx/access.log ]; then
    tail -30 /var/log/nginx/access.log 2>/dev/null | sed 's/^/  /'
  fi
  
  echo ""
  echo ">>> "
  
  # Check for user input (with 15 second timeout so logs stay visible longer)
  # dd on some systems returns immediately if no stdin is present, causing a tight loop.
  char=$(timeout 15 dd bs=1 count=1 2>/dev/null)
  
  case "$char" in
    q|Q)
      cleanup
      ;;
    c|C)
      echo "Clearing log..."
      echo "" > /var/log/nginx/access.log
      sleep 1
      ;;
    *)
      # Small sleep to prevent tight loop if dd returns immediately (EOF)
      # even if timeout didn't trigger.
      sleep 1
      ;;
  esac
done
