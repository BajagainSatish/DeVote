// // anonClient.js (browser)
// async function fetchPubKey() {
//     const res = await fetch('/pubkey')
//     const j = await res.json()
//     // j.nHex (hex), j.eHex (hex)
//     return { nHex: j.nHex, eHex: j.eHex }
// }

// // Converts hex string to BigInt
// function hexToBigInt(hex) {
//     return BigInt('0x' + hex)
// }
// function bigIntToHex(b) {
//     let h = b.toString(16)
//     if (h.length % 2) h = '0' + h
//     return h
// }

// // Modular exponentiation for BigInt
// function modPow(base, exp, mod) {
//     let result = 1n
//     base = base % mod
//     while (exp > 0) {
//         if (exp & 1n) result = (result * base) % mod
//         exp = exp >> 1n
//         base = (base * base) % mod
//     }
//     return result
// }

// // Compute SHA-256 digest of string -> ArrayBuffer
// async function sha256Bytes(str) {
//     const enc = new TextEncoder()
//     const data = enc.encode(str)
//     const hashBuf = await crypto.subtle.digest('SHA-256', data)
//     return new Uint8Array(hashBuf)
// }

// // Client-side blind: given ballot string and pubkey (n,e), return {blindedHex, rHex, r}
// async function blindMessage(ballot, nHex, eDec) {
//     const n = hexToBigInt(nHex)
//     const e = BigInt(eDec)

//     // message representative = SHA256(ballot) as big-int
//     const hBytes = await sha256Bytes(ballot)
//     let m = 0n
//     for (const b of hBytes) {
//         m = (m << 8n) + BigInt(b)
//     }

//     // pick random r in (1, n-1) with gcd(r,n)=1
//     let r
//     do {
//         // random bytes of same length as n
//         const nLen = Math.ceil(n.toString(16).length / 2)
//         const randBytes = new Uint8Array(nLen)
//         crypto.getRandomValues(randBytes)
//         // convert to BigInt
//         r = 0n
//         for (const b of randBytes) r = (r << 8n) + BigInt(b)
//         r = r % n
//     } while (r <= 1n || r >= n - 1n || gcdBigInt(r, n) !== 1n)

//     // blinded = m * r^e mod n
//     const rPowE = modPow(r, e, n)
//     const blinded = (m * rPowE) % n

//     return { blindedHex: bigIntToHex(blinded), r, m }
// }

// // Unblind: client receives signedBlinded (hex) from server, return signature hex on original message
// function unblindSignature(signedBlindedHex, r, nHex) {
//     const sPrime = hexToBigInt(signedBlindedHex)
//     const n = hexToBigInt(nHex)
//     // unblinded = s' * r^{-1} mod n
//     const rInv = modInverseBigInt(r, n)
//     const s = (sPrime * rInv) % n
//     return bigIntToHex(s)
// }

// // helper gcd and mod inverse for BigInt
// function gcdBigInt(a, b) {
//     while (b) {
//         const t = b
//         b = a % b
//         a = t
//     }
//     return a
// }
// function modInverseBigInt(a, m) {
//     // extended Euclid
//     let m0 = m
//     let x0 = 0n, x1 = 1n
//     if (m == 1n) return 0n
//     while (a > 1n) {
//         let q = a / m
//         let t = m
//         m = a % m
//         a = t
//         t = x0
//         x0 = x1 - q * x0
//         x1 = t
//     }
//     if (x1 < 0n) x1 += m0
//     return x1
// }