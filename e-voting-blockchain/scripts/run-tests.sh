#!/bin/bash

echo "PBFT Blockchain Test Runner"
echo "=========================="

# Check if nodes are running
echo "Checking if nodes are running..."
for port in 8081 8082 8083 8084; do
    if ! curl -s http://localhost:$port/health > /dev/null; then
        echo "ERROR: Node on port $port is not running!"
        echo "Please run 'bash scripts/start-network.sh' first"
        exit 1
    fi
done

echo "All nodes are running ✓"
echo ""

# Build and run tests
echo "Building test suite..."
cd tests
go mod init pbft-tests 2>/dev/null || true
go mod tidy

echo "Running tests..."
echo ""

case "${1:-all}" in
    "genesis")
        echo "Running Genesis Block Consistency Test..."
        go run . -test=genesis
        ;;
    "consensus")
        echo "Running PBFT Consensus Test..."
        go run . -test=consensus
        ;;
    "all")
        echo "Running All Tests..."
        go run . -test=all
        ;;
    *)
        echo "Usage: bash scripts/run-tests.sh [genesis|consensus|all]"
        echo "  genesis  - Test genesis block consistency"
        echo "  consensus - Test PBFT consensus"
        echo "  all      - Run both tests (default)"
        exit 1
        ;;
esac
