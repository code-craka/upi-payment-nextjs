import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/permissions";
import { UserProfile } from "@/components/auth/user-profile";
import { MerchantDashboard } from "@/components/dashboard/merchant-dashboard";
import { DashboardErrorBoundary } from "@/components/error/error-boundary";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = getUserRole(user);

  // Redirect admin users to admin dashboard
  if (role === "admin") {
    redirect("/admin");
  }

  // If user has no role, show a message instead of redirecting
  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Setup Required
            </h1>
            <p className="text-gray-600 mb-6">
              Your account needs to be configured by an administrator before you
              can access the dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your system administrator to assign you a role.
            </p>
            <div className="mt-6">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure user has merchant or viewer access
  if (!["merchant", "viewer"].includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to access this dashboard.
            </p>
            <p className="text-sm text-gray-500">Current role: {role}</p>
            <div className="mt-6">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <MerchantDashboard user={user} role={role} />
    </DashboardErrorBoundary>
  );
}
