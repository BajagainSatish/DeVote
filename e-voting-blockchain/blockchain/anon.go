// anon.go
package blockchain

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"sync"
)

// RSA blind-signature utilities.
// We store the authority key pair in memory (for demo). In prod, protect the private key and load from disk or HSM.

var (
	authorityPriv *rsa.PrivateKey
	authorityPubN *big.Int
	authorityPubE int
	anonMutex     sync.RWMutex
)

// InitAuthorityKeys generates an RSA keypair (or load from file in prod).
func InitAuthorityKeys(bits int) error {
	anonMutex.Lock()
	defer anonMutex.Unlock()

	if authorityPriv != nil {
		return nil
	}
	priv, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return err
	}
	authorityPriv = priv
	authorityPubN = priv.PublicKey.N
	authorityPubE = priv.PublicKey.E
	return nil
}

// ExportAuthorityPublicKey returns the public key components needed by clients (n, e) as hex strings.
func ExportAuthorityPublicKey() (nHex, eHex string) {
	anonMutex.RLock()
	defer anonMutex.RUnlock()
	if authorityPriv == nil {
		return "", ""
	}
	return hex.EncodeToString(authorityPubN.Bytes()), fmt.Sprintf("%x", authorityPubE)
}

// BlindMessage: client-side needs to compute blinded message with public key. We'll provide server-side blind sign only.
func BlindSign(blindedMsg *big.Int) (*big.Int, error) {
	anonMutex.RLock()
	defer anonMutex.RUnlock()

	if authorityPriv == nil {
		return nil, errors.New("authority keys not initialized")
	}

	// RSASP1 on blinded message: s' = (blindedMsg)^d mod n
	sig := new(big.Int).Exp(blindedMsg, authorityPriv.D, authorityPubN)
	return sig, nil
}

// VerifySignature verifies RSA signature (PKCS1v1.5 style but we use raw message hashing comparison).
// We'll hash the message and verify signature by modular exponentiation to obtain message representative.
func VerifySignature(message []byte, signatureBytes []byte) bool {
	anonMutex.RLock()
	defer anonMutex.RUnlock()
	if authorityPriv == nil {
		return false
	}

	// For simplicity we sign the SHA-256 digest as a big.Int representative of the digest.
	h := sha256.Sum256(message)
	mInt := new(big.Int).SetBytes(h[:])

	sigInt := new(big.Int).SetBytes(signatureBytes)

	// m' = sig^e mod n
	mPrime := new(big.Int).Exp(sigInt, big.NewInt(int64(authorityPubE)), authorityPubN)

	// Compare mPrime (maybe trimmed) to mInt. Because we're using raw modular exponent on hash, compare bytes.
	return compareBigIntBytes(mPrime, mInt)
}

func compareBigIntBytes(a, b *big.Int) bool {
	ab := a.Bytes()
	bb := b.Bytes()
	// Left-pad shorter with zeros
	if len(ab) < len(bb) {
		pad := make([]byte, len(bb)-len(ab))
		ab = append(pad, ab...)
	}
	if len(bb) < len(ab) {
		pad := make([]byte, len(ab)-len(bb))
		bb = append(pad, bb...)
	}
	for i := 0; i < len(ab); i++ {
		if ab[i] != bb[i] {
			return false
		}
	}
	return true
}
