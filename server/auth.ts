import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { hash, compare } from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { db } from "./db";
import { users, refreshTokens, invitedUsers, type PublicUserProfile } from "../shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import pkg from "lodash";
const { pick } = pkg;

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

// Extend Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: PublicUserProfile;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header only (never query params).
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as PublicUserProfile;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Admin-only middleware. Must be used after isAuthenticated.
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/**
 * Generate a short-lived access token (10 minutes).
 */
export function generateAccessToken(payload: PublicUserProfile): string {
  return jwt.sign(
    { id: payload.id, user_name: payload.user_name, name: payload.name, role: payload.role },
    JWT_SECRET,
    { expiresIn: "10m" }
  );
}

/**
 * Generate a refresh token (7 days), stored in DB.
 */
export async function generateRefreshToken(payload: PublicUserProfile): Promise<string> {
  const token = jwt.sign({ iss: payload.id }, JWT_SECRET, { expiresIn: "7d" });

  // Upsert: one refresh token per user
  await db
    .insert(refreshTokens)
    .values({ userId: payload.id, token, payload })
    .onConflictDoUpdate({
      target: refreshTokens.userId,
      set: { token, payload },
    });

  return token;
}

/**
 * Verify refresh token and issue new access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    jwt.verify(refreshToken, JWT_SECRET);
  } catch {
    throw new Error("Invalid refresh token");
  }

  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, refreshToken))
    .limit(1);

  if (!record) {
    throw new Error("Refresh token not found");
  }

  return generateAccessToken(record.payload as PublicUserProfile);
}

/**
 * Validate Google ID token, find or create user, return profile.
 */
export async function validateGoogleToken(idToken: string): Promise<PublicUserProfile> {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new Error("Invalid Google ID token");
  }

  if (!payload?.sub || !payload?.email) {
    throw new Error("Invalid Google token payload");
  }

  const { sub: googleId, email, name } = payload;

  // 0. Check if email is invited (skip for existing users)
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.google_id, googleId))
    .limit(1);

  if (!existingUser.length) {
    const invited = await storage.isEmailInvited(email);
    if (!invited) {
      throw new Error("NOT_INVITED");
    }
  }

  // 1. Check if user exists with this Google ID
  const [existingByGoogle] = await db
    .select()
    .from(users)
    .where(eq(users.google_id, googleId))
    .limit(1);

  if (existingByGoogle) {
    return pick(existingByGoogle, ["id", "name", "user_name", "role"]);
  }

  // 2. Check if user exists with same email — link it
  const [existingByEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existingByEmail) {
    // Also check username (some users used email as username)
    const [existingByUsername] = await db
      .select()
      .from(users)
      .where(eq(users.user_name, email))
      .limit(1);

    if (existingByUsername) {
      await db
        .update(users)
        .set({ google_id: googleId, email: existingByUsername.email || email })
        .where(eq(users.id, existingByUsername.id));
      return pick(existingByUsername, ["id", "name", "user_name", "role"]);
    }
  }

  if (existingByEmail) {
    await db
      .update(users)
      .set({ google_id: googleId })
      .where(eq(users.id, existingByEmail.id));
    return pick(existingByEmail, ["id", "name", "user_name", "role"]);
  }

  // 3. Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      name: name || email.split("@")[0],
      user_name: email,
      email,
      google_id: googleId,
    })
    .returning();

  return pick(newUser, ["id", "name", "user_name", "role"]);
}

/**
 * Validate username/password, return profile or null.
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<PublicUserProfile | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.user_name, username))
    .limit(1);

  if (!user?.password) return null;

  const valid = await compare(password, user.password);
  if (!valid) return null;

  return pick(user, ["id", "name", "user_name", "role"]);
}

export { hash, compare };
