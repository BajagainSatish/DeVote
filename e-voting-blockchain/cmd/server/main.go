//server/main.go

package main

import (
	"e-voting-blockchain/internal/server" // Import the server with handlers
	"log"
	"net/http"
)

func main() {
	// Setup all routes using internal/server/routes.go
	r := server.SetupRoutes()

	// Start the web server
	log.Println("Server started on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r)) // Start listening for HTTP requests
}
