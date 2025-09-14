import connectDB from "./connection";
import { Order, SystemSettings, AuditLog } from "./models";

/**
 * Initialize database with indexes and default data
 * This should be run once during application setup
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    console.log("Initializing database...");

    // Ensure indexes are created
    await Promise.all([
      Order.createIndexes(),
      SystemSettings.createIndexes(),
      AuditLog.createIndexes(),
    ]);

    console.log("Database indexes created successfully");

    // Create default system settings if they don't exist
    const existingSettings = await SystemSettings.findOne();

    if (!existingSettings) {
      await SystemSettings.create({
        timerDuration: 9, // 9 minutes default
        enabledUpiApps: {
          gpay: true,
          phonepe: true,
          paytm: true,
          bhim: true,
        },
        updatedBy: "system",
      });

      console.log("Default system settings created");
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

/**
 * Health check for database connection and collections
 */
export const healthCheck = async (): Promise<{
  connected: boolean;
  collections: {
    orders: boolean;
    systemSettings: boolean;
    auditLogs: boolean;
  };
}> => {
  try {
    await connectDB();

    // Check if collections exist and are accessible
    const [ordersCount, settingsCount, logsCount] = await Promise.all([
      Order.countDocuments().limit(1),
      SystemSettings.countDocuments().limit(1),
      AuditLog.countDocuments().limit(1),
    ]);

    return {
      connected: true,
      collections: {
        orders: true,
        systemSettings: true,
        auditLogs: true,
      },
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      connected: false,
      collections: {
        orders: false,
        systemSettings: false,
        auditLogs: false,
      },
    };
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<{
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  auditLogs: {
    total: number;
    recentCount: number;
  };
  settings: {
    timerDuration: number;
    enabledApps: string[];
  };
}> => {
  await connectDB();

  // Get order statistics
  const [orderTotal, ordersByStatus] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const orderStatusMap: Record<string, number> = {};
  ordersByStatus.forEach((stat) => {
    orderStatusMap[stat._id] = stat.count;
  });

  // Get audit log statistics
  const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  const [auditTotal, auditRecent] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ timestamp: { $gte: recentDate } }),
  ]);

  // Get current settings
  const settings = await SystemSettings.getSettings();

  return {
    orders: {
      total: orderTotal,
      byStatus: orderStatusMap,
    },
    auditLogs: {
      total: auditTotal,
      recentCount: auditRecent,
    },
    settings: {
      timerDuration: settings.timerDuration,
      enabledApps: settings.getEnabledApps(),
    },
  };
};
