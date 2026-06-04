// Real AES-256-GCM encryption/decryption using the Web Crypto API

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/** Helper: get a clean ArrayBuffer from a Uint8Array (no shared/offset issues) */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(arr);
  return buf;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an ArrayBuffer with a password.
 * Returns Uint8Array: [salt (16)] [iv (12)] [ciphertext+authTag]
 */
export async function encryptFile(
  data: ArrayBuffer,
  password: string,
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  onProgress?.(5);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  onProgress?.(15);
  const key = await deriveKey(password, toArrayBuffer(salt));

  onProgress?.(30);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    data
  );

  onProgress?.(85);

  const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, SALT_LENGTH);
  result.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  onProgress?.(100);
  return result;
}

/**
 * Decrypt an encrypted blob produced by encryptFile.
 * Accepts a Uint8Array. Returns the decrypted ArrayBuffer.
 */
export async function decryptFile(
  encryptedData: Uint8Array,
  password: string,
  onProgress?: (pct: number) => void
): Promise<ArrayBuffer> {
  onProgress?.(10);

  // Ensure we have a proper Uint8Array with its own backing buffer
  const data = new Uint8Array(encryptedData);

  // Extract salt, iv, ciphertext as separate clean ArrayBuffers
  const saltBytes = data.slice(0, SALT_LENGTH);
  const ivBytes = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertextBytes = data.slice(SALT_LENGTH + IV_LENGTH);

  onProgress?.(25);
  const key = await deriveKey(password, toArrayBuffer(saltBytes));

  onProgress?.(50);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(ivBytes) },
    key,
    toArrayBuffer(ciphertextBytes)
  );

  onProgress?.(100);
  return plaintext;
}
