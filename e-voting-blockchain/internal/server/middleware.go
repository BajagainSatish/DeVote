package server

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type key string

const userKey key = "user"

// AuthMiddleware ensures that only requests with valid JWT proceed.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("AuthMiddleware: %s %s", r.Method, r.URL.Path)

		// Handle preflight requests - let them pass through
		if r.Method == "OPTIONS" {
			log.Println("AuthMiddleware: Handling OPTIONS request")
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		authHeader := r.Header.Get("Authorization")
		log.Printf("AuthMiddleware: Authorization header: %s", authHeader)

		if authHeader == "" {
			log.Println("AuthMiddleware: No authorization header")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authorization header required"})
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
			log.Printf("AuthMiddleware: Extracted token: %s", tokenString)
		} else {
			log.Println("AuthMiddleware: Invalid authorization format")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid authorization format"})
			return
		}

		// Validate token
		if !isValidToken(tokenString) {
			log.Printf("AuthMiddleware: Invalid token: %s", tokenString)
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
			return
		}

		log.Println("AuthMiddleware: Token valid, proceeding to handler")
		next.ServeHTTP(w, r)
	})
}

// Simple token validation - replace with your actual implementation
func isValidToken(token string) bool {
	valid := strings.HasPrefix(token, "admin_token_") && len(token) > 15
	log.Printf("isValidToken: %s -> %v", token, valid)
	return valid
}
