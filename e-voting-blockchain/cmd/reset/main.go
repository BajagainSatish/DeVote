//server/main.go

package main

import (
	"fmt"
	"os"
)

func main() {
	files := []string{"election.json", "chain.db"}

	for _, file := range files {
		err := os.Remove(file)
		if err != nil {
			fmt.Printf("Failed to delete %s: %v\n", file, err)
		} else {
			fmt.Printf("Deleted %s\n", file)
		}
	}
}
