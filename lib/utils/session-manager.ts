import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export interface SessionInfo {
  userId: string;
  sessionId: string;
  role: string;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_SESSIONS_PER_USER = 5;
  private static activeSessions = new Map<string, SessionInfo>();

  /**
   * Create or update session information
   */
  static async createSession(req: NextRequest): Promise<SessionInfo | null> {
    try {
      const { userId, sessionId } = await auth();

      if (!userId || !sessionId) {
        return null;
      }

      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = (user.publicMetadata?.role as string) || "viewer";

      const sessionInfo: SessionInfo = {
        userId,
        sessionId,
        role,
        lastActivity: Date.now(),
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      };

      // Store session
      this.activeSessions.set(sessionId, sessionInfo);

      // Clean up old sessions for this user
      await this.cleanupUserSessions(userId);

      return sessionInfo;
    } catch (error) {
      console.error("Session creation error:", error);
      return null;
    }
  }

  /**
   * Validate and update session
   */
  static async validateSession(
    sessionId: string,
    req: NextRequest
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return false;
    }

    // Check session timeout
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    // Validate IP address (optional security check)
    const currentIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (session.ipAddress !== currentIP) {
      console.warn(`IP address mismatch for session ${sessionId}`);
      // Optionally invalidate session on IP change
      // this.activeSessions.delete(sessionId)
      // return false
    }

    // Update last activity
    session.lastActivity = Date.now();
    this.activeSessions.set(sessionId, session);

    return true;
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);

    try {
      // Also revoke session in Clerk
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    } catch (error) {
      console.error("Error revoking Clerk session:", error);
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateUserSessions(userId: string): Promise<void> {
    // Remove from local storage
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }

    try {
      // Revoke all Clerk sessions for user
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const sessions = await client.sessions.getSessionList({ userId });
      for (const session of sessions.data) {
        await client.sessions.revokeSession(session.id);
      }
    } catch (error) {
      console.error("Error revoking user sessions:", error);
    }
  }

  /**
   * Clean up expired sessions
   */
  static cleanupExpiredSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Clean up old sessions for a user (keep only recent ones)
   */
  private static async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.userId === userId)
      .sort(([_, a], [__, b]) => b.lastActivity - a.lastActivity);

    // Keep only the most recent sessions
    if (userSessions.length > this.MAX_SESSIONS_PER_USER) {
      const sessionsToRemove = userSessions.slice(this.MAX_SESSIONS_PER_USER);

      for (const [sessionId] of sessionsToRemove) {
        await this.invalidateSession(sessionId);
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  static getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Get session statistics
   */
  static getSessionStats(): {
    totalSessions: number;
    activeUsers: number;
    sessionsByRole: Record<string, number>;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const uniqueUsers = new Set(sessions.map((s) => s.userId));
    const sessionsByRole: Record<string, number> = {};

    for (const session of sessions) {
      sessionsByRole[session.role] = (sessionsByRole[session.role] || 0) + 1;
    }

    return {
      totalSessions: sessions.length,
      activeUsers: uniqueUsers.size,
      sessionsByRole,
    };
  }

  /**
   * Force logout user from all devices
   */
  static async forceLogout(
    userId: string,
    reason: string = "Administrative action"
  ): Promise<void> {
    console.log(`Force logout for user ${userId}: ${reason}`);
    await this.invalidateUserSessions(userId);
  }
}

// Clean up expired sessions every 5 minutes
setInterval(
  () => {
    SessionManager.cleanupExpiredSessions();
  },
  5 * 60 * 1000
);

/**
 * Middleware wrapper for session management
 */
export async function withSessionManagement(
  req: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    const session = await SessionManager.createSession(req);

    if (session) {
      // Add session info to request headers for downstream use
      const response = await handler();
      // Always ensure we return the response with headers
      response.headers.set("X-Session-ID", session.sessionId);
      response.headers.set("X-User-Role", session.role);
      return response;
    }

    return handler();
  } catch (error) {
    console.error("Session management error:", error);
    return handler();
  }
}

/**
 * Client-side logout utility
 */
export class ClientSessionManager {
  /**
   * Perform secure logout
   */
  static async logout(): Promise<void> {
    try {
      // Clear any client-side data
      if (typeof window !== "undefined") {
        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear any cached data
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        }
      }

      // Call logout API to invalidate server session
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Redirect to sign-in page
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if API call fails
      window.location.href = "/sign-in";
    }
  }

  /**
   * Check if session is still valid
   */
  static async checkSession(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/session-check", {
        method: "GET",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Session check error:", error);
      return false;
    }
  }

  /**
   * Refresh session activity
   */
  static async refreshSession(): Promise<void> {
    try {
      await fetch("/api/auth/refresh-session", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Session refresh error:", error);
    }
  }
}
