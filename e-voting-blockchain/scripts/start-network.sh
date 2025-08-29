#!/bin/bash

# Start PBFT network with 4 nodes

echo "Starting PBFT Blockchain Network..."

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

# Start nodes in background
echo "Starting Node 1 (Primary)..."
go run cmd/pbft-node/main.go -id=node1 -port=8081 -config=network.json &
NODE1_PID=$!

sleep 2

echo "Starting Node 2..."
go run cmd/pbft-node/main.go -id=node2 -port=8082 -config=network.json &
NODE2_PID=$!

sleep 2

echo "Starting Node 3..."
go run cmd/pbft-node/main.go -id=node3 -port=8083 -config=network.json &
NODE3_PID=$!

sleep 2

echo "Starting Node 4..."
go run cmd/pbft-node/main.go -id=node4 -port=8084 -config=network.json &
NODE4_PID=$!

echo "All nodes started!"
echo "Node 1: http://localhost:8081 (Primary)"
echo "Node 2: http://localhost:8082"
echo "Node 3: http://localhost:8083" 
echo "Node 4: http://localhost:8084"

echo "PIDs: $NODE1_PID $NODE2_PID $NODE3_PID $NODE4_PID"

# Wait for interrupt
trap "kill $NODE1_PID $NODE2_PID $NODE3_PID $NODE4_PID" INT
wait
