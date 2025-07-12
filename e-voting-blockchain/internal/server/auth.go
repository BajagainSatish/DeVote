package server

import (
	"e-voting-blockchain/contracts"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("super-secret-admin-key") // for simplicity, change this later
var currentValidToken string                  // in-memory storage for now

// Admin credentials
const adminUsername = "admin@devote.com" // Change this to match frontend
const adminPassword = "admin123"

type AdminLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Admin login route
func HandleAdminLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type LoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	// Simple admin validation - replace with your actual logic
	if req.Username == "admin@devote.com" && req.Password == "admin123" {
		// Generate a simple token (in production, use JWT)
		token := "admin_token_" + time.Now().Format("20060102150405")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": token,
			"user": map[string]string{
				"username": req.Username,
				"role":     "admin",
			},
			"message": "Login successful",
		})
	} else {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
	}
}

func HandleUserLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type UserLoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	var creds UserLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid input"})
		return
	}

	// Load registered users
	registeredUsers, err := contracts.LoadRegisteredUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to load registered users"})
		return
	}

	// Validate credentials strictly with username/password only
	valid := false
	for _, user := range registeredUsers {
		if user.Username == creds.Username && user.Password == creds.Password {
			valid = true
			break
		}
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid credentials"})
		return
	}

	// create jwt token
	expirationTime := time.Now().Add(1 * time.Hour)
	claims := &Claims{
		Username: creds.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(jwtKey)
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

// HandleUserRegister registers a new voter
func HandleUserRegister(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type RegisterRequest struct {
		VoterID  string `json:"voterId"`
		Name     string `json:"name"`
		DOB      string `json:"dob"`
		Location string `json:"location"`
		Email    string `json:"email"`
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid input"})
		return
	}

	// Validate against government database
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Could not load voter database"})
		return
	}

	voter, exists := db.Records[req.VoterID]
	if !exists || voter.Name != req.Name || voter.DOB != req.DOB || voter.Location != req.Location || voter.Email != req.Email {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Voter details do not match government records"})
		return
	}

	// Check if already registered
	registered, err := contracts.LoadRegisteredUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Could not load registered users"})
		return
	}

	for _, u := range registered {
		if u.VoterID == req.VoterID {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{"error": "VoterID is already registered"})
			return
		}
		if u.Email == req.Email {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{"error": "Voter Email is already registered"})
			return
		}
	}

	// Generate credentials
	username := "voter_" + req.VoterID
	password, err := contracts.GenerateSecurePassword(8)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Password generation failed"})
		return
	}

	newUser := contracts.RegisteredUser{
		Username: username,
		Password: password,
		VoterID:  req.VoterID,
		Email:    req.Email,
	}
	registered = append(registered, newUser)

	if err := contracts.SaveRegisteredUsers(registered); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save credentials"})
		return
	}

	// Log to blockchain
	blockchainLogger.LogVoterRegistration(req.VoterID, req.Email, r)

	json.NewEncoder(w).Encode(map[string]string{
		"username": username,
		"password": password,
	})
}
