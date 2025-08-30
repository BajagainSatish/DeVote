DeVote
Decentralized Voting System using a Custom Blockchain
Final Year Project – BSc. CSIT

DeVote is a decentralized electronic voting system built on a custom blockchain. The project demonstrates core blockchain concepts, consensus mechanisms, cryptographic algorithms, and zero-knowledge techniques while ensuring vote integrity, voter anonymity, and tamper-proof records.

Frontend: React.js (Vite)
Backend: Go (Custom Blockchain + API)

Admin Role
      Start / Stop an election
      Add / Modify / Remove candidates or parties
      Monitor blockchain activity through the explorer

User Role
      Vote for a candidate (with anonymity)
      View election results
      Access the blockchain explorer (audit actions by admin)
      Zero-Knowledge Proofs: Prove you have voted without revealing who you voted for

Cryptography & Algorithms Implemented

SHA – Hashing for data integrity
RSA – Public key cryptography for secure communication
Merkle Tree – Efficient verification of vote inclusion
Blockchain Fundamentals – Immutable ledger, consensus-driven updates
Zero-Knowledge Algorithm (Custom) – Proof-of-vote without exposing choice
PBFT (Practical Byzantine Fault Tolerance) – Consensus across decentralized nodes

Decentralization & Consensus

DeVote simulates a network of multiple nodes across 4 ports.
Each node maintains its own local database but starts from the same genesis block.

Consensus follows PBFT:

1. Primary node proposes a block (Pre-prepare phase)
2. Validator nodes verify the block (Prepare phase)
3. All nodes agree, and the block is committed (Commit phase)

This ensures:

All nodes share the same blockchain
Fault tolerance:
      With 3f + 1 nodes, the system tolerates up to f faulty nodes
      If at least 2f + 1 nodes are honest, the blockchain remains secure
