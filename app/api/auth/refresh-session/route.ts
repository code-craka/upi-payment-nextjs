import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SessionManager } from "@/lib/utils/session-manager";

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Refresh session in our session manager
    const isValid = await SessionManager.validateSession(sessionId, req);

    if (!isValid) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Session refreshed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json(
      { error: "Session refresh failed" },
      { status: 500 }
    );
  }
}
