#!/bin/bash

# Start PBFT network with 4 nodes

echo "Starting PBFT Blockchain Network..."

./scripts/stop-network.sh 2>/dev/null

# Create data directories
mkdir -p data/node_node1
mkdir -p data/node_node2  
mkdir -p data/node_node3
mkdir -p data/node_node4

# Copy network config to each node directory
cp network.json data/node_node1/
cp network.json data/node_node2/
cp network.json data/node_node3/
cp network.json data/node_node4/

echo "Building PBFT node..."
if ! go build -o bin/pbft-node cmd/pbft-node/main.go; then
    echo "Failed to build PBFT node. Check for compilation errors."
    exit 1
fi

echo "Starting Node 1 (Primary)..."
./bin/pbft-node -id=node1 -port=8081 -config=network.json > logs/node1.log 2>&1 &
NODE1_PID=$!

sleep 3

echo "Starting Node 2..."
./bin/pbft-node -id=node2 -port=8082 -config=network.json > logs/node2.log 2>&1 &
NODE2_PID=$!

sleep 3

echo "Starting Node 3..."
./bin/pbft-node -id=node3 -port=8083 -config=network.json > logs/node3.log 2>&1 &
NODE3_PID=$!

sleep 3

echo "Starting Node 4..."
./bin/pbft-node -id=node4 -port=8084 -config=network.json > logs/node4.log 2>&1 &
NODE4_PID=$!

sleep 3

echo "Checking node health..."
for port in 8081 8082 8083 8084; do
    if curl -s http://localhost:$port/pbft/status > /dev/null; then
        echo "✓ Node on port $port is running"
    else
        echo "✗ Node on port $port failed to start"
        echo "Check logs/node$((port-8080)).log for errors"
    fi
done

echo ""
echo "All nodes started!"
echo "Node 1: http://localhost:8081 (Primary)"
echo "Node 2: http://localhost:8082"
echo "Node 3: http://localhost:8083" 
echo "Node 4: http://localhost:8084"

echo "PIDs: $NODE1_PID $NODE2_PID $NODE3_PID $NODE4_PID"
echo "Logs: logs/node1.log logs/node2.log logs/node3.log logs/node4.log"

# Wait for interrupt
trap "kill $NODE1_PID $NODE2_PID $NODE3_PID $NODE4_PID 2>/dev/null" INT
wait
