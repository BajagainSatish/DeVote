//internal/server/auth.go

package server

import (
	"e-voting-blockchain/contracts"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
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

	// Step 1: Load government voter database
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

	// Step 2: Load already registered users
	registered, err := contracts.LoadRegisteredUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Could not load registered users"})
		return
	}

	// Check if already registered
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

	// Step 3: Generate credentials
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

	json.NewEncoder(w).Encode(map[string]string{
		"username": username,
		"password": password,
	})
}

func HandleForgotPassword(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type ForgotRequest struct {
		Email string `json:"email"`
	}

	var req ForgotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	users, err := contracts.LoadRegisteredUsers()
	if err != nil {
		fmt.Println("Error loading users:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load users"})
		return
	}

	var user *contracts.RegisteredUser
	for i, u := range users {
		if u.Email == req.Email {
			user = &users[i]
			break
		}
	}

	if user == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email not found"})
		return
	}

	// generate a secure reset token
	token, err := contracts.GenerateSecurePassword(32)
	if err != nil {
		fmt.Println("Error generating token:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	user.ResetToken = token
	user.ResetTokenExpiry = time.Now().Add(15 * time.Minute)

	if err := contracts.SaveRegisteredUsers(users); err != nil {
		fmt.Println("Error saving users:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save token"})
		return
	}

	resetLink := "http://localhost:5173/reset-password/" + token

	// Mailtrap SMTP setup
	smtpHost := "sandbox.smtp.mailtrap.io"
	smtpPort := "2525"
	smtpUser := "022d81c9828f4a"
	smtpPass := "889e88969308e9"

	fmt.Println("SMTP Config:", smtpHost, smtpPort, smtpUser)

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	to := []string{user.Email}
	msg := []byte(
		"To: " + user.Email + "\r\n" +
			"Subject: DeVote Password Reset\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
			"\r\n" +
			"<html>" +
			"<body>" +
			"<p>Click the button below to reset your password. This link will expire in 15 minutes.</p>" +
			"<a href='" + resetLink + "' style='display:inline-block;padding:10px 20px;font-size:16px;" +
			"color:#ffffff;background-color:#007bff;text-decoration:none;border-radius:5px;'>Reset Password</a>" +
			"<p>If you did not request this, please ignore this email.</p>" +
			"</body>" +
			"</html>",
	)

	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, "noreply@devote.com", to, msg)
	if err != nil {
		fmt.Println("SMTP send error:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to send email: " + err.Error()})
		return
	}

	fmt.Println("Reset email sent successfully to:", user.Email)
	json.NewEncoder(w).Encode(map[string]string{"message": "Reset link sent to your email"})
}

func HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type ResetRequest struct {
		Token       string `json:"token"`
		NewPassword string `json:"newPassword"`
	}

	var req ResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	users, err := contracts.LoadRegisteredUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load users"})
		return
	}

	var user *contracts.RegisteredUser
	for i, u := range users {
		if u.ResetToken == req.Token && time.Now().Before(u.ResetTokenExpiry) {
			user = &users[i]
			break
		}
	}

	if user == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
		return
	}

	user.Password = req.NewPassword
	user.ResetToken = ""
	user.ResetTokenExpiry = time.Time{}

	if err := contracts.SaveRegisteredUsers(users); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save new password"})
		return
	}

	// send confirmation email
	smtpHost := "sandbox.smtp.mailtrap.io"
	smtpPort := "2525"
	smtpUser := "022d81c9828f4a"
	smtpPass := "889e88969308e9"

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	to := []string{user.Email}
	msg := []byte(
		"To: " + user.Email + "\r\n" +
			"Subject: DeVote Password Changed\r\n" +
			"\r\n" +
			"Hello, your password has been successfully updated.\n" +
			"If you did not request this change, please contact support immediately.\n",
	)

	_ = smtp.SendMail(smtpHost+":"+smtpPort, auth, "noreply@devote.com", to, msg)

	json.NewEncoder(w).Encode(map[string]string{"message": "Password reset successful. Confirmation email sent."})
}
