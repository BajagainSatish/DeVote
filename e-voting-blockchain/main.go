package main

import (
	"e-voting-blockchain/server" // Import the server with handlers
	"fmt"
	"net/http"
)

// Entry point of the application
func main() {
	// Map the HTTP endpoints to handler functions
	http.HandleFunc("/vote", server.HandleVote)
	http.HandleFunc("/tally", server.HandleTally)

	// Start the web server
	fmt.Println("Server started at http://localhost:8080")
	http.ListenAndServe(":8080", nil) // Start listening for HTTP requests
}
