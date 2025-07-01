// Helper: Find GCD
function gcd(a, b) {
  if (b === 0) return a;
  return gcd(b, a % b);
}

// Helper: Find Modular Inverse (d ≡ e⁻¹ mod φ)
function modInverse(e, phi) {
  let [a, b, x0, x1] = [phi, e, 0, 1];
  while (b !== 0) {
    let q = Math.floor(a / b);
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  return (x0 + phi) % phi;
}

// Helper: Modular exponentiation (base^exp % mod)
function modPow(base, exp, mod) {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return result;
}

// Generate keys with small primes
function generateKeys() {
  const p = 61; // small prime
  const q = 53; // another small prime
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  let e = 17; // must be coprime with phi

  while (gcd(e, phi) !== 1) e++; // ensure e is valid

  const d = modInverse(e, phi);

  return {
    publicKey: { e, n },
    privateKey: { d, n },
  };
}

// Encrypt a numeric message (e.g., charCode)
function encrypt(message, publicKey) {
  return modPow(message, publicKey.e, publicKey.n);
}

// Decrypt the ciphertext
function decrypt(cipher, privateKey) {
  return modPow(cipher, privateKey.d, privateKey.n);
}

// Encrypt an entire string (e.g., "Alice") into array of numbers
function encryptString(str, publicKey) {
  const encrypted = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i); // convert to number
    encrypted.push(encrypt(charCode, publicKey)); // encrypt each character
  }
  return encrypted;
}

// Decrypt an array of encrypted numbers back into a string
function decryptString(cipherArray, privateKey) {
  let decrypted = "";
  for (let i = 0; i < cipherArray.length; i++) {
    const charCode = decrypt(cipherArray[i], privateKey);
    decrypted += String.fromCharCode(charCode); // convert to character
  }
  return decrypted;
}

module.exports = {
  generateKeys,
  encrypt,
  decrypt,
  encryptString,
  decryptString,
};
