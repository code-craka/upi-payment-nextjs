import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { role: 'admin' },
    },
    isLoaded: true,
  }),
  useClerk: () => ({
    signOut: jest.fn(),
  }),
  auth: () => Promise.resolve({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    sessionClaims: {
      metadata: { role: 'admin' },
    },
  }),
  currentUser: () => Promise.resolve({
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { role: 'admin' },
  }),
  clerkClient: () => ({
    users: {
      getUser: jest.fn(),
      getUserList: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      updateUserMetadata: jest.fn(),
      getCount: jest.fn(),
    },
    sessions: {
      getSessionList: jest.fn(),
      revokeSession: jest.fn(),
    },
  }),
}));

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-key';
process.env.CLERK_SECRET_KEY = 'test-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

// Global test utilities
global.fetch = jest.fn();

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};