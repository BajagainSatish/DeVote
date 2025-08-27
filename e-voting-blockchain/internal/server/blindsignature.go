package server

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/hex"
	"math/big"
)

// You can store this somewhere globally in your api.go
var privateKey *rsa.PrivateKey //made public(to other code) for testing purposes

func init() {
	var err error
	privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic("Failed to generate RSA key: " + err.Error())
	}
}

// IssueBlindSignatureForBlindedHexHex signs the blinded value and returns a hex string
func IssueBlindSignatureForBlindedHexHex(blindedHex string) (string, error) {
	blindedBytes, err := hex.DecodeString(blindedHex)
	if err != nil {
		return "", err
	}

	m := new(big.Int).SetBytes(blindedBytes)

	signed := new(big.Int).Exp(m, privateKey.D, privateKey.N)

	return hex.EncodeToString(signed.Bytes()), nil
}

// Getter function
func GetPublicKey() *rsa.PublicKey {
	return &privateKey.PublicKey
}
