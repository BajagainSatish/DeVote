package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"

	"e-voting-blockchain/internal/server"
)

// BlindMessageHashed blinds a message using SHA-256 hash and a random blinding factor
func BlindMessageHashed(message string, pubKey *rsa.PublicKey) (blindedHex string, unblinder *big.Int, err error) {
	hash := sha256.Sum256([]byte(message))
	m := new(big.Int).SetBytes(hash[:])

	// random blinding factor r < N
	r, err := rand.Int(rand.Reader, pubKey.N)
	if err != nil {
		return "", nil, err
	}

	// blinded = m * r^e mod N
	e := big.NewInt(int64(pubKey.E))
	rExpE := new(big.Int).Exp(r, e, pubKey.N)
	blinded := new(big.Int).Mul(m, rExpE)
	blinded.Mod(blinded, pubKey.N)

	return hex.EncodeToString(blinded.Bytes()), r, nil
}

// UnblindSignature converts the blind signature to a normal signature
func UnblindSignature(blindSigHex string, r *big.Int, pubKey *rsa.PublicKey) (string, error) {
	sigBytes, err := hex.DecodeString(blindSigHex)
	if err != nil {
		return "", err
	}

	sigInt := new(big.Int).SetBytes(sigBytes)

	rInv := new(big.Int).ModInverse(r, pubKey.N)
	if rInv == nil {
		return "", fmt.Errorf("failed to compute modular inverse")
	}

	unblinded := new(big.Int).Mul(sigInt, rInv)
	unblinded.Mod(unblinded, pubKey.N)

	return hex.EncodeToString(unblinded.Bytes()), nil
}

func TestBlindSignatureFlow() {
	// Step 1: Generate RSA key (or use your server's privateKey)
	pubKey := server.GetPublicKey()

	// Step 2: Dummy vote/message
	message := "candidate_1"

	// Step 3: Blind the message
	blindedHex, r, err := BlindMessageHashed(message, pubKey)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Blinded message (hex):", blindedHex)

	// Step 4: Issue blind signature using your server method
	signedHex, err := server.IssueBlindSignatureForBlindedHexHex(blindedHex)
	if err != nil {
		log.Fatal("failed to sign:", err)
	}
	fmt.Println("Blind signature (hex):", signedHex)

	// Step 5: Unblind the signature
	unblindedHex, err := UnblindSignature(signedHex, r, pubKey)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Unblinded signature (hex):", unblindedHex)

	// Step 6: Verify signature manually (raw modular exponentiation)
	messageHash := sha256.Sum256([]byte(message))
	mInt := new(big.Int).SetBytes(messageHash[:])
	sigBytes, _ := hex.DecodeString(unblindedHex)
	sigInt := new(big.Int).SetBytes(sigBytes)

	verified := new(big.Int).Exp(sigInt, big.NewInt(int64(pubKey.E)), pubKey.N)
	if verified.Cmp(mInt) == 0 {
		fmt.Println("Signature successfully verified!")
	} else {
		fmt.Println("Signature verification failed")
	}
}

func main() {
	TestBlindSignatureFlow()
}
