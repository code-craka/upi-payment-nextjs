import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  authenticateRequest,
  requireAdmin,
  requireMerchant,
} from "@/lib/auth/utils";

// Mock Clerk
jest.mock("@clerk/nextjs/server");

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("Authentication and Authorization Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticateRequest", () => {
    it("should authenticate valid user", async () => {
      mockAuth.mockResolvedValue({
        userId: "user-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/test");
      const authResult = await authenticateRequest(request);

      expect(authResult.userId).toBe("user-123");
      expect(authResult.sessionClaims?.metadata?.role).toBe("merchant");
    });

    it("should throw error for unauthenticated user", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest("http://localhost:3000/api/test");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("should handle missing session claims", async () => {
      mockAuth.mockResolvedValue({
        userId: "user-123",
        sessionClaims: null,
      } as any);

      const request = new NextRequest("http://localhost:3000/api/test");
      const authResult = await authenticateRequest(request);

      expect(authResult.userId).toBe("user-123");
      expect(authResult.sessionClaims).toBeNull();
    });
  });

  describe("requireAdmin", () => {
    it("should allow admin users", () => {
      const authResult = {
        userId: "admin-123",
        sessionClaims: {
          metadata: { role: "admin" },
        },
      };

      expect(() => requireAdmin(authResult as any)).not.toThrow();
    });

    it("should reject non-admin users", () => {
      const authResult = {
        userId: "user-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      };

      expect(() => requireAdmin(authResult as any)).toThrow(
        "Admin access required"
      );
    });

    it("should reject users without role metadata", () => {
      const authResult = {
        userId: "user-123",
        sessionClaims: {
          metadata: {},
        },
      };

      expect(() => requireAdmin(authResult as any)).toThrow(
        "Admin access required"
      );
    });

    it("should reject users without session claims", () => {
      const authResult = {
        userId: "user-123",
        sessionClaims: null,
      };

      expect(() => requireAdmin(authResult as any)).toThrow(
        "Admin access required"
      );
    });
  });

  describe("requireMerchant", () => {
    it("should allow merchant users", () => {
      const authResult = {
        userId: "merchant-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      };

      expect(() => requireMerchant(authResult as any)).not.toThrow();
    });

    it("should allow admin users (admin can access merchant features)", () => {
      const authResult = {
        userId: "admin-123",
        sessionClaims: {
          metadata: { role: "admin" },
        },
      };

      expect(() => requireMerchant(authResult as any)).not.toThrow();
    });

    it("should reject viewer users", () => {
      const authResult = {
        userId: "viewer-123",
        sessionClaims: {
          metadata: { role: "viewer" },
        },
      };

      expect(() => requireMerchant(authResult as any)).toThrow(
        "Merchant access required"
      );
    });

    it("should reject users without role metadata", () => {
      const authResult = {
        userId: "user-123",
        sessionClaims: {
          metadata: {},
        },
      };

      expect(() => requireMerchant(authResult as any)).toThrow(
        "Merchant access required"
      );
    });
  });

  describe("Role-based API Access Integration", () => {
    it("should allow admin to access admin endpoints", async () => {
      mockAuth.mockResolvedValue({
        userId: "admin-123",
        sessionClaims: {
          metadata: { role: "admin" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const authResult = await authenticateRequest(request);

      expect(() => requireAdmin(authResult)).not.toThrow();
    });

    it("should prevent merchant from accessing admin endpoints", async () => {
      mockAuth.mockResolvedValue({
        userId: "merchant-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const authResult = await authenticateRequest(request);

      expect(() => requireAdmin(authResult)).toThrow("Admin access required");
    });

    it("should allow merchant to access merchant endpoints", async () => {
      mockAuth.mockResolvedValue({
        userId: "merchant-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      expect(() => requireMerchant(authResult)).not.toThrow();
    });

    it("should prevent viewer from accessing merchant endpoints", async () => {
      mockAuth.mockResolvedValue({
        userId: "viewer-123",
        sessionClaims: {
          metadata: { role: "viewer" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      expect(() => requireMerchant(authResult)).toThrow(
        "Merchant access required"
      );
    });
  });

  describe("Session Management Integration", () => {
    it("should handle expired sessions", async () => {
      mockAuth.mockRejectedValue(new Error("Session expired"));

      const request = new NextRequest("http://localhost:3000/api/orders");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Session expired"
      );
    });

    it("should handle invalid tokens", async () => {
      mockAuth.mockRejectedValue(new Error("Invalid token"));

      const request = new NextRequest("http://localhost:3000/api/orders");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Invalid token"
      );
    });

    it("should handle network errors during authentication", async () => {
      mockAuth.mockRejectedValue(new Error("Network error"));

      const request = new NextRequest("http://localhost:3000/api/orders");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("Permission Inheritance", () => {
    it("should allow admin to perform merchant actions", async () => {
      mockAuth.mockResolvedValue({
        userId: "admin-123",
        sessionClaims: {
          metadata: { role: "admin" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      // Admin should be able to access both admin and merchant endpoints
      expect(() => requireAdmin(authResult)).not.toThrow();
      expect(() => requireMerchant(authResult)).not.toThrow();
    });

    it("should not allow merchant to perform admin actions", async () => {
      mockAuth.mockResolvedValue({
        userId: "merchant-123",
        sessionClaims: {
          metadata: { role: "merchant" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      // Merchant should be able to access merchant endpoints but not admin
      expect(() => requireMerchant(authResult)).not.toThrow();
      expect(() => requireAdmin(authResult)).toThrow("Admin access required");
    });

    it("should not allow viewer to perform merchant or admin actions", async () => {
      mockAuth.mockResolvedValue({
        userId: "viewer-123",
        sessionClaims: {
          metadata: { role: "viewer" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      // Viewer should not be able to access merchant or admin endpoints
      expect(() => requireMerchant(authResult)).toThrow(
        "Merchant access required"
      );
      expect(() => requireAdmin(authResult)).toThrow("Admin access required");
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed session claims", async () => {
      mockAuth.mockResolvedValue({
        userId: "user-123",
        sessionClaims: {
          metadata: "invalid-metadata",
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const authResult = await authenticateRequest(request);

      expect(() => requireAdmin(authResult)).toThrow("Admin access required");
      expect(() => requireMerchant(authResult)).toThrow(
        "Merchant access required"
      );
    });

    it("should handle null userId with valid session claims", async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionClaims: {
          metadata: { role: "admin" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("should handle empty string userId", async () => {
      mockAuth.mockResolvedValue({
        userId: "",
        sessionClaims: {
          metadata: { role: "admin" },
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");

      await expect(authenticateRequest(request)).rejects.toThrow(
        "Authentication required"
      );
    });
  });
});
