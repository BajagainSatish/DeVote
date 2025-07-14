// package main

// import (
// 	"fmt"
// 	"os"
// )

// func main() {
// 	files := []string{"election.json", "chain.db"}

//		for _, file := range files {
//			err := os.Remove(file)
//			if err != nil {
//				fmt.Printf("Failed to delete %s: %v\n", file, err)
//			} else {
//				fmt.Printf("Deleted %s\n", file)
//			}
//		}
//	}
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	fmt.Println("🧹 SYSTEM RESET UTILITY")
	// fmt.Println("=" * 30)
	fmt.Println("⚠️  WARNING: This will delete ALL data!")
	fmt.Println("Press Enter to continue or Ctrl+C to cancel...")

	// Wait for user confirmation
	fmt.Scanln()

	// List of files and directories to delete
	filesToDelete := []string{
		// Blockchain data
		"chain.db",
		"blockchain.db",
		"blocks.json",

		// Election data
		"election.json",
		"candidates.json",
		"parties.json",

		// User data
		"registered_voters.json",
		"voters.json",
		"users.json",

		// Admin data
		"admin_sessions.json",
		"admin.json",

		// Logs
		"app.log",
		"error.log",
		"blockchain.log",

		// Temporary files
		"temp.json",
		"backup.json",
	}

	// Directories to clean
	dirsToClean := []string{
		"data",
		"logs",
		"temp",
		"uploads",
	}

	deletedFiles := 0
	errors := 0

	fmt.Println("\n🗑️  Deleting files...")

	// Delete individual files
	for _, file := range filesToDelete {
		if _, err := os.Stat(file); err == nil {
			if err := os.Remove(file); err != nil {
				fmt.Printf("❌ Failed to delete %s: %v\n", file, err)
				errors++
			} else {
				fmt.Printf("✅ Deleted %s\n", file)
				deletedFiles++
			}
		}
	}

	// Clean directories
	fmt.Println("\n📁 Cleaning directories...")
	for _, dir := range dirsToClean {
		if _, err := os.Stat(dir); err == nil {
			err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				if !info.IsDir() {
					if err := os.Remove(path); err != nil {
						fmt.Printf("❌ Failed to delete %s: %v\n", path, err)
						errors++
					} else {
						fmt.Printf("✅ Deleted %s\n", path)
						deletedFiles++
					}
				}
				return nil
			})

			if err != nil {
				fmt.Printf("❌ Error cleaning directory %s: %v\n", dir, err)
				errors++
			}

			// Try to remove the directory itself if it's empty
			if err := os.Remove(dir); err == nil {
				fmt.Printf("✅ Removed empty directory %s\n", dir)
			}
		}
	}

	// Summary
	fmt.Println("\n📊 RESET SUMMARY")
	// fmt.Println("-" * 20)
	fmt.Printf("✅ Files deleted: %d\n", deletedFiles)
	if errors > 0 {
		fmt.Printf("❌ Errors encountered: %d\n", errors)
		fmt.Println("\n⚠️  Some files could not be deleted.")
		fmt.Println("   This is normal if they don't exist or are in use.")
	} else {
		fmt.Println("🎉 All data successfully cleared!")
	}

	fmt.Println("\n💡 NEXT STEPS:")
	fmt.Println("   1. Run 'go run cmd/init-test-data/main.go' to create test data")
	fmt.Println("   2. Start the web server to begin fresh")
	fmt.Println("   3. Use the admin panel to set up your election")

	fmt.Println("\n🔄 System reset completed!")
}
