package pbft

import (
	"encoding/json"
	"os"
)

// NetworkConfig represents the PBFT network configuration
type NetworkConfig struct {
	Nodes []NodeConfig `json:"nodes"`
}

// NodeConfig represents configuration for a single node
type NodeConfig struct {
	ID      string `json:"id"`
	Address string `json:"address"`
	Port    int    `json:"port"`
}

// LoadNetworkConfig loads the network configuration from a JSON file
func LoadNetworkConfig(filename string) (*NetworkConfig, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var config NetworkConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

// SaveNetworkConfig saves the network configuration to a JSON file
func SaveNetworkConfig(config *NetworkConfig, filename string) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filename, data, 0644)
}

// GetPeersForNode returns the peer list for a specific node
func (nc *NetworkConfig) GetPeersForNode(nodeID string) []Peer {
	var peers []Peer

	for _, node := range nc.Nodes {
		if node.ID != nodeID {
			peers = append(peers, Peer{
				ID:      node.ID,
				Address: node.Address,
				Port:    node.Port,
				Active:  true,
			})
		}
	}

	return peers
}
