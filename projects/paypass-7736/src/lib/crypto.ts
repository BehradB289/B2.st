import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_FALLBACK_SECRET = "b2st_paypass_master_aes256_super_key_32bytes!!";

function getMasterKey(): Buffer {
  const secret = process.env.PAYPASS_AES_KEY || DEFAULT_FALLBACK_SECRET;
  // Derive a reliable 32-byte key
  return crypto.scryptSync(secret, "b2st-paypass-salt-v1", 32);
}

/**
 * Encrypt sensitive content with AES-256-GCM
 * Output format: [ivHex]:[authTagHex]:[ciphertextHex]
 */
export function encryptContent(plainText: string): string {
  if (!plainText) {
    throw new Error("Plain text cannot be empty for encryption");
  }

  const iv = crypto.randomBytes(16);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt content using AES-256-GCM.
 * Validates integrity via AuthTag to prevent tampering.
 */
export function decryptContent(encryptedPayload: string): string {
  if (!encryptedPayload) {
    throw new Error("Encrypted payload is missing");
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getMasterKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}