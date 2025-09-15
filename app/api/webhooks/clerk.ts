import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { logUserAction } from "@/lib/db/queries/audit-logs";
import { NextRequest, NextResponse } from "next/server";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Check if webhook secret is configured
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not configured");
      return new NextResponse("Webhook secret not configured", { status: 500 });
    }

    // Read raw payload
    const payload = await req.text();

    // Get headers safely
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse("Missing Svix headers", { status: 400 });
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    const evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as any;

    const { type, data } = evt;

    // Get client IP and user agent for audit logging
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "webhook";
    const userAgent = req.headers.get("user-agent") || "clerk-webhook";

    // Handle different events
    if (type === "user.created") {
      try {
        // Set default role if not present
        if (!data.public_metadata?.role) {
          const client = await clerkClient();
          await client.users.updateUser(data.id, {
            publicMetadata: { role: "merchant" },
          });
        }

        // Log user creation
        await logUserAction(
          "user_created",
          data.id,
          "system", // performed by system
          {
            email: data.email_addresses?.[0]?.email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            defaultRole: "merchant",
          },
          {
            ipAddress: clientIP,
            userAgent: userAgent,
          }
        );

        console.log(`User created: ${data.id} with default role: merchant`);
      } catch (error) {
        console.error("Error handling user.created webhook:", error);
        // Don't fail the webhook for audit log errors
      }
    }

    if (type === "user.updated") {
      try {
        const prevRole = data.previous_attributes?.public_metadata?.role;
        const newRole = data.public_metadata?.role;

        if (prevRole && newRole && prevRole !== newRole) {
          await logUserAction(
            "user_role_updated",
            data.id,
            "system", // performed by system (could be admin via dashboard)
            {
              prevRole,
              newRole,
              email: data.email_addresses?.[0]?.email_address,
            },
            {
              ipAddress: clientIP,
              userAgent: userAgent,
            }
          );

          console.log(
            `User role updated: ${data.id} from ${prevRole} to ${newRole}`
          );
        }
      } catch (error) {
        console.error("Error handling user.updated webhook:", error);
        // Don't fail the webhook for audit log errors
      }
    }

    if (type === "user.deleted") {
      try {
        await logUserAction(
          "user_deleted",
          data.id,
          "system", // performed by system
          {
            email: data.email_addresses?.[0]?.email_address,
            deletedAt: new Date().toISOString(),
          },
          {
            ipAddress: clientIP,
            userAgent: userAgent,
          }
        );

        console.log(`User deleted: ${data.id}`);
      } catch (error) {
        console.error("Error handling user.deleted webhook:", error);
        // Don't fail the webhook for audit log errors
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
