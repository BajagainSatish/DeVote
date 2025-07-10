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

func HandleUserLogin(w http.ResponseWriter, r *http.Request) {
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
	type RegisterRequest struct {
		VoterID  string `json:"voterId"`
		Name     string `json:"name"`
		DOB      string `json:"dob"`
		Location string `json:"location"`
		Email    string `json:"email"`
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Step 1: Load government voter database
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		http.Error(w, "Could not load voter database", http.StatusInternalServerError)
		return
	}

	voter, exists := db.Records[req.VoterID]
	if !exists || voter.Name != req.Name || voter.DOB != req.DOB || voter.Location != req.Location || voter.Email != req.Email {
		http.Error(w, "Voter details do not match government records", http.StatusUnauthorized)
		return
	}

	// Step 2: Load already registered users
	registered, err := contracts.LoadRegisteredUsers()
	if err != nil {
		http.Error(w, "Could not load registered users", http.StatusInternalServerError)
		return
	}

	// Check if already registered
	for _, u := range registered {
		if u.VoterID == req.VoterID {
			http.Error(w, "VoterID is already registered", http.StatusConflict)
			return
		}
		if u.Email == req.Email {
			http.Error(w, "Voter Email is already registered", http.StatusConflict)
			return
		}
	}

	// Step 3: Generate credentials
	username := "voter_" + req.VoterID
	password, err := contracts.GenerateSecurePassword(8)
	if err != nil {
		http.Error(w, "Password generation failed", http.StatusInternalServerError)
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
		http.Error(w, "Failed to save credentials", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"username": username,
		"password": password,
	})
}
