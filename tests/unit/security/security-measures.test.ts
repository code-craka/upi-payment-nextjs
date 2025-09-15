import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import { CSRFProtection } from "@/lib/utils/csrf-protection";
import { DataEncryption, SensitiveDataHandler } from "@/lib/utils/encryption";
import { InputSanitizer, SecureValidator } from "@/lib/utils/sanitization";

describe("Security Measures", () => {
  describe("Rate Limiting", () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });
    });

    it("should allow requests within rate limit", async () => {
      const mockRequest = {
        ip: "127.0.0.1",
        headers: new Map([["user-agent", "test-agent"]]),
      } as any;

      const result = await rateLimiter.isAllowed(mockRequest);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should block requests exceeding rate limit", async () => {
      const mockRequest = {
        ip: "127.0.0.1",
        headers: new Map([["user-agent", "test-agent"]]),
      } as any;

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed(mockRequest);
      }

      const result = await rateLimiter.isAllowed(mockRequest);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("CSRF Protection", () => {
    it("should generate valid CSRF tokens", () => {
      const token = CSRFProtection.generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should validate matching CSRF tokens", () => {
      const token = CSRFProtection.generateToken();
      const mockRequest = {
        headers: new Map([["x-csrf-token", token]]),
        cookies: new Map(),
      } as any;

      const isValid = CSRFProtection.validateToken(mockRequest, token);
      expect(isValid).toBe(true);
    });

    it("should reject invalid CSRF tokens", () => {
      const token = CSRFProtection.generateToken();
      const invalidToken = "invalid-token";
      const mockRequest = {
        headers: new Map([["x-csrf-token", invalidToken]]),
        cookies: new Map(),
      } as any;

      const isValid = CSRFProtection.validateToken(mockRequest, token);
      expect(isValid).toBe(false);
    });

    it("should identify methods requiring CSRF protection", () => {
      expect(CSRFProtection.requiresProtection("POST")).toBe(true);
      expect(CSRFProtection.requiresProtection("PUT")).toBe(true);
      expect(CSRFProtection.requiresProtection("DELETE")).toBe(true);
      expect(CSRFProtection.requiresProtection("GET")).toBe(false);
    });
  });

  describe("Data Encryption", () => {
    it("should encrypt and decrypt data correctly", async () => {
      const plaintext = "sensitive-data-123";

      const encrypted = await DataEncryption.encrypt(plaintext);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle UTR encryption/decryption", async () => {
      const utr = "123456789012";

      const encrypted = await SensitiveDataHandler.encryptUTR(utr);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(utr);

      const decrypted = await SensitiveDataHandler.decryptUTR(encrypted);
      expect(decrypted).toBe(utr);
    });

    it("should mask sensitive data for logging", () => {
      const utr = "123456789012";
      const masked = SensitiveDataHandler.maskUTR(utr);
      expect(masked).toBe("12********12");
      expect(masked).not.toBe(utr);

      const vpa = "user@paytm";
      const maskedVpa = SensitiveDataHandler.maskVPA(vpa);
      expect(maskedVpa).toBe("us**@paytm");
      expect(maskedVpa).not.toBe(vpa);
    });

    it("should create and verify hashes", async () => {
      const data = "test-data";

      const hash = await DataEncryption.hash(data);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(data);

      const isValid = await DataEncryption.verifyHash(data, hash);
      expect(isValid).toBe(true);

      const isInvalid = await DataEncryption.verifyHash("wrong-data", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML content", () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = InputSanitizer.sanitizeHTML(maliciousInput);
      expect(sanitized).toBe("Hello");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize text input", () => {
      const maliciousInput = 'Hello<script>alert("xss")</script>World';
      const sanitized = InputSanitizer.sanitizeText(maliciousInput);
      expect(sanitized).toBe("HelloWorld");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize merchant names", () => {
      const input = 'Test Merchant <script>alert("xss")</script>';
      const sanitized = InputSanitizer.sanitizeMerchantName(input);
      expect(sanitized).toBe("Test Merchant");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize UTR numbers", () => {
      const input = "ABC123XYZ789!@#";
      const sanitized = InputSanitizer.sanitizeUTR(input);
      expect(sanitized).toBe("ABC123XYZ789");
      expect(sanitized).toMatch(/^[A-Z0-9]{12}$/);
    });

    it("should sanitize VPA addresses", () => {
      const input = "USER@PAYTM<script>";
      const sanitized = InputSanitizer.sanitizeVPA(input);
      expect(sanitized).toBe("user@paytm");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize amounts", () => {
      expect(InputSanitizer.sanitizeAmount("100.50")).toBe(100.5);
      expect(InputSanitizer.sanitizeAmount("invalid")).toBe(0);
      expect(InputSanitizer.sanitizeAmount(-50)).toBe(0);
      expect(InputSanitizer.sanitizeAmount(100.999)).toBe(101);
    });

    it("should sanitize objects recursively", () => {
      const maliciousObject = {
        name: 'Test<script>alert("xss")</script>',
        amount: "100.50",
        nested: {
          value: "Hello<script>World",
        },
      };

      const sanitized = InputSanitizer.sanitizeObject(maliciousObject);
      expect(sanitized.name).toBe("Test");
      expect(sanitized.amount).toBe("100.50");
      expect(sanitized.nested.value).toBe("HelloWorld");
    });
  });

  describe("Secure Validators", () => {
    it("should validate UTR format", () => {
      const validUTR = "123456789012";
      const result = SecureValidator.validateUTR(validUTR);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(validUTR);

      const invalidUTR = "12345";
      const invalidResult = SecureValidator.validateUTR(invalidUTR);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("12 characters");
    });

    it("should validate VPA format", () => {
      const validVPA = "user@paytm";
      const result = SecureValidator.validateVPA(validVPA);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(validVPA);

      const invalidVPA = "invalid-vpa";
      const invalidResult = SecureValidator.validateVPA(invalidVPA);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("Invalid VPA format");
    });

    it("should validate amounts", () => {
      const validAmount = 100.5;
      const result = SecureValidator.validateAmount(validAmount);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(validAmount);

      const invalidAmount = -50;
      const invalidResult = SecureValidator.validateAmount(invalidAmount);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("greater than 0");

      const tooLargeAmount = 200000;
      const largeResult = SecureValidator.validateAmount(tooLargeAmount);
      expect(largeResult.isValid).toBe(false);
      expect(largeResult.error).toContain("cannot exceed");
    });
  });
});
