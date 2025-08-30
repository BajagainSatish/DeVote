#!/bin/bash

# Setup script to prepare the environment

echo "Setting up PBFT Blockchain environment..."

# Create necessary directories
mkdir -p bin
mkdir -p logs
mkdir -p data

# Build the PBFT node
echo "Building PBFT node..."
if go build -o bin/pbft-node cmd/pbft-node/main.go; then
    echo "✓ PBFT node built successfully"
else
    echo "✗ Failed to build PBFT node"
    exit 1
fi

# Make scripts executable
chmod +x scripts/*.sh

echo "✓ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: bash scripts/start-network.sh"
echo "2. Test: bash scripts/test-consensus.sh"
