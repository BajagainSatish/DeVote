package blockchain

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"go.etcd.io/bbolt"
)

var db *bbolt.DB

const (
	blocksBucket = "blocks"
	dbFileName   = "blockchain.db"
)

// InitDB initializes the database connection
func InitDB(customPath ...string) error {
	var err error
	var dbPath string

	if len(customPath) > 0 && customPath[0] != "" {
		// Use custom path if provided
		dbPath = customPath[0]
		// Ensure the directory exists
		if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
			return fmt.Errorf("failed to create database directory: %v", err)
		}
	} else {
		// Default behavior - use data directory
		dataDir := "data"
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			return fmt.Errorf("failed to create data directory: %v", err)
		}
		dbPath = filepath.Join(dataDir, dbFileName)
	}

	db, err = bbolt.Open(dbPath, 0600, &bbolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// Create blocks bucket if it doesn't exist
	err = db.Update(func(tx *bbolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(blocksBucket))
		return err
	})

	if err != nil {
		return fmt.Errorf("failed to create blocks bucket: %v", err)
	}

	log.Printf("Database initialized at %s", dbPath)
	return nil
}

// CloseDB closes the database connection
func CloseDB() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

// SaveBlock saves a block to the database
func SaveBlock(block Block) error {
	if db == nil {
		if err := InitDB(); err != nil {
			return err
		}
	}

	return db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(blocksBucket))
		if bucket == nil {
			return fmt.Errorf("blocks bucket not found")
		}

		// Serialize block to JSON
		blockData, err := json.Marshal(block)
		if err != nil {
			return fmt.Errorf("failed to marshal block: %v", err)
		}

		// Use block index as key
		key := []byte(strconv.Itoa(block.Index))

		err = bucket.Put(key, blockData)
		if err != nil {
			return fmt.Errorf("failed to save block: %v", err)
		}

		log.Printf("Block #%d saved to database", block.Index)
		return nil
	})
}

// LoadBlocks loads all blocks from the database
func LoadBlocks() ([]Block, error) {
	if db == nil {
		if err := InitDB(); err != nil {
			return nil, err
		}
	}

	var blocks []Block

	err := db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(blocksBucket))
		if bucket == nil {
			return fmt.Errorf("blocks bucket not found")
		}

		// Iterate through all blocks
		cursor := bucket.Cursor()
		for key, value := cursor.First(); key != nil; key, value = cursor.Next() {
			var block Block
			if err := json.Unmarshal(value, &block); err != nil {
				log.Printf("Warning: failed to unmarshal block with key %s: %v", key, err)
				continue
			}
			blocks = append(blocks, block)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to load blocks: %v", err)
	}

	log.Printf("Loaded %d blocks from database", len(blocks))
	return blocks, nil
}

// GetBlock retrieves a specific block by index
func GetBlock(index int) (*Block, error) {
	if db == nil {
		if err := InitDB(); err != nil {
			return nil, err
		}
	}

	var block Block
	found := false

	err := db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(blocksBucket))
		if bucket == nil {
			return fmt.Errorf("blocks bucket not found")
		}

		key := []byte(strconv.Itoa(index))
		value := bucket.Get(key)

		if value == nil {
			return nil // Block not found
		}

		if err := json.Unmarshal(value, &block); err != nil {
			return fmt.Errorf("failed to unmarshal block: %v", err)
		}

		found = true
		return nil
	})

	if err != nil {
		return nil, err
	}

	if !found {
		return nil, fmt.Errorf("block #%d not found", index)
	}

	return &block, nil
}

// GetBlockCount returns the total number of blocks in the database
func GetBlockCount() (int, error) {
	if db == nil {
		if err := InitDB(); err != nil {
			return 0, err
		}
	}

	count := 0

	err := db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(blocksBucket))
		if bucket == nil {
			return fmt.Errorf("blocks bucket not found")
		}

		cursor := bucket.Cursor()
		for key, _ := cursor.First(); key != nil; key, _ = cursor.Next() {
			count++
		}

		return nil
	})

	return count, err
}
