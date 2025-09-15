import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

export class InputSanitizer {
  /**
   * Sanitize order ID
   */
  static sanitizeOrderId(orderId: string): string {
    return orderId.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 50);
  }

  /**
   * Sanitize object properties
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = DOMPurify.sanitize(value);
      } else if (typeof value === "object") {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitize text content
   */
  static sanitizeText(text: string): string {
    return DOMPurify.sanitize(text);
  }

  /**
   * Sanitize merchant name
   */
  static sanitizeMerchantName(name: string): string {
    return DOMPurify.sanitize(name).slice(0, 100);
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html);
  }
}

export class SecureValidator {
  /**
   * Validate UTR format
   */
  static validateUTR(utr: string): {
    isValid: boolean;
    sanitized?: string;
    error?: string;
  } {
    try {
      const sanitized = utr.trim().replace(/[^a-zA-Z0-9]/g, "");

      if (sanitized.length < 8 || sanitized.length > 20) {
        return {
          isValid: false,
          error: "UTR must be between 8 and 20 characters",
        };
      }

      return {
        isValid: true,
        sanitized,
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid UTR format",
      };
    }
  }

  /**
   * Validate amount
   */
  static validateAmount(amount: number): {
    isValid: boolean;
    sanitized?: number;
    error?: string;
  } {
    try {
      if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
        return {
          isValid: false,
          error: "Amount must be between 1 and 100000",
        };
      }

      return {
        isValid: true,
        sanitized: amount,
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid amount",
      };
    }
  }

  /**
   * Validate VPA format
   */
  static validateVPA(vpa: string): {
    isValid: boolean;
    sanitized?: string;
    error?: string;
  } {
    try {
      const sanitized = vpa.trim();
      
      if (!/^[\w.-]+@[\w.-]+$/.test(sanitized)) {
        return {
          isValid: false,
          error: "Invalid VPA format",
        };
      }

      return {
        isValid: true,
        sanitized,
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid VPA format",
      };
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }
}
