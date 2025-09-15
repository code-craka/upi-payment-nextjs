import { NextRequest } from "next/server";
import { POST, GET, DELETE } from "@/app/api/orders/[orderId]/utr/route";
import Order from "@/lib/db/models/order";
import {
  logUTRSubmission,
  logOrderStatusUpdate,
} from "@/lib/db/queries/audit-logs";

// Mock dependencies
jest.mock("@/lib/db/connection");
jest.mock("@/lib/db/models/order");
jest.mock("@/lib/db/queries/audit-logs");

const mockOrder = Order as jest.Mocked<typeof Order>;
const mockLogUTRSubmission = logUTRSubmission as jest.MockedFunction<
  typeof logUTRSubmission
>;
const mockLogOrderStatusUpdate = logOrderStatusUpdate as jest.MockedFunction<
  typeof logOrderStatusUpdate
>;

describe("/api/orders/[orderId]/utr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders/[orderId]/utr", () => {
    const validUTRData = {
      utr: "123456789012",
    };

    const mockOrderData = {
      _id: "order-id",
      orderId: "ORDER123",
      status: "pending",
      createdBy: "user-123",
      utr: null,
      metadata: {},
      canSubmitUTR: jest.fn().mockReturnValue(true),
      isExpired: jest.fn().mockReturnValue(false),
      save: jest.fn().mockResolvedValue(true),
    };

    it("should submit UTR successfully for pending order", async () => {
      mockOrder.findByOrderId.mockResolvedValue(mockOrderData as any);
      mockOrder.findOne.mockResolvedValue(null); // No existing UTR

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
            "user-agent": "test-agent",
          },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.utr).toBe("123456789012");
      expect(data.data.status).toBe("pending-verification");
      expect(mockOrderData.save).toHaveBeenCalled();
      expect(mockLogUTRSubmission).toHaveBeenCalled();
      expect(mockLogOrderStatusUpdate).toHaveBeenCalled();
    });

    it("should return 404 when order not found", async () => {
      mockOrder.findByOrderId.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/INVALID/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "INVALID" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(404);
    });

    it("should return 400 when order is expired", async () => {
      const expiredOrder = {
        ...mockOrderData,
        canSubmitUTR: jest.fn().mockReturnValue(false),
        isExpired: jest.fn().mockReturnValue(true),
      };
      mockOrder.findByOrderId.mockResolvedValue(expiredOrder as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(400);
    });

    it("should return 409 when UTR already exists for order", async () => {
      const orderWithUTR = {
        ...mockOrderData,
        utr: "999999999999",
      };
      mockOrder.findByOrderId.mockResolvedValue(orderWithUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(409);
    });

    it("should return 409 when UTR is already used by another order", async () => {
      mockOrder.findByOrderId.mockResolvedValue(mockOrderData as any);
      mockOrder.findOne.mockResolvedValue({ orderId: "OTHER_ORDER" } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(409);
    });

    it("should return 400 with invalid UTR format", async () => {
      mockOrder.findByOrderId.mockResolvedValue(mockOrderData as any);

      const invalidUTRData = { utr: "123" }; // Too short
      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(invalidUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(400);
    });

    it("should return 400 when order status is not pending", async () => {
      const completedOrder = {
        ...mockOrderData,
        status: "completed",
        canSubmitUTR: jest.fn().mockReturnValue(false),
        isExpired: jest.fn().mockReturnValue(false),
      };
      mockOrder.findByOrderId.mockResolvedValue(completedOrder as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "POST",
          body: JSON.stringify(validUTRData),
          headers: { "content-type": "application/json" },
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await POST(request, params);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/orders/[orderId]/utr", () => {
    it("should return UTR status for existing order", async () => {
      const orderWithUTR = {
        orderId: "ORDER123",
        utr: "123456789012",
        status: "pending-verification",
        canSubmitUTR: jest.fn().mockReturnValue(false),
        metadata: {
          utrSubmittedAt: new Date("2023-01-01"),
        },
      };
      mockOrder.findByOrderId.mockResolvedValue(orderWithUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr"
      );
      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await GET(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.hasUTR).toBe(true);
      expect(data.data.utr).toBe("123456789012");
      expect(data.data.canSubmitUTR).toBe(false);
    });

    it("should return UTR status for order without UTR", async () => {
      const orderWithoutUTR = {
        orderId: "ORDER123",
        utr: null,
        status: "pending",
        canSubmitUTR: jest.fn().mockReturnValue(true),
        metadata: {},
      };
      mockOrder.findByOrderId.mockResolvedValue(orderWithoutUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr"
      );
      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await GET(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasUTR).toBe(false);
      expect(data.data.utr).toBeNull();
      expect(data.data.canSubmitUTR).toBe(true);
    });

    it("should return 404 when order not found", async () => {
      mockOrder.findByOrderId.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/INVALID/utr"
      );
      const params = { params: Promise.resolve({ orderId: "INVALID" }) };
      const response = await GET(request, params);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/orders/[orderId]/utr", () => {
    it("should remove UTR successfully (admin only)", async () => {
      const orderWithUTR = {
        orderId: "ORDER123",
        utr: "123456789012",
        status: "pending-verification",
        isExpired: jest.fn().mockReturnValue(false),
        metadata: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockOrder.findByOrderId.mockResolvedValue(orderWithUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "DELETE",
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(orderWithUTR.utr).toBeUndefined();
      expect(orderWithUTR.status).toBe("pending");
      expect(orderWithUTR.save).toHaveBeenCalled();
    });

    it("should return 404 when order not found", async () => {
      mockOrder.findByOrderId.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/INVALID/utr",
        {
          method: "DELETE",
        }
      );

      const params = { params: Promise.resolve({ orderId: "INVALID" }) };
      const response = await DELETE(request, params);

      expect(response.status).toBe(404);
    });

    it("should return 400 when no UTR exists", async () => {
      const orderWithoutUTR = {
        orderId: "ORDER123",
        utr: null,
        status: "pending",
      };
      mockOrder.findByOrderId.mockResolvedValue(orderWithoutUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "DELETE",
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      const response = await DELETE(request, params);

      expect(response.status).toBe(400);
    });

    it("should set status to expired if order is expired", async () => {
      const expiredOrderWithUTR = {
        orderId: "ORDER123",
        utr: "123456789012",
        status: "pending-verification",
        isExpired: jest.fn().mockReturnValue(true),
        metadata: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockOrder.findByOrderId.mockResolvedValue(expiredOrderWithUTR as any);

      const request = new NextRequest(
        "http://localhost:3000/api/orders/ORDER123/utr",
        {
          method: "DELETE",
        }
      );

      const params = { params: Promise.resolve({ orderId: "ORDER123" }) };
      await DELETE(request, params);

      expect(expiredOrderWithUTR.status).toBe("expired");
    });
  });
});
