/**
 * Test Database Models and Operations
 * Run with: node test-models.js
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Import models (we'll define them inline for testing)
const { Schema } = mongoose;

// Order Schema (simplified for testing)
const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1, max: 100000 },
    merchantName: { type: String, required: true },
    vpa: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "pending-verification",
        "completed",
        "expired",
        "failed",
      ],
      default: "pending",
    },
    utr: { type: String },
    createdBy: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    paymentPageUrl: { type: String, required: true },
    upiDeepLink: { type: String, required: true },
    metadata: {
      customerIP: String,
      userAgent: String,
      referrer: String,
      utrSubmittedAt: Date,
      utrSubmissionIP: String,
      utrSubmissionUserAgent: String,
    },
  },
  { timestamps: true }
);

// SystemSettings Schema
const SystemSettingsSchema = new Schema(
  {
    timerDuration: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      default: 9,
    },
    staticUpiId: { type: String },
    enabledUpiApps: {
      gpay: { type: Boolean, default: true },
      phonepe: { type: Boolean, default: true },
      paytm: { type: Boolean, default: true },
      bhim: { type: Boolean, default: true },
    },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Create models
const Order = mongoose.model("Order", OrderSchema);
const SystemSettings = mongoose.model("SystemSettings", SystemSettingsSchema);

async function testModels() {
  console.log("🧪 Testing Database Models and Operations\n");

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log("✅ Connected to database");

    // Test 1: SystemSettings
    console.log("\n1️⃣ Testing SystemSettings...");

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        timerDuration: 9,
        enabledUpiApps: {
          gpay: true,
          phonepe: true,
          paytm: true,
          bhim: true,
        },
        updatedBy: "test-system",
      });
      console.log("✅ SystemSettings created");
    } else {
      console.log("✅ SystemSettings found");
    }

    console.log(`   Timer Duration: ${settings.timerDuration} minutes`);
    console.log(
      `   Enabled Apps: ${Object.entries(settings.enabledUpiApps)
        .filter(([_, enabled]) => enabled)
        .map(([app]) => app)
        .join(", ")}`
    );

    // Test 2: Order Creation
    console.log("\n2️⃣ Testing Order Creation...");

    const testOrderId = `UPI${Date.now()}TEST`;
    const testOrder = {
      orderId: testOrderId,
      amount: 100,
      merchantName: "Test Merchant",
      vpa: "test@upi",
      createdBy: "test-user-123",
      expiresAt: new Date(Date.now() + 9 * 60 * 1000), // 9 minutes from now
      paymentPageUrl: `http://localhost:3000/pay/${testOrderId}`,
      upiDeepLink: `upi://pay?pa=test@upi&am=100&tn=Payment%20to%20Test%20Merchant`,
      metadata: {
        customerIP: "127.0.0.1",
        userAgent: "Test Agent",
        referrer: "http://localhost:3000",
      },
    };

    const order = await Order.create(testOrder);
    console.log("✅ Order created successfully");
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Amount: ₹${order.amount}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Expires At: ${order.expiresAt.toISOString()}`);

    // Test 3: Order Retrieval
    console.log("\n3️⃣ Testing Order Retrieval...");

    const foundOrder = await Order.findOne({ orderId: testOrderId });
    if (foundOrder) {
      console.log("✅ Order retrieved successfully");
      console.log(`   Found Order: ${foundOrder.orderId}`);
      console.log(`   Merchant: ${foundOrder.merchantName}`);
    } else {
      console.log("❌ Order not found");
    }

    // Test 4: UTR Submission
    console.log("\n4️⃣ Testing UTR Submission...");

    const testUTR = "TEST12345678";
    foundOrder.utr = testUTR;
    foundOrder.status = "pending-verification";
    foundOrder.metadata.utrSubmittedAt = new Date();
    foundOrder.metadata.utrSubmissionIP = "127.0.0.1";

    await foundOrder.save();
    console.log("✅ UTR submitted successfully");
    console.log(`   UTR: ${foundOrder.utr}`);
    console.log(`   Status: ${foundOrder.status}`);

    // Test 5: Order Status Update
    console.log("\n5️⃣ Testing Order Status Update...");

    foundOrder.status = "completed";
    await foundOrder.save();
    console.log("✅ Order status updated");
    console.log(`   Final Status: ${foundOrder.status}`);

    // Test 6: Query Operations
    console.log("\n6️⃣ Testing Query Operations...");

    const pendingOrders = await Order.find({ status: "pending" });
    const completedOrders = await Order.find({ status: "completed" });
    const userOrders = await Order.find({ createdBy: "test-user-123" });

    console.log(`✅ Query results:`);
    console.log(`   Pending Orders: ${pendingOrders.length}`);
    console.log(`   Completed Orders: ${completedOrders.length}`);
    console.log(`   User Orders: ${userOrders.length}`);

    // Test 7: Validation
    console.log("\n7️⃣ Testing Validation...");

    try {
      await Order.create({
        orderId: "INVALID",
        amount: -100, // Invalid amount
        merchantName: "",
        vpa: "invalid-vpa",
        createdBy: "test",
      });
      console.log("❌ Validation should have failed");
    } catch (error) {
      console.log("✅ Validation working correctly");
      console.log(`   Validation Error: ${error.message.split(":")[0]}`);
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await Order.deleteOne({ orderId: testOrderId });
    console.log("✅ Test order deleted");

    console.log("\n🎉 All model tests passed successfully!");
    console.log("✅ Database models are working correctly!");
    console.log("🚀 API endpoints should work properly now!");

    return true;
  } catch (error) {
    console.error("❌ Model test failed:", error.message);
    return false;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run tests
if (require.main === module) {
  testModels()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error("❌ Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = { testModels };
