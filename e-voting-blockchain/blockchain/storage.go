package blockchain

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"log"

	"go.etcd.io/bbolt"
)

var db *bbolt.DB

const bucketName = "Blocks"
const anonBucketName = "AnonTokens"

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
		if err != nil {
			return err
		}
		_, err = tx.CreateBucketIfNotExists([]byte(anonBucketName))
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
		if b == nil {
			// No blocks yet, return empty slice
			return nil
		}
		return b.ForEach(func(k, v []byte) error {
			var block Block
			if err := json.Unmarshal(v, &block); err != nil {
				return err
			}
			blocks = append(blocks, block)
			return nil
		})
	})
	if err != nil {
		return nil, err
	}

	// Sort blocks by Index (important because BoltDB does not guarantee order)
	for i := 0; i < len(blocks)-1; i++ {
		for j := i + 1; j < len(blocks); j++ {
			if blocks[i].Index > blocks[j].Index {
				blocks[i], blocks[j] = blocks[j], blocks[i]
			}
		}
	}

	// Ensure slices are non-nil for all transactions
	for i := range blocks {
		if blocks[i].Transactions == nil {
			blocks[i].Transactions = make([]Transaction, 0)
		}
	}

	return blocks, nil
}

// itob converts an int to a byte slice (used as DB keys).
//
//	func itob(v int) []byte {
//		return []byte(string(rune(v)))
//	}
func itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

func isAnonTokenUsed(tokenKey string) (bool, error) {
	var exists bool
	err := db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(anonBucketName))
		if b == nil {
			return errors.New("anon bucket missing")
		}
		v := b.Get([]byte(tokenKey))
		exists = v != nil
		return nil
	})
	return exists, err
}

func markAnonTokenUsed(tokenKey string) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(anonBucketName))
		if b == nil {
			return errors.New("anon bucket missing")
		}
		return b.Put([]byte(tokenKey), []byte{1})
	})
}
