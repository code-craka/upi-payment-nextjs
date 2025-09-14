/**
 * Test script to verify database models work correctly
 * This is for development testing only
 */

import connectDB from "./connection";
import { Order, SystemSettings, AuditLog } from "./models";
import { createOrder, getSystemSettings, createAuditLog } from "./queries";

export const testModels = async () => {
  try {
    console.log("Testing database models...");

    // Connect to database
    await connectDB();
    console.log("✓ Database connection successful");

    // Test SystemSettings
    const settings = await SystemSettings.getSettings();
    console.log("✓ System settings retrieved:", {
      timerDuration: settings.timerDuration,
      enabledApps: settings.getEnabledApps(),
    });

    // Test Order creation (mock data)
    const testOrderData = {
      amount: 100,
      merchantName: "Test Merchant",
      vpa: "test@upi",
      createdBy: "test-user-id",
    };

    const order = await createOrder(testOrderData, {
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
    });
    console.log("✓ Order created successfully:", {
      orderId: order.orderId,
      status: order.status,
      expiresAt: order.expiresAt,
    });

    // Test AuditLog
    const auditLog = await createAuditLog({
      action: "order_created",
      entityType: "order",
      entityId: order.orderId,
      userId: "test-user-id",
      details: { test: true },
      ipAddress: "127.0.0.1",
    });
    console.log("✓ Audit log created successfully:", {
      action: auditLog.action,
      timestamp: auditLog.timestamp,
    });

    // Test order methods
    console.log("✓ Order methods test:", {
      isExpired: order.isExpired(),
      canSubmitUTR: order.canSubmitUTR(),
      canUpdateStatus: order.canUpdateStatus(),
    });

    // Clean up test data
    await Order.deleteOne({ orderId: order.orderId });
    await AuditLog.deleteOne({ _id: auditLog._id });
    console.log("✓ Test data cleaned up");

    console.log("🎉 All model tests passed!");
  } catch (error) {
    console.error("❌ Model test failed:", error);
    throw error;
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  testModels()
    .then(() => {
      console.log("Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}
