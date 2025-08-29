# run-byzantine-tests.sh
#!/bin/bash

echo "=== PBFT BYZANTINE FAULT TOLERANCE TEST RUNNER ==="

# Check if network is running
echo "Checking if PBFT network is running..."
for port in 8081 8082 8083 8084; do
    if ! curl -s http://localhost:$port/health > /dev/null; then
        echo "❌ Node on port $port is not running!"
        echo "Please start the network first with: bash scripts/start-network.sh"
        exit 1
    fi
done

echo "✅ All nodes are running"
echo ""

# Clean any existing data and restart fresh
echo "Cleaning existing blockchain data..."
bash scripts/clean-data.sh

echo "Restarting network for fresh test..."
bash scripts/stop-network.sh
sleep 2
bash scripts/start-network.sh

# Wait for nodes to fully start
echo "Waiting for nodes to initialize..."
sleep 5

# Verify all nodes have same genesis block
echo "Verifying genesis block synchronization..."
cd pbft-tests
go run main.go genesis

echo ""
echo "=== STARTING BYZANTINE FAULT TOLERANCE TESTS ==="
echo ""

# Run Byzantine tests
go run main.go byzantine

echo ""
echo "=== BYZANTINE FAULT TOLERANCE TESTS COMPLETED ==="
echo ""

# Optional: Run regular consensus test to verify system is still working
echo "Running final consensus verification..."
go run main.go consensus

echo ""
echo "All tests completed! Check the output above for results."
