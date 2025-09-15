import { NextRequest } from "next/server";
import {
  createAuditLog,
  logOrderCreation,
  logUTRSubmission,
  logOrderStatusUpdate,
  logUserAction,
  logAuthEvent,
} from "@/lib/db/queries/audit-logs";
import type { AuditAction, EntityType } from "@/lib/db/models/audit-log";

/**
 * Extract client metadata from request headers
 */
export function extractClientMetadata(request: NextRequest) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

/**
 * Generic audit logger for any action
 */
export async function logAuditAction(
  action: AuditAction,
  entityType: EntityType,
  userId: string,
  options: {
    entityId?: string;
    details?: Record<string, any>;
    request?: NextRequest;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  const clientMetadata = options.request
    ? extractClientMetadata(options.request)
    : {
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      };

  return await createAuditLog({
    action,
    entityType,
    userId,
    entityId: options.entityId,
    details: options.details,
    ...clientMetadata,
  });
}

/**
 * Audit logger for order-related actions
 */
export class OrderAuditLogger {
  static async logCreation(
    orderId: string,
    userId: string,
    orderDetails: {
      amount: number;
      merchantName: string;
      vpa: string;
    },
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logOrderCreation(
      orderId,
      userId,
      orderDetails,
      clientMetadata
    );
  }

  static async logUTRSubmission(
    orderId: string,
    userId: string,
    utr: string,
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logUTRSubmission(orderId, userId, utr, clientMetadata);
  }

  static async logStatusUpdate(
    orderId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logOrderStatusUpdate(
      orderId,
      userId,
      oldStatus,
      newStatus,
      reason,
      clientMetadata
    );
  }

  static async logExpiration(
    orderId: string,
    userId: string,
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logOrderStatusUpdate(
      orderId,
      userId,
      "pending",
      "expired",
      "Order expired automatically",
      clientMetadata
    );
  }
}

/**
 * Audit logger for user management actions
 */
export class UserAuditLogger {
  static async logCreation(
    targetUserId: string,
    performedBy: string,
    userDetails: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    },
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logUserAction(
      "user_created",
      targetUserId,
      performedBy,
      userDetails,
      clientMetadata
    );
  }

  static async logDeletion(
    targetUserId: string,
    performedBy: string,
    userDetails: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    },
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logUserAction(
      "user_deleted",
      targetUserId,
      performedBy,
      userDetails,
      clientMetadata
    );
  }

  static async logRoleUpdate(
    targetUserId: string,
    performedBy: string,
    roleChange: {
      oldRole: string;
      newRole: string;
      email?: string;
    },
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logUserAction(
      "user_role_updated",
      targetUserId,
      performedBy,
      roleChange,
      clientMetadata
    );
  }
}

/**
 * Audit logger for authentication events
 */
export class AuthAuditLogger {
  static async logLoginAttempt(
    userId: string,
    success: boolean,
    details: Record<string, any> = {},
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logAuthEvent(
      "login_attempt",
      userId,
      { success, ...details },
      clientMetadata
    );
  }

  static async logLogout(
    userId: string,
    details: Record<string, any> = {},
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logAuthEvent("logout", userId, details, clientMetadata);
  }
}

/**
 * Audit logger for system settings
 */
export class SettingsAuditLogger {
  static async logUpdate(
    userId: string,
    changes: Record<string, { old: any; new: any }>,
    request?: NextRequest
  ) {
    const clientMetadata = request ? extractClientMetadata(request) : {};
    return await logAuditAction("settings_updated", "settings", userId, {
      details: changes,
      ...clientMetadata,
    });
  }
}

/**
 * Batch audit logger for multiple actions
 */
export class BatchAuditLogger {
  private actions: Array<{
    action: AuditAction;
    entityType: EntityType;
    userId: string;
    entityId?: string;
    details?: Record<string, any>;
  }> = [];

  private clientMetadata: {
    ipAddress?: string;
    userAgent?: string;
  } = {};

  constructor(request?: NextRequest) {
    if (request) {
      this.clientMetadata = extractClientMetadata(request);
    }
  }

  add(
    action: AuditAction,
    entityType: EntityType,
    userId: string,
    options: {
      entityId?: string;
      details?: Record<string, any>;
    } = {}
  ) {
    this.actions.push({
      action,
      entityType,
      userId,
      entityId: options.entityId,
      details: options.details,
    });
  }

  async flush() {
    const promises = this.actions.map((actionData) =>
      createAuditLog({
        ...actionData,
        ...this.clientMetadata,
      })
    );

    const results = await Promise.allSettled(promises);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed to log audit action ${index}:`, result.reason);
      }
    });

    // Clear actions after flushing
    this.actions = [];

    return results;
  }
}

/**
 * Middleware helper for automatic audit logging
 */
export function withAuditLogging<T extends any[]>(
  handler: (...args: T) => Promise<any>,
  auditConfig: {
    action: AuditAction;
    entityType: EntityType;
    getUserId: (...args: T) => string;
    getEntityId?: (...args: T) => string;
    getDetails?: (...args: T) => Record<string, any>;
    getRequest?: (...args: T) => NextRequest;
  }
) {
  return async (...args: T) => {
    const result = await handler(...args);

    try {
      await logAuditAction(
        auditConfig.action,
        auditConfig.entityType,
        auditConfig.getUserId(...args),
        {
          entityId: auditConfig.getEntityId?.(...args),
          details: auditConfig.getDetails?.(...args),
          request: auditConfig.getRequest?.(...args),
        }
      );
    } catch (error) {
      console.error("Failed to log audit action:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }

    return result;
  };
}
