import connectDB from "../connection";
import AuditLog, {
  IAuditLog,
  AuditAction,
  EntityType,
  CreateAuditLogSchema,
} from "../models/audit-log";
import { z } from "zod";

// Connect to database before operations
const ensureConnection = async () => {
  await connectDB();
};

// Create audit log entry
export const createAuditLog = async (
  logData: z.infer<typeof CreateAuditLogSchema>
): Promise<IAuditLog> => {
  await ensureConnection();

  // Validate input
  const validatedData = CreateAuditLogSchema.parse(logData);

  return await AuditLog.logAction(
    validatedData.action,
    validatedData.entityType,
    validatedData.userId,
    {
      entityId: validatedData.entityId,
      details: validatedData.details,
      ipAddress: validatedData.ipAddress,
      userAgent: validatedData.userAgent,
    }
  );
};

// Get recent activity with filtering
export const getRecentActivity = async (
  options: {
    limit?: number;
    userId?: string;
    action?: AuditAction;
    entityType?: EntityType;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<IAuditLog[]> => {
  await ensureConnection();

  const { limit = 50, ...filters } = options;

  return await AuditLog.getRecentActivity(limit, filters);
};

// Get user-specific activity
export const getUserActivity = async (
  userId: string,
  limit: number = 100
): Promise<IAuditLog[]> => {
  await ensureConnection();

  return await AuditLog.getUserActivity(userId, limit);
};

// Get entity history (all actions for a specific entity)
export const getEntityHistory = async (
  entityType: EntityType,
  entityId: string
): Promise<IAuditLog[]> => {
  await ensureConnection();

  return await AuditLog.getEntityHistory(entityType, entityId);
};

// Get action statistics
export const getActionStats = async (
  startDate?: Date,
  endDate?: Date
): Promise<
  Array<{
    _id: AuditAction;
    count: number;
    lastOccurrence: Date;
  }>
> => {
  await ensureConnection();

  return await AuditLog.getActionStats(startDate, endDate);
};

// Get user statistics (activity summary per user)
export const getUserStats = async (
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<
  Array<{
    userId: string;
    totalActions: number;
    actionBreakdown: Record<AuditAction, number>;
    lastActivity: Date;
  }>
> => {
  await ensureConnection();

  const { startDate, endDate, limit = 100 } = options;

  const matchStage: any = {};
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = startDate;
    if (endDate) matchStage.timestamp.$lte = endDate;
  }

  const pipeline: any[] = [
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: {
          userId: "$userId",
          action: "$action",
        },
        count: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        totalActions: { $sum: "$count" },
        actionBreakdown: {
          $push: {
            action: "$_id.action",
            count: "$count",
          },
        },
        lastActivity: { $max: "$lastActivity" },
      },
    },
    {
      $sort: { totalActions: -1 },
    },
    {
      $limit: limit,
    },
  ];

  const results = await AuditLog.aggregate(pipeline);

  return results.map((result) => ({
    userId: result._id,
    totalActions: result.totalActions,
    actionBreakdown: result.actionBreakdown.reduce((acc: any, item: any) => {
      acc[item.action] = item.count;
      return acc;
    }, {}),
    lastActivity: result.lastActivity,
  }));
};

// Get order-related activity
export const getOrderActivity = async (
  orderId?: string,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<IAuditLog[]> => {
  await ensureConnection();

  const filters: any = {
    entityType: "order" as EntityType,
  };

  if (orderId) {
    filters.entityId = orderId;
  }

  if (options.startDate || options.endDate) {
    filters.startDate = options.startDate;
    filters.endDate = options.endDate;
  }

  return await AuditLog.getRecentActivity(options.limit || 100, filters);
};

// Get user management activity
export const getUserManagementActivity = async (
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<IAuditLog[]> => {
  await ensureConnection();

  const filters: any = {
    entityType: "user" as EntityType,
  };

  if (options.startDate || options.endDate) {
    filters.startDate = options.startDate;
    filters.endDate = options.endDate;
  }

  return await AuditLog.getRecentActivity(options.limit || 100, filters);
};

// Get settings change activity
export const getSettingsActivity = async (
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<IAuditLog[]> => {
  await ensureConnection();

  const filters: any = {
    entityType: "settings" as EntityType,
    action: "settings_updated" as AuditAction,
  };

  if (options.startDate || options.endDate) {
    filters.startDate = options.startDate;
    filters.endDate = options.endDate;
  }

  return await AuditLog.getRecentActivity(options.limit || 50, filters);
};

// Log order creation
export const logOrderCreation = async (
  orderId: string,
  userId: string,
  details: {
    amount: number;
    merchantName: string;
    vpa: string;
  },
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<IAuditLog> => {
  return await createAuditLog({
    action: "order_created",
    entityType: "order",
    entityId: orderId,
    userId,
    details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

// Log UTR submission
export const logUTRSubmission = async (
  orderId: string,
  userId: string,
  utr: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<IAuditLog> => {
  return await createAuditLog({
    action: "utr_submitted",
    entityType: "order",
    entityId: orderId,
    userId,
    details: { utr },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

// Log order status update
export const logOrderStatusUpdate = async (
  orderId: string,
  userId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<IAuditLog> => {
  return await createAuditLog({
    action: "order_status_updated",
    entityType: "order",
    entityId: orderId,
    userId,
    details: { oldStatus, newStatus, reason },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

// Log user management actions
export const logUserAction = async (
  action: "user_created" | "user_deleted" | "user_role_updated",
  targetUserId: string,
  performedBy: string,
  details: Record<string, any> = {},
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<IAuditLog> => {
  return await createAuditLog({
    action,
    entityType: "user",
    entityId: targetUserId,
    userId: performedBy,
    details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

// Log authentication events
export const logAuthEvent = async (
  action: "login_attempt" | "logout",
  userId: string,
  details: Record<string, any> = {},
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<IAuditLog> => {
  return await createAuditLog({
    action,
    entityType: "auth",
    userId,
    details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

// Cleanup old audit logs (for maintenance)
export const cleanupOldLogs = async (
  olderThanDays: number = 365
): Promise<number> => {
  await ensureConnection();

  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await AuditLog.deleteMany({
    timestamp: { $lt: cutoffDate },
  });

  return result.deletedCount || 0;
};
