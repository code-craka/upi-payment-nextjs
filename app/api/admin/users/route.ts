import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import { logUserAction } from "@/lib/db/queries/audit-logs";
import { z } from "zod";

// Schema for creating a new user
const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "merchant", "viewer"], {
    errorMap: () => ({ message: "Role must be admin, merchant, or viewer" }),
  }),
});

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role");

    // Fetch users from Clerk
    const clerk = await clerkClient();
    const offset = (page - 1) * limit;
    const usersResponse = await clerk.users.getUserList({
      limit,
      offset,
    });

    // Filter by role if specified
    let filteredUsers = usersResponse.data;
    if (role && ["admin", "merchant", "viewer"].includes(role)) {
      filteredUsers = usersResponse.data.filter(
        (user) => user.publicMetadata?.role === role
      );
    }

    // Format user data
    const users = filteredUsers.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.publicMetadata?.role || "viewer",
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      imageUrl: user.imageUrl,
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: usersResponse.totalCount,
        totalPages: Math.ceil(usersResponse.totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // Create user in Clerk
    const clerk = await clerkClient();
    const newUser = await clerk.users.createUser({
      emailAddress: [validatedData.email],
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      publicMetadata: {
        role: validatedData.role,
        onboardingComplete: true,
      },
    });

    // Log user creation
    await logUserAction(
      "user_created",
      newUser.id,
      auth.userId!,
      {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
      },
      {
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    );

    // Format response
    const userResponse = {
      id: newUser.id,
      email: newUser.emailAddresses[0]?.emailAddress || "",
      firstName: newUser.firstName || "",
      lastName: newUser.lastName || "",
      role: newUser.publicMetadata?.role || "viewer",
      createdAt: newUser.createdAt,
      lastSignInAt: newUser.lastSignInAt,
      imageUrl: newUser.imageUrl,
    };

    return NextResponse.json(
      { user: userResponse, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
