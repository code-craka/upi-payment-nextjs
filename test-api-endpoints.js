/**
 * Simple test script to verify API endpoints work correctly
 * Run with: node test-api-endpoints.js
 */

const BASE_URL = "http://localhost:3000";

// Mock Clerk authentication for testing
const MOCK_USER_ID = "test-user-123";
const MOCK_AUTH_HEADER = "Bearer test-token";

async function testCreateOrder() {
  console.log("Testing POST /api/orders...");

  const orderData = {
    amount: 100,
    merchantName: "Test Merchant",
    vpa: "test@upi",
  };

  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: MOCK_AUTH_HEADER,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✓ Order creation successful:", result.data.orderId);
      return result.data.orderId;
    } else {
      console.log("✗ Order creation failed:", result.error);
      return null;
    }
  } catch (error) {
    console.log("✗ Order creation error:", error.message);
    return null;
  }
}

async function testGetOrder(orderId) {
  if (!orderId) return;

  console.log(`Testing GET /api/orders/${orderId}...`);

  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`);
    const result = await response.json();

    if (response.ok) {
      console.log("✓ Order fetch successful:", {
        orderId: result.data.order.orderId,
        status: result.data.order.status,
        timeRemaining: result.data.timeRemaining,
      });
      return true;
    } else {
      console.log("✗ Order fetch failed:", result.error);
      return false;
    }
  } catch (error) {
    console.log("✗ Order fetch error:", error.message);
    return false;
  }
}

async function testSubmitUTR(orderId) {
  if (!orderId) return;

  console.log(`Testing POST /api/orders/${orderId}/utr...`);

  const utrData = {
    utr: "TEST12345678",
  };

  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/utr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(utrData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✓ UTR submission successful:", {
        orderId: result.data.orderId,
        status: result.data.status,
      });
      return true;
    } else {
      console.log("✗ UTR submission failed:", result.error);
      return false;
    }
  } catch (error) {
    console.log("✗ UTR submission error:", error.message);
    return false;
  }
}

async function testGetOrders() {
  console.log("Testing GET /api/orders...");

  try {
    const response = await fetch(`${BASE_URL}/api/orders?page=1&limit=5`, {
      headers: {
        Authorization: MOCK_AUTH_HEADER,
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✓ Orders list successful:", {
        count: result.data.orders.length,
        totalCount: result.data.pagination.totalCount,
      });
      return true;
    } else {
      console.log("✗ Orders list failed:", result.error);
      return false;
    }
  } catch (error) {
    console.log("✗ Orders list error:", error.message);
    return false;
  }
}

async function testExpirationEndpoint() {
  console.log("Testing GET /api/orders/expire...");

  try {
    const response = await fetch(`${BASE_URL}/api/orders/expire`);
    const result = await response.json();

    if (response.ok) {
      console.log("✓ Expiration stats successful:", result.data);
      return true;
    } else {
      console.log("✗ Expiration stats failed:", result.error);
      return false;
    }
  } catch (error) {
    console.log("✗ Expiration stats error:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting API endpoint tests...\n");

  // Test order creation
  const orderId = await testCreateOrder();
  console.log("");

  // Test order fetching
  await testGetOrder(orderId);
  console.log("");

  // Test UTR submission
  await testSubmitUTR(orderId);
  console.log("");

  // Test orders listing
  await testGetOrders();
  console.log("");

  // Test expiration endpoint
  await testExpirationEndpoint();
  console.log("");

  console.log("🎉 API endpoint tests completed!");
  console.log("\nNote: These tests require:");
  console.log("1. Development server running (pnpm dev)");
  console.log("2. MongoDB connection configured");
  console.log("3. Clerk authentication properly set up");
  console.log("4. Some tests may fail due to authentication requirements");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateOrder,
  testGetOrder,
  testSubmitUTR,
  testGetOrders,
  testExpirationEndpoint,
  runTests,
};
