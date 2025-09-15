import { test, expect } from "@playwright/test";

test.describe("Payment Workflow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.addInitScript(() => {
      // Mock Clerk authentication
      window.__CLERK_PUBLISHABLE_KEY = "test-key";
      window.__clerk_loaded = true;
    });
  });

  test("Complete payment workflow - Order creation to UTR submission", async ({
    page,
  }) => {
    // Step 1: Navigate to dashboard and create payment link
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await expect(page.locator("h1")).toContainText("Merchant Dashboard");

    // Fill payment link form
    await page.fill('[data-testid="amount-input"]', "100");
    await page.fill('[data-testid="merchant-name-input"]', "Test Merchant");
    await page.fill('[data-testid="vpa-input"]', "test@upi");

    // Create payment link
    await page.click('[data-testid="create-link-button"]');

    // Wait for success message and get payment link
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    const paymentLink = await page
      .locator('[data-testid="payment-link"]')
      .textContent();

    expect(paymentLink).toContain("/pay/");

    // Step 2: Navigate to payment page
    const orderId = paymentLink?.split("/pay/")[1];
    await page.goto(`/pay/${orderId}`);

    // Verify payment page loads correctly
    await expect(page.locator('[data-testid="order-amount"]')).toContainText(
      "₹100"
    );
    await expect(page.locator('[data-testid="merchant-name"]')).toContainText(
      "Test Merchant"
    );
    await expect(page.locator('[data-testid="upi-id"]')).toContainText(
      "test@upi"
    );

    // Verify countdown timer is present
    await expect(page.locator('[data-testid="countdown-timer"]')).toBeVisible();

    // Step 3: Test UPI app buttons
    const upiButtons = page.locator('[data-testid^="upi-button-"]');
    await expect(upiButtons).toHaveCount(4); // GPay, PhonePe, Paytm, BHIM

    // Test GPay button
    const gpayButton = page.locator('[data-testid="upi-button-gpay"]');
    await expect(gpayButton).toBeVisible();
    await expect(gpayButton).toContainText("Google Pay");

    // Step 4: Test copy functionality
    await page.click('[data-testid="copy-upi-id"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();

    await page.click('[data-testid="copy-amount"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();

    // Step 5: Submit UTR
    const utrInput = page.locator('[data-testid="utr-input"]');
    await expect(utrInput).toBeVisible();

    await utrInput.fill("123456789012");
    await page.click('[data-testid="submit-utr-button"]');

    // Verify UTR submission success
    await expect(
      page.locator('[data-testid="utr-success-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="utr-success-message"]')
    ).toContainText("UTR submitted successfully");

    // Verify order status updated
    await expect(page.locator('[data-testid="order-status"]')).toContainText(
      "pending-verification"
    );
  });

  test("Payment page handles expired orders correctly", async ({ page }) => {
    // Create an expired order (this would need to be set up in test data)
    await page.goto("/pay/EXPIRED_ORDER_ID");

    // Verify expired state
    await expect(page.locator('[data-testid="expired-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="expired-message"]')).toContainText(
      "Order has expired"
    );

    // Verify UPI buttons are disabled
    const upiButtons = page.locator('[data-testid^="upi-button-"]');
    for (let i = 0; i < (await upiButtons.count()); i++) {
      await expect(upiButtons.nth(i)).toBeDisabled();
    }

    // Verify UTR input is disabled
    await expect(page.locator('[data-testid="utr-input"]')).toBeDisabled();
  });

  test("Payment page validates UTR format", async ({ page }) => {
    await page.goto("/pay/VALID_ORDER_ID");

    const utrInput = page.locator('[data-testid="utr-input"]');
    const submitButton = page.locator('[data-testid="submit-utr-button"]');

    // Test invalid UTR formats
    await utrInput.fill("123"); // Too short
    await submitButton.click();
    await expect(page.locator('[data-testid="utr-error"]')).toContainText(
      "UTR must be 12-digit alphanumeric"
    );

    await utrInput.fill("1234567890123"); // Too long
    await submitButton.click();
    await expect(page.locator('[data-testid="utr-error"]')).toContainText(
      "UTR must be 12-digit alphanumeric"
    );

    await utrInput.fill("12345678901@"); // Invalid character
    await submitButton.click();
    await expect(page.locator('[data-testid="utr-error"]')).toContainText(
      "UTR must be 12-digit alphanumeric"
    );

    // Test valid UTR
    await utrInput.fill("123456789012");
    await submitButton.click();
    await expect(page.locator('[data-testid="utr-error"]')).not.toBeVisible();
  });

  test("UPI app buttons handle app detection and fallback", async ({
    page,
  }) => {
    await page.goto("/pay/VALID_ORDER_ID");

    // Mock app detection
    await page.addInitScript(() => {
      // Mock that no UPI apps are installed
      window.navigator.userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    });

    // Click GPay button
    const gpayButton = page.locator('[data-testid="upi-button-gpay"]');
    await gpayButton.click();

    // Should show app store fallback after timeout
    await page.waitForTimeout(3500); // Wait for fallback timeout

    // Verify fallback behavior (this would depend on implementation)
    // Could check for app store redirect or fallback UI
  });

  test("Manual UPI payment option works correctly", async ({ page }) => {
    await page.goto("/pay/VALID_ORDER_ID");

    // Click manual UPI option
    await page.click('[data-testid="manual-upi-toggle"]');

    // Verify manual UPI section is visible
    await expect(
      page.locator('[data-testid="manual-upi-section"]')
    ).toBeVisible();

    // Verify QR code is displayed
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

    // Verify UPI ID and amount are copyable
    await expect(page.locator('[data-testid="copy-upi-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="copy-amount"]')).toBeVisible();

    // Test copy functionality
    await page.click('[data-testid="copy-upi-id"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  });

  test("Payment page is mobile responsive", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/pay/VALID_ORDER_ID");

    // Verify mobile layout
    await expect(
      page.locator('[data-testid="payment-container"]')
    ).toBeVisible();

    // Verify UPI buttons are touch-friendly
    const upiButtons = page.locator('[data-testid^="upi-button-"]');
    for (let i = 0; i < (await upiButtons.count()); i++) {
      const button = upiButtons.nth(i);
      const boundingBox = await button.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(44); // Minimum touch target size
    }

    // Verify countdown timer is visible on mobile
    await expect(page.locator('[data-testid="countdown-timer"]')).toBeVisible();

    // Verify UTR input is accessible on mobile
    await expect(page.locator('[data-testid="utr-input"]')).toBeVisible();
  });

  test("Payment page handles network errors gracefully", async ({ page }) => {
    // Intercept API calls and simulate network errors
    await page.route("**/api/orders/*/utr", (route) => {
      route.abort("failed");
    });

    await page.goto("/pay/VALID_ORDER_ID");

    // Try to submit UTR
    await page.fill('[data-testid="utr-input"]', "123456789012");
    await page.click('[data-testid="submit-utr-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test retry functionality
    await page.unroute("**/api/orders/*/utr");
    await page.route("**/api/orders/*/utr", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            orderId: "TEST123",
            utr: "123456789012",
            status: "pending-verification",
          },
        }),
      });
    });

    await page.click('[data-testid="retry-button"]');
    await expect(
      page.locator('[data-testid="utr-success-message"]')
    ).toBeVisible();
  });

  test("Order status tracking works correctly", async ({ page }) => {
    await page.goto("/pay/VALID_ORDER_ID");

    // Initial status should be pending
    await expect(page.locator('[data-testid="order-status"]')).toContainText(
      "pending"
    );

    // Submit UTR
    await page.fill('[data-testid="utr-input"]', "123456789012");
    await page.click('[data-testid="submit-utr-button"]');

    // Status should update to pending-verification
    await expect(page.locator('[data-testid="order-status"]')).toContainText(
      "pending-verification"
    );

    // Verify status indicator styling
    const statusIndicator = page.locator('[data-testid="status-indicator"]');
    await expect(statusIndicator).toHaveClass(/pending-verification/);
  });

  test("Payment page prevents duplicate UTR submission", async ({ page }) => {
    await page.goto("/pay/ORDER_WITH_UTR"); // Order that already has UTR

    // Verify UTR input is disabled or hidden
    const utrInput = page.locator('[data-testid="utr-input"]');
    await expect(utrInput).not.toBeVisible();

    // Verify existing UTR is displayed
    await expect(page.locator('[data-testid="existing-utr"]')).toBeVisible();
    await expect(page.locator('[data-testid="existing-utr"]')).toContainText(
      "UTR: 123456789012"
    );

    // Verify status shows pending-verification
    await expect(page.locator('[data-testid="order-status"]')).toContainText(
      "pending-verification"
    );
  });
});
