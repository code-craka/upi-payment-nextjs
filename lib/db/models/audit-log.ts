import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// Zod validation schemas
export const AuditActionSchema = z.enum([
  "order_created",
  "order_status_updated",
  "utr_submitted",
  "user_created",
  "user_deleted",
  "user_role_updated",
  "settings_updated",
  "login_attempt",
  "logout",
]);

export const EntityTypeSchema = z.enum(["order", "user", "settings", "auth"]);

export const CreateAuditLogSchema = z.object({
  action: AuditActionSchema,
  entityType: EntityTypeSchema,
  entityId: z.string().optional(),
  userId: z.string().min(1),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// TypeScript interfaces
export type AuditAction =
  | "order_created"
  | "order_status_updated"
  | "utr_submitted"
  | "user_created"
  | "user_deleted"
  | "user_role_updated"
  | "settings_updated"
  | "login_attempt"
  | "logout";

export type EntityType = "order" | "user" | "settings" | "auth";

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  userId: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Static methods interface
export interface IAuditLogModel extends Model<IAuditLog> {
  logAction(
    action: AuditAction,
    entityType: EntityType,
    userId: string,
    options?: {
      entityId?: string;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<IAuditLog>;
  getRecentActivity(
    limit?: number,
    filters?: {
      userId?: string;
      action?: AuditAction;
      entityType?: EntityType;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IAuditLog[]>;
  getUserActivity(userId: string, limit?: number): Promise<IAuditLog[]>;
  getEntityHistory(
    entityType: EntityType,
    entityId: string
  ): Promise<IAuditLog[]>;
  getActionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      _id: AuditAction;
      count: number;
      lastOccurrence: Date;
    }>
  >;
}

// Mongoose schema
const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "order_created",
        "order_status_updated",
        "utr_submitted",
        "user_created",
        "user_deleted",
        "user_role_updated",
        "settings_updated",
        "login_attempt",
        "logout",
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["order", "user", "settings", "auth"],
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Indexes for performance optimization
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, action: 1, timestamp: -1 });

// Static methods
AuditLogSchema.statics.logAction = async function (
  action: AuditAction,
  entityType: EntityType,
  userId: string,
  options: {
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  return await this.create({
    action,
    entityType,
    userId,
    entityId: options.entityId,
    details: options.details || {},
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    timestamp: new Date(),
  });
};

AuditLogSchema.statics.getRecentActivity = function (
  limit: number = 50,
  filters: {
    userId?: string;
    action?: AuditAction;
    entityType?: EntityType;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const query: any = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = filters.startDate;
    if (filters.endDate) query.timestamp.$lte = filters.endDate;
  }

  return this.find(query).sort({ timestamp: -1 }).limit(limit);
};

AuditLogSchema.statics.getUserActivity = function (
  userId: string,
  limit: number = 100
) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

AuditLogSchema.statics.getEntityHistory = function (
  entityType: EntityType,
  entityId: string
) {
  return this.find({ entityType, entityId }).sort({ timestamp: -1 });
};

AuditLogSchema.statics.getActionStats = function (
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {};

  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = startDate;
    if (endDate) matchStage.timestamp.$lte = endDate;
  }

  return this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        lastOccurrence: { $max: "$timestamp" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// TTL index for automatic cleanup (optional - keep logs for 1 year)
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

// Create and export the model
const AuditLog = (mongoose.models.AuditLog ||
  mongoose.model<IAuditLog, IAuditLogModel>(
    "AuditLog",
    AuditLogSchema
  )) as IAuditLogModel;

export default AuditLog;
