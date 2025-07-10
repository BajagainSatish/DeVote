package blockchain

import (
	"encoding/json"
	"log"

	"go.etcd.io/bbolt"
)

var db *bbolt.DB

const bucketName = "Blocks"

// InitDB opens or creates the blockchain DB file.
func InitDB() {
	var err error
	db, err = bbolt.Open("chain.db", 0600, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Create bucket if not exists
	db.Update(func(tx *bbolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(bucketName))
		return err
	})
}

// SaveBlock stores a block in the database.
// It uses block index as the key.
func SaveBlock(block Block) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucketName))

		data, err := json.Marshal(block)
		if err != nil {
			return err
		}

		key := itob(block.Index)
		return b.Put(key, data)
	})
}

// LoadBlocks loads all blocks from the database into a slice.
func LoadBlocks() ([]Block, error) {
	var blocks []Block

	err := db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucketName))

		return b.ForEach(func(k, v []byte) error {
			var block Block
			if err := json.Unmarshal(v, &block); err != nil {
				return err
			}
			blocks = append(blocks, block)
			return nil
		})
	})

	return blocks, err
}

// itob converts an int to a byte slice (used as DB keys).
func itob(v int) []byte {
	return []byte(string(rune(v)))
}
