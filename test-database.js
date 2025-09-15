/**
 * Database Connection Test Script
 * Run with: node test-database.js
 */

const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function testDatabaseConnection() {
  console.log("🔧 UPI Payment System - Database Connection Test\n");

  if (!MONGODB_URI) {
    console.log("❌ MONGODB_URI environment variable is not set!");
    console.log("💡 Please check your .env.local file");
    return false;
  }

  console.log(
    "📊 MongoDB URI:",
    MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
  );
  console.log("");

  try {
    console.log("🔍 Testing database connection...");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Database connection successful!");
    console.log(`📊 Connected to database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`📡 Ready State: ${mongoose.connection.readyState}`);

    // Test basic operations
    console.log("\n🧪 Testing basic database operations...");

    // Get database stats
    const db = mongoose.connection.db;
    const stats = await db.stats();

    console.log("📈 Database Statistics:");
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `  Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
    );

    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Existing Collections (${collections.length}):`);
    collections.forEach((col) => {
      console.log(`  - ${col.name}`);
    });

    if (collections.length === 0) {
      console.log(
        "  (No collections found - this is normal for a new database)"
      );
    }

    // Test a simple write operation
    console.log("\n✍️ Testing write operation...");
    const testCollection = db.collection("connection_test");

    const testDoc = {
      message: "Database connection test",
      timestamp: new Date(),
      success: true,
    };

    const result = await testCollection.insertOne(testDoc);
    console.log("✅ Write operation successful:", result.insertedId);

    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log("🧹 Test document cleaned up");

    console.log("\n🎉 Database test completed successfully!");
    console.log("✅ Your MongoDB database is working correctly!");
    console.log("🚀 You can now run: pnpm run db:setup");

    return true;
  } catch (error) {
    console.error("❌ Database test failed:", error.message);

    // Provide helpful error messages
    if (error.message.includes("authentication")) {
      console.log("\n💡 Authentication Error Solutions:");
      console.log("   1. Check your MongoDB username and password in the URI");
      console.log("   2. Verify the database user exists in MongoDB Atlas");
      console.log("   3. Ensure the user has read/write permissions");
      console.log("   4. Check if the database name is correct");
    }

    if (
      error.message.includes("network") ||
      error.message.includes("ENOTFOUND")
    ) {
      console.log("\n💡 Network Error Solutions:");
      console.log("   1. Check your internet connection");
      console.log("   2. Verify MongoDB Atlas cluster is running");
      console.log(
        "   3. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for testing)"
      );
      console.log("   4. Verify the cluster URL is correct");
    }

    if (error.message.includes("timeout")) {
      console.log("\n💡 Timeout Error Solutions:");
      console.log("   1. Check your internet connection speed");
      console.log("   2. Try again in a few moments");
      console.log("   3. Verify MongoDB Atlas cluster region");
    }

    return false;
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("\n🔌 Database connection closed");
    }
  }
}

async function setupDatabase() {
  console.log("🚀 Setting up database for UPI Payment System...\n");

  if (!MONGODB_URI) {
    console.log("❌ MONGODB_URI environment variable is not set!");
    return false;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Connected to database");

    const db = mongoose.connection.db;

    // Create collections with validation
    console.log("📋 Creating collections...");

    // Orders collection
    try {
      await db.createCollection("orders", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: [
              "orderId",
              "amount",
              "merchantName",
              "vpa",
              "status",
              "createdBy",
            ],
            properties: {
              orderId: { bsonType: "string" },
              amount: { bsonType: "number", minimum: 1, maximum: 100000 },
              merchantName: { bsonType: "string" },
              vpa: { bsonType: "string" },
              status: {
                bsonType: "string",
                enum: [
                  "pending",
                  "pending-verification",
                  "completed",
                  "expired",
                  "failed",
                ],
              },
              createdBy: { bsonType: "string" },
            },
          },
        },
      });
      console.log("  ✅ Orders collection created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("  ℹ️ Orders collection already exists");
      } else {
        throw error;
      }
    }

    // SystemSettings collection
    try {
      await db.createCollection("systemsettings");
      console.log("  ✅ SystemSettings collection created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("  ℹ️ SystemSettings collection already exists");
      } else {
        throw error;
      }
    }

    // AuditLogs collection
    try {
      await db.createCollection("auditlogs");
      console.log("  ✅ AuditLogs collection created");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("  ℹ️ AuditLogs collection already exists");
      } else {
        throw error;
      }
    }

    // Create indexes
    console.log("\n🔧 Creating database indexes...");

    const ordersCollection = db.collection("orders");
    await ordersCollection.createIndex({ orderId: 1 }, { unique: true });
    await ordersCollection.createIndex({ createdBy: 1 });
    await ordersCollection.createIndex({ status: 1 });
    await ordersCollection.createIndex({ expiresAt: 1 });
    await ordersCollection.createIndex({ createdAt: -1 });
    console.log("  ✅ Orders indexes created");

    const settingsCollection = db.collection("systemsettings");
    await settingsCollection.createIndex({ updatedAt: -1 });
    console.log("  ✅ SystemSettings indexes created");

    const auditCollection = db.collection("auditlogs");
    await auditCollection.createIndex({ timestamp: -1 });
    await auditCollection.createIndex({ userId: 1 });
    console.log("  ✅ AuditLogs indexes created");

    // Insert default system settings
    console.log("\n🌱 Creating default system settings...");

    const existingSettings = await settingsCollection.findOne();
    if (!existingSettings) {
      await settingsCollection.insertOne({
        timerDuration: 9,
        enabledUpiApps: {
          gpay: true,
          phonepe: true,
          paytm: true,
          bhim: true,
        },
        updatedBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("  ✅ Default settings created");
    } else {
      console.log("  ℹ️ Settings already exist");
    }

    console.log("\n🎉 Database setup completed successfully!");
    console.log("✅ Your database is ready for the UPI Payment System!");
    console.log("🚀 You can now start the development server with: pnpm dev");

    return true;
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    return false;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || "test";

  let success = false;

  switch (command) {
    case "setup":
    case "migrate":
    case "full":
      success = await setupDatabase();
      break;

    case "test":
    default:
      success = await testDatabaseConnection();
      break;
  }

  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });
}

module.exports = {
  testDatabaseConnection,
  setupDatabase,
  main,
};
