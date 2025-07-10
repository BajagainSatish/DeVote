package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("super-secret-admin-key") // for simplicity, change this later
var currentValidToken string                  // in-memory storage for now

// Admin credentials
const adminUsername = "admin"
const adminPassword = "admin123" // change later

type AdminLoginRequest struct {
	Username string
	Password string
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Admin login route
func HandleAdminLogin(w http.ResponseWriter, r *http.Request) {
	var creds AdminLoginRequest
	_ = json.NewDecoder(r.Body).Decode(&creds)

	if creds.Username != adminUsername || creds.Password != adminPassword {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(1 * time.Minute)

	claims := &Claims{
		Username: creds.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(jwtKey)
	currentValidToken = tokenString // Invalidate old token
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
