import { test, expect } from "@playwright/test";

test.describe("Admin Operations E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      window.__CLERK_PUBLISHABLE_KEY = "test-key";
      window.__clerk_loaded = true;
      // Mock admin user
      window.__clerk_user = {
        id: "admin-123",
        publicMetadata: { role: "admin" },
      };
    });
  });

  test("Admin can manage users successfully", async ({ page }) => {
    await page.goto("/admin");

    // Verify admin dashboard loads
    await expect(page.locator("h1")).toContainText("Admin Dashboard");

    // Navigate to user management
    await page.click('[data-testid="user-management-tab"]');

    // Verify user management section
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();

    // Test user creation
    await page.click('[data-testid="create-user-button"]');

    // Fill user creation form
    await page.fill('[data-testid="email-input"]', "newuser@example.com");
    await page.fill('[data-testid="first-name-input"]', "John");
    await page.fill('[data-testid="last-name-input"]', "Doe");
    await page.selectOption('[data-testid="role-select"]', "merchant");

    // Submit form
    await page.click('[data-testid="submit-user-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "User created successfully"
    );

    // Verify new user appears in table
    await expect(page.locator('[data-testid="user-table"]')).toContainText(
      "newuser@example.com"
    );
    await expect(page.locator('[data-testid="user-table"]')).toContainText(
      "John Doe"
    );
    await expect(page.locator('[data-testid="user-table"]')).toContainText(
      "merchant"
    );
  });

  test("Admin can update user roles", async ({ page }) => {
    await page.goto("/admin");
    await page.click('[data-testid="user-management-tab"]');

    // Find existing user and click edit
    const userRow = page.locator('[data-testid="user-row"]').first();
    await userRow.locator('[data-testid="edit-user-button"]').click();

    // Change role
    await page.selectOption('[data-testid="role-select"]', "admin");
    await page.click('[data-testid="save-user-button"]');

    // Verify role updated
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "User updated successfully"
    );
    await expect(userRow).toContainText("admin");
  });

  test("Admin can delete users", async ({ page }) => {
    await page.goto("/admin");
    await page.click('[data-testid="user-management-tab"]');

    // Get initial user count
    const initialUserCount = await page
      .locator('[data-testid="user-row"]')
      .count();

    // Delete first user
    const userRow = page.locator('[data-testid="user-row"]').first();
    const userEmail = await userRow
      .locator('[data-testid="user-email"]')
      .textContent();

    await userRow.locator('[data-testid="delete-user-button"]').click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify user deleted
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "User deleted successfully"
    );

    // Verify user count decreased
    const newUserCount = await page.locator('[data-testid="user-row"]').count();
    expect(newUserCount).toBe(initialUserCount - 1);

    // Verify specific user no longer exists
    await expect(page.locator('[data-testid="user-table"]')).not.toContainText(
      userEmail || ""
    );
  });

  test("Admin can view and manage orders", async ({ page }) => {
    await page.goto("/admin");

    // Navigate to orders overview
    await page.click('[data-testid="orders-overview-tab"]');

    // Verify orders table loads
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Test order filtering
    await page.selectOption(
      '[data-testid="status-filter"]',
      "pending-verification"
    );
    await page.click('[data-testid="apply-filter-button"]');

    // Verify filtered results
    const orderRows = page.locator('[data-testid="order-row"]');
    for (let i = 0; i < (await orderRows.count()); i++) {
      await expect(orderRows.nth(i)).toContainText("pending-verification");
    }

    // Test order status update
    const firstOrder = orderRows.first();
    await firstOrder.locator('[data-testid="update-status-button"]').click();

    await page.selectOption('[data-testid="new-status-select"]', "completed");
    await page.click('[data-testid="confirm-status-update"]');

    // Verify status updated
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Order status updated"
    );
    await expect(firstOrder).toContainText("completed");
  });

  test("Admin can view analytics and statistics", async ({ page }) => {
    await page.goto("/admin");

    // Navigate to analytics
    await page.click('[data-testid="analytics-tab"]');

    // Verify analytics dashboard loads
    await expect(
      page.locator('[data-testid="analytics-dashboard"]')
    ).toBeVisible();

    // Verify key metrics are displayed
    await expect(
      page.locator('[data-testid="total-orders-metric"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="total-revenue-metric"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="success-rate-metric"]')
    ).toBeVisible();

    // Verify charts are rendered
    await expect(page.locator('[data-testid="orders-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Test date range filtering
    await page.click('[data-testid="date-range-picker"]');
    await page.click('[data-testid="last-7-days"]');

    // Verify charts update
    await expect(
      page.locator('[data-testid="loading-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="loading-indicator"]')
    ).not.toBeVisible();
  });

  test("Admin can manage system settings", async ({ page }) => {
    await page.goto("/admin");

    // Navigate to settings
    await page.click('[data-testid="settings-tab"]');

    // Verify settings form loads
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();

    // Update timer duration
    await page.fill('[data-testid="timer-duration-input"]', "15");

    // Update static UPI ID
    await page.fill('[data-testid="static-upi-input"]', "admin@upi");

    // Toggle UPI apps
    await page.uncheck('[data-testid="paytm-toggle"]');
    await page.check('[data-testid="bhim-toggle"]');

    // Save settings
    await page.click('[data-testid="save-settings-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Settings updated successfully"
    );

    // Verify settings are persisted
    await page.reload();
    await page.click('[data-testid="settings-tab"]');

    await expect(
      page.locator('[data-testid="timer-duration-input"]')
    ).toHaveValue("15");
    await expect(page.locator('[data-testid="static-upi-input"]')).toHaveValue(
      "admin@upi"
    );
    await expect(
      page.locator('[data-testid="paytm-toggle"]')
    ).not.toBeChecked();
    await expect(page.locator('[data-testid="bhim-toggle"]')).toBeChecked();
  });

  test("Admin can view audit logs", async ({ page }) => {
    await page.goto("/admin");

    // Navigate to audit logs
    await page.click('[data-testid="audit-logs-tab"]');

    // Verify audit logs table loads
    await expect(
      page.locator('[data-testid="audit-logs-table"]')
    ).toBeVisible();

    // Verify log entries have required fields
    const logRows = page.locator('[data-testid="audit-log-row"]');
    const firstLog = logRows.first();

    await expect(
      firstLog.locator('[data-testid="log-timestamp"]')
    ).toBeVisible();
    await expect(firstLog.locator('[data-testid="log-action"]')).toBeVisible();
    await expect(firstLog.locator('[data-testid="log-user"]')).toBeVisible();
    await expect(firstLog.locator('[data-testid="log-entity"]')).toBeVisible();

    // Test log filtering
    await page.selectOption('[data-testid="action-filter"]', "order_created");
    await page.click('[data-testid="apply-log-filter"]');

    // Verify filtered results
    for (let i = 0; i < (await logRows.count()); i++) {
      await expect(
        logRows.nth(i).locator('[data-testid="log-action"]')
      ).toContainText("order_created");
    }

    // Test date range filtering
    await page.click('[data-testid="log-date-from"]');
    await page.fill('[data-testid="log-date-from"]', "2023-01-01");
    await page.click('[data-testid="apply-log-filter"]');

    // Verify date filtering works
    await expect(
      page.locator('[data-testid="audit-logs-table"]')
    ).toBeVisible();
  });

  test("Admin dashboard shows real-time statistics", async ({ page }) => {
    await page.goto("/admin");

    // Verify dashboard overview
    await expect(
      page.locator('[data-testid="dashboard-overview"]')
    ).toBeVisible();

    // Verify real-time metrics
    await expect(
      page.locator('[data-testid="active-orders-count"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="pending-verification-count"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="today-revenue"]')).toBeVisible();

    // Verify recent activity feed
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    const activityItems = page.locator('[data-testid="activity-item"]');

    if ((await activityItems.count()) > 0) {
      const firstActivity = activityItems.first();
      await expect(
        firstActivity.locator('[data-testid="activity-time"]')
      ).toBeVisible();
      await expect(
        firstActivity.locator('[data-testid="activity-description"]')
      ).toBeVisible();
    }

    // Test auto-refresh functionality
    const initialOrderCount = await page
      .locator('[data-testid="active-orders-count"]')
      .textContent();

    // Wait for potential auto-refresh (if implemented)
    await page.waitForTimeout(5000);

    // Verify page is still functional after auto-refresh
    await expect(
      page.locator('[data-testid="dashboard-overview"]')
    ).toBeVisible();
  });

  test("Admin can export data", async ({ page }) => {
    await page.goto("/admin");

    // Navigate to orders
    await page.click('[data-testid="orders-overview-tab"]');

    // Test CSV export
    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="export-csv-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain(".csv");

    // Test filtered export
    await page.selectOption('[data-testid="status-filter"]', "completed");
    await page.click('[data-testid="apply-filter-button"]');

    const filteredDownloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="export-filtered-csv-button"]');
    const filteredDownload = await filteredDownloadPromise;

    expect(filteredDownload.suggestedFilename()).toContain("completed");
  });

  test("Admin interface handles errors gracefully", async ({ page }) => {
    // Mock API errors
    await page.route("**/api/admin/users", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/admin");
    await page.click('[data-testid="user-management-tab"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Failed to load users"
    );

    // Verify retry functionality
    await page.unroute("**/api/admin/users");
    await page.route("**/api/admin/users", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [],
          pagination: { page: 1, totalPages: 1, total: 0 },
        }),
      });
    });

    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
  });

  test("Admin can search and filter data efficiently", async ({ page }) => {
    await page.goto("/admin");
    await page.click('[data-testid="orders-overview-tab"]');

    // Test search functionality
    await page.fill('[data-testid="search-input"]', "ORDER123");
    await page.click('[data-testid="search-button"]');

    // Verify search results
    const searchResults = page.locator('[data-testid="order-row"]');
    for (let i = 0; i < (await searchResults.count()); i++) {
      await expect(searchResults.nth(i)).toContainText("ORDER123");
    }

    // Test multiple filters
    await page.selectOption('[data-testid="status-filter"]', "pending");
    await page.selectOption('[data-testid="merchant-filter"]', "Test Merchant");
    await page.click('[data-testid="apply-filters-button"]');

    // Verify combined filtering
    const filteredResults = page.locator('[data-testid="order-row"]');
    for (let i = 0; i < (await filteredResults.count()); i++) {
      const row = filteredResults.nth(i);
      await expect(row).toContainText("pending");
      await expect(row).toContainText("Test Merchant");
    }

    // Test clear filters
    await page.click('[data-testid="clear-filters-button"]');
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue("");
    await expect(page.locator('[data-testid="status-filter"]')).toHaveValue("");
  });
});
