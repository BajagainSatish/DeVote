package server

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type key string

const userKey key = "user"

// AuthMiddleware ensures that only requests with valid JWT proceed.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		if !token.Valid || claims.ExpiresAt.Time.Before(time.Now()) {
			http.Error(w, "Token expired or invalid", http.StatusUnauthorized)
			return
		}

		if tokenStr != currentValidToken {
			http.Error(w, "This token has been invalidated due to re-login", http.StatusUnauthorized)
			return
		}

		// attached user to context
		ctx := context.WithValue(r.Context(), userKey, claims.Username)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
