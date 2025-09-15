import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/orders/route";
import { auth } from "@clerk/nextjs/server";
import Order from "@/lib/db/models/order";
import SystemSettings from "@/lib/db/models/settings";
import { logOrderCreation } from "@/lib/db/queries/audit-logs";

// Mock dependencies
jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/db/connection");
jest.mock("@/lib/db/models/order");
jest.mock("@/lib/db/models/settings");
jest.mock("@/lib/db/queries/audit-logs");
jest.mock("@/lib/utils/validation");
jest.mock("@/lib/utils/upi-links");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockOrder = Order as jest.Mocked<typeof Order>;
const mockSystemSettings = SystemSettings as jest.Mocked<typeof SystemSettings>;
const mockLogOrderCreation = logOrderCreation as jest.MockedFunction<
  typeof logOrderCreation
>;

describe("/api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock system settings
    const mockSettings = {
      staticUpiId: null,
      getTimerDurationMs: jest.fn().mockReturnValue(540000), // 9 minutes
      getEnabledApps: jest
        .fn()
        .mockReturnValue(["gpay", "phonepe", "paytm", "bhim"]),
    };
    mockSystemSettings.getSettings.mockResolvedValue(mockSettings as any);
  });

  describe("POST /api/orders", () => {
    const validOrderData = {
      amount: 100,
      merchantName: "Test Merchant",
      vpa: "test@upi",
    };

    it("should create order successfully with valid data", async () => {
      // Mock authentication
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      // Mock ordereation
      const mockCreatedOrder = {
        orderId: "ORDER123",
        amount: 100,
        merchantName: "Test Merchant",
        vpa: "test@upi",
        paymentPageUrl: "http://localhost:3000/pay/ORDER123",
        expiresAt: new Date(Date.now() + 540000),
      };
      mockOrder.create.mockResolvedValue(mockCreatedOrder as any);

      // Create request
      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "test-agent",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.orderId).toBe("ORDER123");
      expect(mockOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          merchantName: "Test Merchant",
          vpa: "test@upi",
          status: "pending",
          createdBy: "test-user-id",
        })
      );
      expect(mockLogOrderCreation).toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 with invalid amount", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      const invalidData = { ...validOrderData, amount: -10 };
      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 with invalid VPA format", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      const invalidData = { ...validOrderData, vpa: "invalid-vpa" };
      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should use static UPI ID when configured", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      // Mock settings with static UPI ID
      const mockSettingsWithStatic = {
        staticUpiId: "static@upi",
        getTimerDurationMs: jest.fn().mockReturnValue(540000),
        getEnabledApps: jest.fn().mockReturnValue(["gpay", "phonepe"]),
      };
      mockSystemSettings.getSettings.mockResolvedValue(
        mockSettingsWithStatic as any
      );

      const mockCreatedOrder = {
        orderId: "ORDER123",
        vpa: "static@upi",
        paymentPageUrl: "http://localhost:3000/pay/ORDER123",
        expiresAt: new Date(),
      };
      mockOrder.create.mockResolvedValue(mockCreatedOrder as any);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
        headers: { "content-type": "application/json" },
      });

      await POST(request);

      expect(mockOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vpa: "static@upi",
        })
      );
    });
  });

  describe("GET /api/orders", () => {
    it("should return orders for authenticated merchant", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      const mockOrders = [
        { orderId: "ORDER1", amount: 100, status: "pending" },
        { orderId: "ORDER2", amount: 200, status: "completed" },
      ];

      mockOrder.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      } as any);

      mockOrder.countDocuments.mockResolvedValue(2);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.orders).toEqual(mockOrders);
      expect(data.data.pagination.totalCount).toBe(2);
    });

    it("should return all orders for admin", async () => {
      mockAuth.mockResolvedValue({
        userId: "admin-user-id",
        sessionClaims: { metadata: { role: "admin" } },
      } as any);

      mockOrder.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      mockOrder.countDocuments.mockResolvedValue(0);

      const request = new NextRequest("http://localhost:3000/api/orders");
      await GET(request);

      // Verify that query doesn't include createdBy filter for admin
      expect(mockOrder.find).toHaveBeenCalledWith({});
    });

    it("should filter orders by status", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      mockOrder.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      mockOrder.countDocuments.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost:3000/api/orders?status=completed"
      );
      await GET(request);

      expect(mockOrder.find).toHaveBeenCalledWith({
        createdBy: "test-user-id",
        status: "completed",
      });
    });

    it("should handle pagination correctly", async () => {
      mockAuth.mockResolvedValue({
        userId: "test-user-id",
        sessionClaims: { metadata: { role: "merchant" } },
      } as any);

      const mockChain = {
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      mockOrder.find.mockReturnValue(mockChain as any);
      mockOrder.countDocuments.mockResolvedValue(25);

      const request = new NextRequest(
        "http://localhost:3000/api/orders?page=2&limit=10"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(mockChain.sort().skip).toHaveBeenCalledWith(10); // (page-1) * limit
      expect(mockChain.sort().skip().limit).toHaveBeenCalledWith(10);
      expect(data.data.pagination.currentPage).toBe(2);
      expect(data.data.pagination.totalPages).toBe(3);
    });

    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
