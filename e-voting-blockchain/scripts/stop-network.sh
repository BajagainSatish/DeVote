#!/bin/bash

# Stop all PBFT nodes

echo "Stopping PBFT Blockchain Network..."

# Kill all go processes running pbft-node
pkill -f "pbft-node/main.go"

# Alternative: kill by port
for port in 8081 8082 8083 8084; do
  PID=$(lsof -ti:$port)
  if [ ! -z "$PID" ]; then
    echo "Killing process on port $port (PID: $PID)"
    kill $PID
  fi
done

echo "Network stopped!"
