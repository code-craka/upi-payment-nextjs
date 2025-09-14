import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

// Clerk user types with role metadata
export interface ClerkUserMetadata {
  role: "admin" | "merchant" | "viewer";
  onboardingComplete?: boolean;
  merchantName?: string;
}

// Extended Clerk user interface
export interface ClerkUser {
  id: string;
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  publicMetadata: ClerkUserMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication context types
export interface AuthContext {
  user: ClerkUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  role: "admin" | "merchant" | "viewer" | null;
}

// API authentication types
export interface AuthenticatedRequest {
  userId: string;
  user: ClerkUser;
  role: "admin" | "merchant" | "viewer";
}
