/**
 * Database Migration and Setup Script
 * This script sets up the database with all necessary collections, indexes, and initial data
 */

import connectDB from "./connection";
import Order from "./models/order";
import SystemSettings from "./models/settings";
import AuditLog from "./models/audit-log";

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("🔍 Testing database connection...");

    const connection = await connectDB();
    console.log("✅ Database connection successful!");
    console.log(`📊 Connected to: ${connection.connection.name}`);
    console.log(`🌐 Host: ${connection.connection.host}`);
    console.log(`📡 Ready State: ${connection.connection.readyState}`);

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export async function createIndexes(): Promise<void> {
  try {
    console.log("🔧 Creating database indexes...");

    await connectDB();

    // Order indexes
    console.log("📋 Creating Order indexes...");
    await Order.collection.createIndex({ orderId: 1 }, { unique: true });
    await Order.collection.createIndex({ createdBy: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ expiresAt: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ utr: 1 }, { sparse: true });

    // Compound indexes for common queries
    await Order.collection.createIndex({ createdBy: 1, status: 1 });
    await Order.collection.createIndex({ createdBy: 1, createdAt: -1 });
    await Order.collection.createIndex({ status: 1, expiresAt: 1 });

    console.log("✅ Order indexes created successfully");

    // SystemSettings indexes
    console.log("⚙️ Creating SystemSettings indexes...");
    await SystemSettings.collection.createIndex({ updatedAt: -1 });
    console.log("✅ SystemSettings indexes created successfully");

    // AuditLog indexes
    console.log("📝 Creating AuditLog indexes...");
    await AuditLog.collection.createIndex({ timestamp: -1 });
    await AuditLog.collection.createIndex({ userId: 1 });
    await AuditLog.collection.createIndex({ action: 1 });
    await AuditLog.collection.createIndex({ entityType: 1, entityId: 1 });

    // Compound indexes for audit queries
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ entityType: 1, timestamp: -1 });

    console.log("✅ AuditLog indexes created successfully");
    console.log("🎉 All database indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  }
}

export async function seedInitialData(): Promise<void> {
  try {
    console.log("🌱 Seeding initial data...");

    await connectDB();

    // Check if SystemSettings already exists
    const existingSettings = await SystemSettings.findOne();

    if (!existingSettings) {
      console.log("⚙️ Creating default system settings...");

      const defaultSettings = await SystemSettings.create({
        timerDuration: 9, // 9 minutes default
        enabledUpiApps: {
          gpay: true,
          phonepe: true,
          paytm: true,
          bhim: true,
        },
        updatedBy: "system",
      });

      console.log("✅ Default system settings created:", {
        timerDuration: defaultSettings.timerDuration,
        enabledApps: defaultSettings.getEnabledApps(),
      });
    } else {
      console.log("ℹ️ System settings already exist, skipping...");
    }

    // Create initial audit log entry
    const existingAuditLogs = await AuditLog.countDocuments();

    if (existingAuditLogs === 0) {
      console.log("📝 Creating initial audit log entry...");

      await AuditLog.create({
        action: "system_initialized",
        entityType: "system",
        entityId: "database",
        userId: "system",
        details: {
          message: "Database initialized successfully",
          timestamp: new Date(),
        },
        ipAddress: "127.0.0.1",
        userAgent: "Migration Script",
      });

      console.log("✅ Initial audit log entry created");
    } else {
      console.log("ℹ️ Audit logs already exist, skipping...");
    }

    console.log("🎉 Initial data seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding initial data:", error);
    throw error;
  }
}

export async function validateCollections(): Promise<void> {
  try {
    console.log("🔍 Validating database collections...");

    await connectDB();

    // Test Order model
    console.log("📋 Validating Order collection...");
    const orderCount = await Order.countDocuments();
    console.log(`✅ Orders collection: ${orderCount} documents`);

    // Test SystemSettings model
    console.log("⚙️ Validating SystemSettings collection...");
    const settings = await SystemSettings.getSettings();
    console.log(
      `✅ SystemSettings: Timer ${settings.timerDuration}min, Apps: ${settings.getEnabledApps().join(", ")}`
    );

    // Test AuditLog model
    console.log("📝 Validating AuditLog collection...");
    const auditCount = await AuditLog.countDocuments();
    console.log(`✅ AuditLogs collection: ${auditCount} documents`);

    console.log("🎉 All collections validated successfully!");
  } catch (error) {
    console.error("❌ Error validating collections:", error);
    throw error;
  }
}

export async function getCollectionStats(): Promise<void> {
  try {
    console.log("📊 Getting collection statistics...");

    await connectDB();

    // Get database stats
    const connection = await connectDB();
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }
    const stats = await db.stats();

    console.log("📈 Database Statistics:");
    console.log(`  Database: ${stats.db}`);
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `  Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  Indexes: ${stats.indexes}`);
    console.log(
      `  Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
    );

    // Get collection-specific stats
    const collections = ["orders", "systemsettings", "auditlogs"];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const collStats = await db.command({ collStats: collectionName });

        console.log(`\n📋 ${collectionName.toUpperCase()} Collection:`);
        console.log(`  Documents: ${collStats.count || 0}`);
        console.log(`  Size: ${((collStats.size || 0) / 1024).toFixed(2)} KB`);
        console.log(`  Indexes: ${collStats.nindexes || 0}`);
      } catch (error) {
        console.log(`  Collection ${collectionName} not found or empty`);
      }
    }
  } catch (error) {
    console.error("❌ Error getting collection stats:", error);
    throw error;
  }
}

export async function runFullMigration(): Promise<void> {
  try {
    console.log("🚀 Starting full database migration...\n");

    // Step 1: Test connection
    const connectionSuccess = await testDatabaseConnection();
    if (!connectionSuccess) {
      throw new Error("Database connection failed");
    }
    console.log("");

    // Step 2: Create indexes
    await createIndexes();
    console.log("");

    // Step 3: Seed initial data
    await seedInitialData();
    console.log("");

    // Step 4: Validate collections
    await validateCollections();
    console.log("");

    // Step 5: Get statistics
    await getCollectionStats();
    console.log("");

    console.log("🎉 Database migration completed successfully!");
    console.log("✅ Your database is ready for the UPI Payment System!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "test":
      testDatabaseConnection()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "indexes":
      createIndexes()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "seed":
      seedInitialData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "validate":
      validateCollections()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "stats":
      getCollectionStats()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "migrate":
    default:
      runFullMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
  }
}
