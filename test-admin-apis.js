// Test script to check admin API endpoints
const testEndpoints = ["/api/admin/settings", "/api/admin/stats"];

console.log("Testing admin API endpoints...\n");

testEndpoints.forEach((endpoint) => {
  console.log(`Testing: ${endpoint}`);
  console.log(`URL: http://localhost:3000${endpoint}`);
  console.log(
    "Expected: 401 Unauthorized (without auth) or 403 Forbidden (without admin role)"
  );
  console.log("---");
});

console.log("\nTo test with authentication:");
console.log("1. Sign in to the application");
console.log("2. Open browser dev tools");
console.log("3. Go to Network tab");
console.log("4. Navigate to admin dashboard");
console.log("5. Check the API calls and their responses");
console.log(
  '\nIf you see "Failed to load system settings" or "Failed to fetch statistics":'
);
console.log("- Check if your user has admin role in Clerk");
console.log("- Check browser console for detailed error messages");
console.log("- Check server logs for backend errors");
