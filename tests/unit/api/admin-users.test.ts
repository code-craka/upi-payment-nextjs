import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/admin/users/route";
import { clerkClient } from "@clerk/nextjs/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import { logUserAction } from "@/lib/db/queries/audit-logs";

// Mock dependencies
jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/auth/utils");
jest.mock("@/lib/db/queries/audit-logs");

const mockClerkClient = clerkClient as jest.MockedFunction<typeof clerkClient>;
const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<
  typeof authenticateRequest
>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<
  typeof requireAdmin
>;
const mockLogUserAction = logUserAction as jest.MockedFunction<
  typeof logUserAction
>;

describe("/api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful authentication
    mockAuthenticateRequest.mockResolvedValue({
      userId: "admin-user-id",
      sessionClaims: { metadata: { role: "admin" } },
    } as any);

    mockRequireAdmin.mockImplementation(() => {}); // No-op for admin
  });

  describe("GET /api/admin/users", () => {
    const mockUsers = [
      {
        id: "user-1",
        emailAddresses: [{ emailAddress: "user1@example.com" }],
        firstName: "John",
        lastName: "Doe",
        publicMetadata: { role: "merchant" },
        createdAt: new Date("2023-01-01"),
        lastSignInAt: new Date("2023-01-02"),
        imageUrl: "https://example.com/avatar1.jpg",
      },
      {
        id: "user-2",
        emailAddresses: [{ emailAddress: "user2@example.com" }],
        firstName: "Jane",
        lastName: "Smith",
        publicMetadata: { role: "admin" },
        createdAt: new Date("2023-01-01"),
        lastSignInAt: new Date("2023-01-03"),
        imageUrl: "https://example.com/avatar2.jpg",
      },
    ];

    it("should return all users successfully", async () => {
      const mockClerk = {
        users: {
          getUserList: jest.fn().mockResolvedValue({
            data: mockUsers,
            totalCount: 2,
          }),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0]).toEqual({
        id: "user-1",
        email: "user1@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "merchant",
        createdAt: mockUsers[0].createdAt,
        lastSignInAt: mockUsers[0].lastSignInAt,
        imageUrl: "https://example.com/avatar1.jpg",
      });
      expect(data.pagination.total).toBe(2);
    });

    it("should filter users by role", async () => {
      const mockClerk = {
        users: {
          getUserList: jest.fn().mockResolvedValue({
            data: mockUsers,
            totalCount: 2,
          }),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users?role=merchant"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].role).toBe("merchant");
    });

    it("should handle pagination correctly", async () => {
      const mockClerk = {
        users: {
          getUserList: jest.fn().mockResolvedValue({
            data: mockUsers,
            totalCount: 25,
          }),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users?page=2&limit=10"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(mockClerk.users.getUserList).toHaveBeenCalledWith({
        limit: 10,
        offset: 10, // (page-1) * limit
      });
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.totalPages).toBe(3);
    });

    it("should return 403 when user is not admin", async () => {
      mockRequireAdmin.mockImplementation(() => {
        throw new Error("Admin access required");
      });

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should handle Clerk API errors", async () => {
      const mockClerk = {
        users: {
          getUserList: jest
            .fn()
            .mockRejectedValue(new Error("Clerk API error")),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/admin/users", () => {
    const validUserData = {
      email: "newuser@example.com",
      firstName: "New",
      lastName: "User",
      role: "merchant" as const,
    };

    const mockCreatedUser = {
      id: "new-user-id",
      emailAddresses: [{ emailAddress: "newuser@example.com" }],
      firstName: "New",
      lastName: "User",
      publicMetadata: { role: "merchant" },
      createdAt: new Date("2023-01-01"),
      lastSignInAt: null,
      imageUrl: "https://example.com/default-avatar.jpg",
    };

    it("should create user successfully", async () => {
      const mockClerk = {
        users: {
          createUser: jest.fn().mockResolvedValue(mockCreatedUser),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(validUserData),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "test-agent",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.id).toBe("new-user-id");
      expect(data.user.email).toBe("newuser@example.com");
      expect(data.user.role).toBe("merchant");
      expect(data.message).toBe("User created successfully");

      expect(mockClerk.users.createUser).toHaveBeenCalledWith({
        emailAddress: ["newuser@example.com"],
        firstName: "New",
        lastName: "User",
        publicMetadata: {
          role: "merchant",
          onboardingComplete: true,
        },
      });

      expect(mockLogUserAction).toHaveBeenCalledWith(
        "user_created",
        "new-user-id",
        "admin-user-id",
        expect.objectContaining({
          email: "newuser@example.com",
          role: "merchant",
        }),
        expect.objectContaining({
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
        })
      );
    });

    it("should return 400 with invalid email", async () => {
      const invalidData = { ...validUserData, email: "invalid-email" };
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 with invalid role", async () => {
      const invalidData = { ...validUserData, role: "invalid-role" };
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 with missing required fields", async () => {
      const incompleteData = { email: "test@example.com" };
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 403 when user is not admin", async () => {
      mockRequireAdmin.mockImplementation(() => {
        throw new Error("Admin access required");
      });

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(validUserData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it("should handle Clerk API errors during user creation", async () => {
      const mockClerk = {
        users: {
          createUser: jest
            .fn()
            .mockRejectedValue(new Error("Email already exists")),
        },
      };
      mockClerkClient.mockResolvedValue(mockClerk as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify(validUserData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
