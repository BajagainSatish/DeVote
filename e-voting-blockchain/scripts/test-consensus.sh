#!/bin/bash

# Test PBFT consensus by submitting votes

echo "Testing PBFT Consensus..."

echo "Checking node availability..."
for port in 8081 8082 8083 8084; do
    if curl -s http://localhost:$port/pbft/status > /dev/null; then
        echo "✓ Node on port $port is available"
    else
        echo "✗ Node on port $port is not responding"
    fi
done

echo ""

# Submit votes to different nodes
echo "Submitting vote 1 to Node 1..."
curl -X POST http://localhost:8081/vote \
  -H "Content-Type: application/json" \
  -d '{"voter_id": "voter1", "candidate_id": "candidate_a"}'

sleep 1

echo "Submitting vote 2 to Node 2..."
curl -X POST http://localhost:8082/vote \
  -H "Content-Type: application/json" \
  -d '{"voter_id": "voter2", "candidate_id": "candidate_b"}'

sleep 1

echo "Submitting vote 3 to Node 3..."
curl -X POST http://localhost:8083/vote \
  -H "Content-Type: application/json" \
  -d '{"voter_id": "voter3", "candidate_id": "candidate_a"}'

sleep 5

echo -e "\n=== Node Status ==="
for port in 8081 8082 8083 8084; do
  echo "Node on port $port:"
  curl -s http://localhost:$port/pbft/status || echo "Node not responding"
  echo ""
done

# Check vote tallies on all nodes
echo -e "\n=== Vote Tallies ==="
for port in 8081 8082 8083 8084; do
  echo "Tally from node on port $port:"
  curl -s http://localhost:$port/tally || echo "Node not responding"
  echo ""
done

echo -e "\n=== Blockchain Status ==="
for port in 8081 8082 8083 8084; do
  echo "Blockchain from node on port $port:"
  curl -s http://localhost:$port/blockchain | head -c 200 || echo "Node not responding"
  echo "..."
  echo ""
done
