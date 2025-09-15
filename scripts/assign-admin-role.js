// Script to assign admin role to a user
// Usage: node scripts/assign-admin-role.js <user-email>

const { clerkClient } = require("@clerk/clerk-sdk-node");

async function assignAdminRole(userEmail) {
  try {
    if (!userEmail) {
      console.error("Please provide a user email");
      console.log("Usage: node scripts/assign-admin-role.js <user-email>");
      process.exit(1);
    }

    console.log(`Looking for user with email: ${userEmail}`);

    // Find user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: [userEmail],
    });

    if (users.length === 0) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.id})`);

    // Update user role to admin
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: "admin",
      },
    });

    console.log(`✅ Successfully assigned admin role to ${userEmail}`);
    console.log("The user can now access the admin dashboard");
  } catch (error) {
    console.error("Error assigning admin role:", error);
    process.exit(1);
  }
}

// Get email from command line arguments
const userEmail = process.argv[2];
assignAdminRole(userEmail);
