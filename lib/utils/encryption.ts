import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-32-chars-long-please";
const ALGORITHM = "aes-256-cbc";

export class SensitiveDataHandler {
  /**
   * Encrypt sensitive data like UTR
   */
  static async encryptUTR(utr: string): Promise<string> {
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      let encrypted = cipher.update(utr, "utf8", "hex");
      encrypted += cipher.final("hex");

      return `${iv.toString("hex")}:${encrypted}`;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data like UTR
   */
  static async decryptUTR(encryptedUTR: string): Promise<string> {
    try {
      const [ivHex, encrypted] = encryptedUTR.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Mask UTR for display purposes
   */
  static maskUTR(utr: string): string {
    if (!utr || utr.length < 4) return "****";
    return `${utr.slice(0, 2)}${"*".repeat(utr.length - 4)}${utr.slice(-2)}`;
  }
}
