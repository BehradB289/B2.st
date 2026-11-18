const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const SECRET = "b2st_paypass_master_aes256_super_key_32bytes!!";
const KEY = crypto.scryptSync(SECRET, "b2st-paypass-salt-v1", 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decrypt(cipherText) {
  const [ivHex, authTagHex, encrypted] = cipherText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Test Suite
console.log("=== PayPass AES-256-GCM Verification Test ===");
const sampleData = "https://t.me/+B2st_VIP_AI_Prompt_Engineering_Secret_Vault";

const encrypted = encrypt(sampleData);
console.log("[+] Encrypted Payload Format:", encrypted);

const decrypted = decrypt(encrypted);
console.log("[+] Decrypted Result:", decrypted);

if (sampleData === decrypted) {
  console.log("[\x1b[32mPASS\x1b[0m] Cryptographic integrity validated successfully!");
} else {
  console.error("[\x1b[31mFAIL\x1b[0m] Decrypted content mismatch!");
  process.exit(1);
}