import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
      });
    }

    const user = await currentUser();

    return NextResponse.json({
      authenticated: true,
      userId: userId,
      userRole: (sessionClaims?.metadata as any)?.role || "No role assigned",
      publicMetadataRole:
        user?.publicMetadata?.role || "No role in publicMetadata",
      publicMetadata: user?.publicMetadata || {},
      sessionClaims: sessionClaims?.metadata || {},
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.emailAddresses?.[0]?.emailAddress,
      hasAdminAccess: (sessionClaims?.metadata as any)?.role === "admin",
      hasAdminAccessFromPublicMetadata: user?.publicMetadata?.role === "admin",
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
