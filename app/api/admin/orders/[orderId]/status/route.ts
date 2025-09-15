import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { updateOrderStatus } from "@/lib/db/queries/orders";
import { z } from "zod";

// Schema for updating order status
const UpdateOrderStatusSchema = z.object({
  status: z.enum(
    ["pending", "pending-verification", "completed", "expired", "failed"],
    {
      errorMap: () => ({ message: "Invalid status" }),
    }
  ),
  reason: z.string().optional(),
});

// PUT /api/admin/orders/[orderId]/status - Update order status
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user and verify admin role
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    requireAdmin(user);

    const { orderId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateOrderStatusSchema.parse(body);

    // Update order status
    const updatedOrder = await updateOrderStatus(
      orderId,
      validatedData.status,
      userId,
      validatedData.reason
    );

    return NextResponse.json({
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        amount: updatedOrder.amount,
        merchantName: updatedOrder.merchantName,
        utr: updatedOrder.utr,
        createdAt: updatedOrder.createdAt,
        expiresAt: updatedOrder.expiresAt,
      },
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Admin role required")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
