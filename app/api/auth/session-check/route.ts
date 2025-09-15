import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SessionManager } from "@/lib/utils/session-manager";

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      return NextResponse.json(
        { valid: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate session in our session manager
    const isValid = await SessionManager.validateSession(sessionId, req);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { valid: true, userId, sessionId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { valid: false, error: "Session validation failed" },
      { status: 500 }
    );
  }
}
