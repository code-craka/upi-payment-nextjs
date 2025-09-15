// Simple test script to verify webhook endpoint
const crypto = require("crypto");

const webhookSecret = "whsec_e/DKL1n4yZ1FTwQC/knrltGt4BM4Qf3S";
const payload = JSON.stringify({
  type: "user.created",
  data: {
    id: "user_test123",
    email_addresses: [{ email_address: "test@example.com" }],
    first_name: "Test",
    last_name: "User",
    public_metadata: {},
  },
});

// Generate test signature (simplified - in real webhook this is done by Svix)
const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto
  .createHmac("sha256", webhookSecret.replace("whsec_", ""))
  .update(`${timestamp}.${payload}`)
  .digest("base64");

console.log("Test webhook payload:");
console.log("Headers:");
console.log(`svix-id: msg_test123`);
console.log(`svix-timestamp: ${timestamp}`);
console.log(`svix-signature: v1,${signature}`);
console.log("\nPayload:");
console.log(payload);

console.log("\nTo test the webhook, send a POST request to:");
console.log("http://localhost:3000/api/webhooks/clerk");
console.log("\nWith the above headers and payload");
