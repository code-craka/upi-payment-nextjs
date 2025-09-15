import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(() => ({
    userId: "test-user-id",
    sessionClaims: {
      metadata: { role: "merchant" },
    },
  })),
  currentUser: jest.fn(() => ({
    id: "test-user-id",
    emailAddresses: [{ emailAddress: "test@example.com" }],
    firstName: "Test",
    lastName: "User",
    publicMetadata: { role: "merchant" },
  })),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div>User Button</div>,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "test-user-id",
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test-user-id",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      firstName: "Test",
      lastName: "User",
      publicMetadata: { role: "merchant" },
    },
  }),
}));

// Mock MongoDB
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1,
  },
  Schema: jest.fn().mockImplementation(() => ({})),
  model: jest.fn(),
  models: {},
}));

// Mock environment variables
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.CLERK_SECRET_KEY = "test-clerk-secret";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-public";

// Global test timeout
jest.setTimeout(10000);
