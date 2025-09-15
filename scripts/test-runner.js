#!/usr/bin/env node

/**
 * Comprehensive test runner for UPI Payment System
 * Runs different types of tests based on command line arguments
 */

const { execSync } = require("child_process");
const path = require("path");

const TEST_TYPES = {
  unit: "Unit Tests",
  integration: "Integration Tests",
  e2e: "End-to-End Tests",
  performance: "Performance Tests",
  all: "All Tests",
};

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader(title) {
  console.log("\n" + "=".repeat(60));
  console.log(colorize(title, "cyan"));
  console.log("=".repeat(60));
}

function printSection(title) {
  console.log("\n" + colorize(title, "yellow"));
  console.log("-".repeat(40));
}

function runCommand(command, description) {
  try {
    console.log(colorize(`Running: ${description}`, "blue"));
    console.log(colorize(`Command: ${command}`, "magenta"));

    const output = execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log(colorize("✓ Success", "green"));
    return true;
  } catch (error) {
    console.error(colorize("✗ Failed", "red"));
    console.error(colorize(`Error: ${error.message}`, "red"));
    return false;
  }
}

function runUnitTests() {
  printSection("Unit Tests");

  const commands = [
    {
      cmd: "pnpm jest tests/unit --coverage --verbose",
      desc: "API and Library Unit Tests",
    },
  ];

  let allPassed = true;
  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runIntegrationTests() {
  printSection("Integration Tests");

  const commands = [
    {
      cmd: "pnpm jest tests/integration --verbose",
      desc: "Authentication and Database Integration Tests",
    },
  ];

  let allPassed = true;
  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runE2ETests() {
  printSection("End-to-End Tests");

  // Check if development server is running
  console.log(
    colorize(
      "Note: Make sure the development server is running on http://localhost:3000",
      "yellow"
    )
  );

  const commands = [
    {
      cmd: "pnpm playwright test --reporter=html",
      desc: "Payment Workflow and Admin Operations E2E Tests",
    },
  ];

  let allPassed = true;
  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runPerformanceTests() {
  printSection("Performance Tests");

  const commands = [
    {
      cmd: "pnpm jest tests/performance --verbose --runInBand",
      desc: "API Performance and Load Tests",
    },
  ];

  let allPassed = true;
  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runLinting() {
  printSection("Code Quality Checks");

  const commands = [
    {
      cmd: "pnpm lint",
      desc: "ESLint Code Quality Check",
    },
    {
      cmd: "pnpm type-check",
      desc: "TypeScript Type Checking",
    },
  ];

  let allPassed = true;
  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function generateTestReport(results) {
  printSection("Test Results Summary");

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total test suites: ${totalTests}`);
  console.log(colorize(`Passed: ${passedTests}`, "green"));

  if (failedTests > 0) {
    console.log(colorize(`Failed: ${failedTests}`, "red"));
  }

  console.log("\nDetailed Results:");
  for (const [testType, passed] of Object.entries(results)) {
    const status = passed
      ? colorize("✓ PASS", "green")
      : colorize("✗ FAIL", "red");
    console.log(`  ${TEST_TYPES[testType]}: ${status}`);
  }

  const overallStatus = failedTests === 0 ? "PASSED" : "FAILED";
  const statusColor = failedTests === 0 ? "green" : "red";

  console.log("\n" + colorize(`Overall Status: ${overallStatus}`, statusColor));

  return failedTests === 0;
}

function showUsage() {
  console.log(colorize("UPI Payment System Test Runner", "cyan"));
  console.log("\nUsage: node scripts/test-runner.js [test-type] [options]");
  console.log("\nTest Types:");

  for (const [key, description] of Object.entries(TEST_TYPES)) {
    console.log(`  ${colorize(key.padEnd(12), "yellow")} ${description}`);
  }

  console.log("\nOptions:");
  console.log(
    `  ${colorize("--no-lint", "yellow")}     Skip linting and type checking`
  );
  console.log(
    `  ${colorize("--help", "yellow")}        Show this help message`
  );

  console.log("\nExamples:");
  console.log("  node scripts/test-runner.js unit");
  console.log("  node scripts/test-runner.js all --no-lint");
  console.log("  node scripts/test-runner.js e2e");
}

function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || "all";
  const skipLint = args.includes("--no-lint");

  if (args.includes("--help") || !TEST_TYPES[testType]) {
    showUsage();
    process.exit(0);
  }

  printHeader(`UPI Payment System - ${TEST_TYPES[testType]}`);

  const results = {};

  // Run linting first (unless skipped)
  if (!skipLint) {
    results.lint = runLinting();
  }

  // Run requested tests
  switch (testType) {
    case "unit":
      results.unit = runUnitTests();
      break;

    case "integration":
      results.integration = runIntegrationTests();
      break;

    case "e2e":
      results.e2e = runE2ETests();
      break;

    case "performance":
      results.performance = runPerformanceTests();
      break;

    case "all":
      results.unit = runUnitTests();
      results.integration = runIntegrationTests();
      results.performance = runPerformanceTests();

      console.log(
        colorize(
          "\nNote: E2E tests require manual server setup. Run separately with:",
          "yellow"
        )
      );
      console.log(colorize("node scripts/test-runner.js e2e", "cyan"));
      break;

    default:
      console.error(colorize(`Unknown test type: ${testType}`, "red"));
      showUsage();
      process.exit(1);
  }

  // Generate final report
  const success = generateTestReport(results);

  process.exit(success ? 0 : 1);
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(colorize("Uncaught Exception:", "red"));
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colorize("Unhandled Rejection at:", "red"), promise);
  console.error(colorize("Reason:", "red"), reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  runPerformanceTests,
  runLinting,
};
