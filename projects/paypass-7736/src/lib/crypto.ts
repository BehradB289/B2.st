import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// Fallback key provided for zero-config test environments; MUST be replaced in production
const SECRET_KEY = Buffer.from(
  (process.env.PAYPASS_SECRET_KEY || "e8a0f95b583f71c4c9528f8f0412803b9b46e3dca18b6ecba59218d6e3c847a1").padEnd(64, "0").slice(0, 64),
  "hex"
);

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts plain text using AES-256-GCM.
 */
export function encryptContent(plainText: string): EncryptedPayload {
  const iv = crypto.randomBytes(12); // Standard 96-bit nonce for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the IV and authentication tag.
 */
export function decryptContent(ciphertext: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}