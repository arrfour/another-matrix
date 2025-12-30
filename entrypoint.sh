#!/bin/sh

# Start nginx in the background
nginx -g 'daemon off;' &
NGINX_PID=$!

# Function to cleanup on exit
cleanup() {
  kill $NGINX_PID 2>/dev/null
  wait $NGINX_PID 2>/dev/null
  exit 0
}

trap cleanup SIGTERM SIGINT

# Make stdin non-blocking
stty -echo cbreak 2>/dev/null || true

# Main loop
while true; do
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
  char=$(timeout 15 dd bs=1 count=1 2>/dev/null)
  
  case "$char" in
    q|Q)
      stty echo -cbreak 2>/dev/null || true
      echo ""
      echo "Shutting down..."
      cleanup
      ;;
    c|C)
      echo "Clearing log..."
      echo "" > /var/log/nginx/access.log
      sleep 2
      ;;
  esac
done
