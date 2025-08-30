#!/bin/bash

# Clean all blockchain database files to ensure fresh start

echo "Cleaning blockchain databases..."

# Remove blockchain database files from all node directories
rm -f data/node_node1/blockchain.db
rm -f data/node_node2/blockchain.db
rm -f data/node_node3/blockchain.db
rm -f data/node_node4/blockchain.db

# Remove any backup or temporary database files
rm -f data/node_node1/*.db*
rm -f data/node_node2/*.db*
rm -f data/node_node3/*.db*
rm -f data/node_node4/*.db*

# Create logs directory if it doesn't exist
mkdir -p logs

echo "✓ All blockchain databases cleaned"
echo "✓ Nodes will start with fresh, identical genesis blocks"
