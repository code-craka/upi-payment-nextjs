# Testing Guide - UPI Payment System

This document provides comprehensive information about the testing strategy, setup, and execution for the UPI Payment System.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Structure](#test-structure)
- [Setup and Installation](#setup-and-installation)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing strategy follows the testing pyramid approach with comprehensive coverage across all layers:

### 1. Unit Tests (70% of tests)

- **API Endpoints**: All REST API routes with various input scenarios
- **Utility Functions**: UPI link generation, validation, formatting
- **Database Models**: CRUD operations and business logic
- **Components**: React components with user interactions

### 2. Integration Tests (20% of tests)

- **Authentication Flow**: Clerk integration and role-based access
- **Database Integration**: MongoDB operations and data consistency
- **API Integration**: End-to-end API workflows

### 3. End-to-End Tests (10% of tests)

- **Payment Workflow**: Complete user journey from order creation to UTR submission
- **Admin Operations**: User management, order verification, system settings
- **Cross-browser Testing**: Chrome, Firefox, Safari compatibility

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── api/                # API endpoint tests
│   │   ├── orders.test.ts
│   │   ├── utr.test.ts
│   │   └── admin-users.test.ts
│   ├── lib/                # Library function tests
│   │pi-links.test.ts
│   │   └── validation.test.ts
│   └── components/         # Component tests
│       └── payment-components.test.tsx
├── integration/            # Integration tests
│   └── auth.test.ts
├── e2e/                   # End-to-end tests
│   ├── payment-workflow.spec.ts
│   └── admin-operations.spec.ts
└── performance/           # Performance tests
    └── api-performance.test.ts
```

## Setup and Installation

### Prerequisites

1. **Node.js 22+** and **pnpm** package manager
2. **MongoDB** instance (local or Atlas)
3. **Clerk** account for authentication testing

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (for E2E tests)
pnpm playwright install

# Set up test environment variables
cp .env.example .env.test
```

### Environment Configuration

Create a `.env.test` file with test-specific configurations:

```env
# Test Database
MONGODB_URI=mongodb://localhost:27017/upi_payment_test

# Test Clerk Configuration
CLERK_SECRET_KEY=test_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=test_clerk_public_key

# Test URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Running Tests

### Quick Start

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:performance
```

### Advanced Test Runner

Use our custom test runner for more control:

```bash
# Run all tests with detailed output
node scripts/test-runner.js all

# Run specific test type
node scripts/test-runner.js unit
node scripts/test-runner.js integration
node scripts/test-runner.js e2e
node scripts/test-runner.js performance

# Skip linting and type checking
node scripts/test-runner.js unit --no-lint

# Show help
node scripts/test-runner.js --help
```

### Watch Mode

```bash
# Run tests in watch mode during development
pnpm test:watch

# Watch specific test files
pnpm jest tests/unit/api/orders.test.ts --watch
```

## Test Types

### Unit Tests

#### API Endpoint Tests

Test all API routes with comprehensive scenarios:

```typescript
// Example: Order creation API test
describe("POST /api/orders", () => {
  it("should create order with valid data", async () => {
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(response.body.orderId).toBeDefined();
  });

  it("should return 400 with invalid amount", async () => {
    const response = await POST(invalidRequest);
    expect(response.status).toBe(400);
  });
});
```

#### Utility Function Tests

Test business logic and helper functions:

```typescript
// Example: UPI link generation test
describe("generateUpiLink", () => {
  it("should generate correct UPI link format", () => {
    const link = generateUpiLink(params);
    expect(link).toContain("upi://pay?");
    expect(link).toContain("pa=test%40upi");
  });
});
```

#### Component Tests

Test React components with user interactions:

```typescript
// Example: Payment component test
describe('CountdownTimer', () => {
  it('should call onExpire when timer reaches zero', async () => {
    render(<CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />)
    await waitFor(() => expect(onExpire).toHaveBeenCalled())
  })
})
```

### Integration Tests

#### Authentication Integration

Test Clerk authentication and role-based access:

```typescript
describe("Authentication Integration", () => {
  it("should authenticate valid user", async () => {
    const authResult = await authenticateRequest(request);
    expect(authResult.userId).toBe("user-123");
  });

  it("should enforce admin access", () => {
    expect(() => requireAdmin(merchantAuth)).toThrow("Admin access required");
  });
});
```

### End-to-End Tests

#### Payment Workflow

Test complete user journeys:

```typescript
test("Complete payment workflow", async ({ page }) => {
  // Create payment link
  await page.goto("/dashboard");
  await page.fill('[data-testid="amount-input"]', "100");
  await page.click('[data-testid="create-link-button"]');

  // Navigate to payment page
  await page.goto(`/pay/${orderId}`);

  // Submit UTR
  await page.fill('[data-testid="utr-input"]', "123456789012");
  await page.click('[data-testid="submit-utr-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

#### Admin Operations

Test administrative functions:

```typescript
test("Admin can manage users", async ({ page }) => {
  await page.goto("/admin");
  await page.click('[data-testid="create-user-button"]');

  // Fill user form and submit
  await page.fill('[data-testid="email-input"]', "newuser@example.com");
  await page.click('[data-testid="submit-user-button"]');

  // Verify user created
  await expect(page.locator('[data-testid="user-table"]')).toContainText(
    "newuser@example.com"
  );
});
```

### Performance Tests

#### API Performance

Test response times and throughput:

```typescript
describe("API Performance", () => {
  it("should create orders within 500ms", async () => {
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await simulateOrderCreation(data);
      times.push(performance.now() - start);
    }

    const averageTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    expect(averageTime).toBeLessThan(500);
  });
});
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Exclusions

The following files are excluded from coverage requirements:

- Configuration files (`*.config.js`, `*.config.ts`)
- Type definition files (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Build artifacts (`.next/`, `dist/`)

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm lint

      - name: Run type checking
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration

      - name: Run performance tests
        run: pnpm test:performance

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Set up pre-commit hooks to run tests automatically:

```bash
# Install husky
pnpm add -D husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "pnpm test:unit && pnpm lint"
```

## Test Data Management

### Test Database

- Use separate test database: `upi_payment_test`
- Reset database before each test suite
- Use factories for consistent test data

### Mock Data

```typescript
// Test data factories
const createMockOrder = (overrides = {}) => ({
  orderId: "TEST123",
  amount: 100,
  merchantName: "Test Merchant",
  vpa: "test@upi",
  status: "pending",
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  role: "merchant",
  ...overrides,
});
```

## Debugging Tests

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* pnpm test:unit

# Run specific test with debugging
pnpm jest tests/unit/api/orders.test.ts --verbose --no-cache
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "--no-coverage"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Errors

```bash
# Ensure MongoDB is running
brew services start mongodb-community

# Check connection
mongosh mongodb://localhost:27017/upi_payment_test
```

#### 2. Clerk Authentication Errors

```bash
# Verify environment variables
echo $CLERK_SECRET_KEY
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

#### 3. Playwright Browser Issues

```bash
# Reinstall browsers
pnpm playwright install --force

# Run with headed mode for debugging
pnpm playwright test --headed
```

#### 4. Port Conflicts

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

### Test Isolation Issues

- Ensure tests don't depend on each other
- Reset database state between tests
- Clear mocks in `beforeEach` hooks
- Use unique test data for each test

### Performance Test Failures

- Run performance tests on consistent hardware
- Account for system load variations
- Use relative performance comparisons
- Set reasonable thresholds based on environment

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should explain what is being tested
3. **Test One Thing**: Each test should verify a single behavior
4. **Use Factories**: Create reusable test data factories
5. **Mock External Dependencies**: Isolate units under test

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Consistent Structure**: Follow established patterns across test files
3. **Clear Setup/Teardown**: Use `beforeEach`/`afterEach` appropriately
4. **Shared Utilities**: Extract common test utilities

### Maintenance

1. **Keep Tests Updated**: Update tests when code changes
2. **Remove Obsolete Tests**: Delete tests for removed features
3. **Refactor Test Code**: Apply same quality standards as production code
4. **Monitor Coverage**: Regularly review coverage reports

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For testing-related questions or issues:

1. Check this documentation first
2. Review existing test examples
3. Search for similar issues in the codebase
4. Create an issue with detailed reproduction steps
