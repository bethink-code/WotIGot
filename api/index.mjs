var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/api.ts
import "dotenv/config";
import express2 from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import multer from "multer";
import pkg2 from "lodash";
import { utils, write } from "xlsx";

// server/auth.ts
import jwt from "jsonwebtoken";
import { hash as hash2, compare as compare2 } from "bcrypt";
import { OAuth2Client } from "google-auth-library";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addItemImageSchema: () => addItemImageSchema,
  askPriceSchema: () => askPriceSchema,
  changePasswordSchema: () => changePasswordSchema,
  createUserSchema: () => createUserSchema,
  geocodeSchema: () => geocodeSchema,
  googleAuthSchema: () => googleAuthSchema,
  houses: () => houses,
  insertHouseSchema: () => insertHouseSchema,
  insertItemImageSchema: () => insertItemImageSchema,
  insertItemSchema: () => insertItemSchema,
  insertRoomSchema: () => insertRoomSchema,
  insertUserSchema: () => insertUserSchema,
  invitedUsers: () => invitedUsers,
  itemImages: () => itemImages,
  items: () => items,
  loginSchema: () => loginSchema,
  mediaUploadSchema: () => mediaUploadSchema,
  priceTypeEnum: () => priceTypeEnum,
  priceTypeNameMap: () => priceTypeNameMap,
  reEstimateSchema: () => reEstimateSchema,
  refreshTokens: () => refreshTokens,
  rooms: () => rooms,
  updateProfileSchema: () => updateProfileSchema,
  updateUserSchema: () => updateUserSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  numeric,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum = pgEnum("user_role_enum", ["user", "admin"]);
var priceTypeEnum = pgEnum("item_price_type_enum", ["AI", "user", "invoice"]);
var priceTypeNameMap = {
  AI: "Price suggested by AI",
  user: "Price captured by user",
  invoice: "Price from invoice"
};
var users = pgTable(
  "user",
  {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    user_name: varchar("user_name").notNull(),
    password: varchar("password"),
    google_id: varchar("google_id"),
    email: varchar("email"),
    role: userRoleEnum("role").default("user").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("user_user_name_idx").on(table.user_name),
    uniqueIndex("user_google_id_idx").on(table.google_id)
  ]
);
var refreshTokens = pgTable(
  "refresh_token",
  {
    userId: integer("userId").primaryKey(),
    token: varchar("token").notNull(),
    payload: json("payload").notNull()
  },
  (table) => [index("refresh_token_token_idx").on(table.token)]
);
var houses = pgTable(
  "house",
  {
    id: serial("id").primaryKey(),
    owner_id: integer("owner_id").notNull(),
    name: varchar("name").notNull(),
    address: varchar("address").notNull(),
    image: varchar("image"),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [index("house_owner_id_idx").on(table.owner_id)]
);
var rooms = pgTable(
  "room",
  {
    id: serial("id").primaryKey(),
    house_id: integer("house_id").notNull(),
    owner_id: integer("owner_id").notNull(),
    name: varchar("name").notNull(),
    image: varchar("image"),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("room_house_id_idx").on(table.house_id),
    index("room_owner_id_idx").on(table.owner_id)
  ]
);
var items = pgTable(
  "item",
  {
    id: serial("id").primaryKey(),
    room_id: integer("room_id").notNull(),
    house_id: integer("house_id").notNull(),
    owner_id: integer("owner_id").notNull(),
    image: varchar("image"),
    price: numeric("price"),
    price_type: priceTypeEnum("price_type").default("user").notNull(),
    amount: integer("amount").default(1).notNull(),
    description: varchar("description"),
    category: varchar("category").notNull(),
    brand: varchar("brand").notNull(),
    model: varchar("model").notNull(),
    receipt_image: varchar("receipt_image"),
    serial_number: varchar("serial_number"),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [
    index("item_room_id_idx").on(table.room_id),
    index("item_house_id_idx").on(table.house_id),
    index("item_owner_id_idx").on(table.owner_id)
  ]
);
var itemImages = pgTable(
  "item_image",
  {
    id: serial("id").primaryKey(),
    item_id: integer("item_id").notNull(),
    url: varchar("url").notNull(),
    thumbnail_url: varchar("thumbnail_url"),
    is_primary: boolean("is_primary").default(false).notNull(),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [index("item_image_item_id_idx").on(table.item_id)]
);
var invitedUsers = pgTable(
  "invited_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email").notNull().unique(),
    invited_by: integer("invited_by"),
    created_at: timestamp("created_at").defaultNow().notNull()
  }
);
var insertUserSchema = createInsertSchema(users);
var insertHouseSchema = createInsertSchema(houses).omit({ id: true, owner_id: true, created_at: true });
var insertRoomSchema = createInsertSchema(rooms).omit({ id: true, owner_id: true, created_at: true });
var insertItemSchema = createInsertSchema(items).omit({ id: true, owner_id: true, house_id: true, created_at: true });
var insertItemImageSchema = createInsertSchema(itemImages).omit({ id: true, created_at: true });
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
var googleAuthSchema = z.object({
  id_token: z.string().min(1, "ID token is required")
});
var askPriceSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1)
});
var reEstimateSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  originalBrand: z.string().optional(),
  originalModel: z.string().optional(),
  originalCategory: z.string().optional(),
  originalPrice: z.union([z.string(), z.number()]).optional()
});
var geocodeSchema = z.object({
  address: z.string().min(1, "Address is required")
});
var mediaUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required")
});
var createUserSchema = z.object({
  name: z.string().min(1),
  user_name: z.string().min(1),
  password: z.string().min(6)
});
var updateUserSchema = z.object({
  name: z.string().min(1),
  user_name: z.string().min(1),
  password: z.string().optional()
});
var updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required")
});
var changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters")
});
var addItemImageSchema = z.object({
  url: z.string().min(1),
  thumbnail_url: z.string().optional(),
  is_primary: z.boolean().optional(),
  location_lat: z.number().optional(),
  location_long: z.number().optional()
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/auth.ts
import { eq as eq2 } from "drizzle-orm";

// server/storage.ts
import { eq, sql, and } from "drizzle-orm";
import { hash, compare } from "bcrypt";
var DatabaseStorage = class {
  // ── Users ──
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.user_name, username)).limit(1);
    return user ?? null;
  }
  async getUserByGoogleId(googleId) {
    const [user] = await db.select().from(users).where(eq(users.google_id, googleId)).limit(1);
    return user ?? null;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }
  async createUser(data) {
    const hashed = await hash(data.password, 10);
    const [user] = await db.insert(users).values({ ...data, password: hashed }).returning();
    return user;
  }
  async updateUser(id, data) {
    const updateData = { name: data.name, user_name: data.user_name };
    if (data.password?.trim()) {
      updateData.password = await hash(data.password, 10);
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  async getAllUsers() {
    return db.select().from(users);
  }
  async updateProfile(id, data) {
    const [user] = await db.update(users).set({ name: data.name }).where(eq(users.id, id)).returning();
    return user;
  }
  async changePassword(id, currentPassword, newPassword) {
    const user = await this.getUserById(id);
    if (!user) throw new Error("User not found");
    if (user.password) {
      const valid = await compare(currentPassword, user.password);
      if (!valid) throw new Error("Current password is incorrect");
    }
    const hashed = await hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));
  }
  // ── Houses ──
  async getHousesByOwner(ownerId) {
    return db.select().from(houses).where(eq(houses.owner_id, ownerId));
  }
  async getHouseById(id) {
    const [house] = await db.select().from(houses).where(eq(houses.id, id)).limit(1);
    return house ?? null;
  }
  async createHouse(data, ownerId) {
    const [house] = await db.insert(houses).values({ ...data, owner_id: ownerId }).returning();
    return house;
  }
  async updateHouse(id, data) {
    const [house] = await db.update(houses).set(data).where(eq(houses.id, id)).returning();
    return house;
  }
  async deleteHouse(id) {
    const houseRooms = await db.select().from(rooms).where(eq(rooms.house_id, id));
    for (const room of houseRooms) {
      await this.deleteItemsByRoom(room.id);
    }
    await db.delete(rooms).where(eq(rooms.house_id, id));
    await db.delete(houses).where(eq(houses.id, id));
  }
  // ── Rooms ──
  async getRoomsByOwner(ownerId) {
    return db.select().from(rooms).where(eq(rooms.owner_id, ownerId));
  }
  async getRoomsByHouse(houseId) {
    return db.select().from(rooms).where(eq(rooms.house_id, houseId));
  }
  async getRoomById(id) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return room ?? null;
  }
  async createRoom(data, ownerId) {
    const [room] = await db.insert(rooms).values({ ...data, owner_id: ownerId }).returning();
    return room;
  }
  async updateRoom(id, data) {
    const [room] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return room;
  }
  async deleteRoom(id) {
    await this.deleteItemsByRoom(id);
    await db.delete(rooms).where(eq(rooms.id, id));
  }
  // ── Items ──
  async getItemsByOwner(ownerId) {
    return db.select().from(items).where(eq(items.owner_id, ownerId));
  }
  async getItemsByHouse(houseId) {
    return db.select().from(items).where(eq(items.house_id, houseId));
  }
  async getItemsByRoom(roomId) {
    return db.select().from(items).where(eq(items.room_id, roomId));
  }
  async getItemById(id) {
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return item ?? null;
  }
  async createItem(data) {
    const [item] = await db.insert(items).values(data).returning();
    return item;
  }
  async updateItem(id, data) {
    const [item] = await db.update(items).set(data).where(eq(items.id, id)).returning();
    return item;
  }
  async deleteItem(id) {
    await db.delete(itemImages).where(eq(itemImages.item_id, id));
    await db.delete(items).where(eq(items.id, id));
  }
  async deleteItemsByRoom(roomId) {
    const roomItems = await db.select({ id: items.id }).from(items).where(eq(items.room_id, roomId));
    for (const item of roomItems) {
      await db.delete(itemImages).where(eq(itemImages.item_id, item.id));
    }
    await db.delete(items).where(eq(items.room_id, roomId));
  }
  async getTotals(filter) {
    const conditions = [];
    if (filter.house_id) conditions.push(eq(items.house_id, filter.house_id));
    if (filter.room_id) conditions.push(eq(items.room_id, filter.room_id));
    const where = conditions.length > 0 ? and(...conditions) : void 0;
    const [result] = await db.select({
      total_price: sql`coalesce(sum(${items.amount} * coalesce(${items.price}::numeric, 0)), 0)`,
      total_items: sql`count(${items.id})`
    }).from(items).where(where);
    return {
      total_price: Number(result?.total_price ?? 0),
      total_items: Number(result?.total_items ?? 0)
    };
  }
  // ── Item Images ──
  async getImagesByItem(itemId) {
    return db.select().from(itemImages).where(eq(itemImages.item_id, itemId)).orderBy(sql`${itemImages.is_primary} DESC, ${itemImages.created_at} ASC`);
  }
  async addImage(data) {
    if (data.is_primary) {
      await db.update(itemImages).set({ is_primary: false }).where(eq(itemImages.item_id, data.item_id));
    }
    const [image] = await db.insert(itemImages).values(data).returning();
    return image;
  }
  async deleteImage(imageId, itemId) {
    const [image] = await db.select().from(itemImages).where(and(eq(itemImages.id, imageId), eq(itemImages.item_id, itemId))).limit(1);
    if (!image) return false;
    await db.delete(itemImages).where(eq(itemImages.id, imageId));
    return true;
  }
  /**
   * Set primary image atomically — single UPDATE with CASE to avoid race conditions.
   */
  async setPrimaryImage(imageId, itemId) {
    const [image] = await db.select().from(itemImages).where(and(eq(itemImages.id, imageId), eq(itemImages.item_id, itemId))).limit(1);
    if (!image) return false;
    await db.execute(sql`
      UPDATE item_image
      SET is_primary = CASE WHEN id = ${imageId} THEN true ELSE false END
      WHERE item_id = ${itemId}
    `);
    return true;
  }
  async deleteAllImagesForItem(itemId) {
    await db.delete(itemImages).where(eq(itemImages.item_id, itemId));
  }
  // ── Invites ──
  async isEmailInvited(email) {
    const [row] = await db.select().from(invitedUsers).where(eq(invitedUsers.email, email.toLowerCase())).limit(1);
    return !!row;
  }
  async getInvitedUsers() {
    return db.select().from(invitedUsers);
  }
  async inviteUser(email, invitedById) {
    const [invited] = await db.insert(invitedUsers).values({ email: email.toLowerCase(), invited_by: invitedById }).returning();
    return invited;
  }
  async removeInvite(id) {
    await db.delete(invitedUsers).where(eq(invitedUsers.id, id));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import pkg from "lodash";
var { pick } = pkg;
var JWT_SECRET = process.env.JWT_SECRET;
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
function isAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
function generateAccessToken(payload) {
  return jwt.sign(
    { id: payload.id, user_name: payload.user_name, name: payload.name, role: payload.role },
    JWT_SECRET,
    { expiresIn: "10m" }
  );
}
async function generateRefreshToken(payload) {
  const token = jwt.sign({ iss: payload.id }, JWT_SECRET, { expiresIn: "7d" });
  await db.insert(refreshTokens).values({ userId: payload.id, token, payload }).onConflictDoUpdate({
    target: refreshTokens.userId,
    set: { token, payload }
  });
  return token;
}
async function refreshAccessToken(refreshToken) {
  try {
    jwt.verify(refreshToken, JWT_SECRET);
  } catch {
    throw new Error("Invalid refresh token");
  }
  const [record] = await db.select().from(refreshTokens).where(eq2(refreshTokens.token, refreshToken)).limit(1);
  if (!record) {
    throw new Error("Refresh token not found");
  }
  return generateAccessToken(record.payload);
}
async function validateGoogleToken(idToken) {
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
  const existingUser = await db.select().from(users).where(eq2(users.google_id, googleId)).limit(1);
  if (!existingUser.length) {
    const invited = await storage.isEmailInvited(email);
    if (!invited) {
      throw new Error("NOT_INVITED");
    }
  }
  const [existingByGoogle] = await db.select().from(users).where(eq2(users.google_id, googleId)).limit(1);
  if (existingByGoogle) {
    return pick(existingByGoogle, ["id", "name", "user_name", "role"]);
  }
  const [existingByEmail] = await db.select().from(users).where(eq2(users.email, email)).limit(1);
  if (!existingByEmail) {
    const [existingByUsername] = await db.select().from(users).where(eq2(users.user_name, email)).limit(1);
    if (existingByUsername) {
      await db.update(users).set({ google_id: googleId, email: existingByUsername.email || email }).where(eq2(users.id, existingByUsername.id));
      return pick(existingByUsername, ["id", "name", "user_name", "role"]);
    }
  }
  if (existingByEmail) {
    await db.update(users).set({ google_id: googleId }).where(eq2(users.id, existingByEmail.id));
    return pick(existingByEmail, ["id", "name", "user_name", "role"]);
  }
  const [newUser] = await db.insert(users).values({
    name: name || email.split("@")[0],
    user_name: email,
    email,
    google_id: googleId
  }).returning();
  return pick(newUser, ["id", "name", "user_name", "role"]);
}
async function validateCredentials(username, password) {
  const [user] = await db.select().from(users).where(eq2(users.user_name, username)).limit(1);
  if (!user?.password) return null;
  const valid = await compare2(password, user.password);
  if (!valid) return null;
  return pick(user, ["id", "name", "user_name", "role"]);
}

// server/recognizer.ts
import {
  GoogleGenerativeAI,
  SchemaType
} from "@google/generative-ai";
var genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var schema = {
  description: "Object details",
  type: SchemaType.OBJECT,
  properties: {
    barcode: { type: SchemaType.STRING, description: "Barcode number", nullable: true },
    brand: { type: SchemaType.STRING, description: "Brand name", nullable: false },
    model: { type: SchemaType.STRING, description: "Product model", nullable: false },
    price: { type: SchemaType.NUMBER, description: "Estimated price in South Africa", nullable: false },
    category: { type: SchemaType.STRING, description: "Product category", nullable: false },
    amount: { type: SchemaType.NUMBER, description: "Amount of items in the image", nullable: false }
  },
  required: ["barcode", "brand", "model", "price", "category", "amount"]
};
var generativeModel = genAI.getGenerativeModel({
  model: "gemini-3-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema
  }
});
async function recognizeItem(buffer, mimeType) {
  const result = await generativeModel.generateContent([
    {
      text: `You are an advanced object recognition and inventory counting system for South Africa.

STEP 1 \u2014 COUNT ITEMS (CRITICAL):
Before identifying, you MUST count every individual item in the image:
- Zoom into different regions of the image systematically (top-left, top-right, bottom-left, bottom-right, center).
- For each region, identify and mentally number every visible item.
- Count partially hidden items: if you can see any portion (top, edge, label, handle, cap), it counts as 1 item.
- Count stacked items: if items are stacked, estimate the stack depth from visible edges or labels.
- Count grouped items: items in packs, boxes, or bundles \u2014 count individual units, not containers.
- After scanning all regions, sum your counts to get the total amount.
- If you are uncertain about the count, err on the HIGHER side \u2014 it is better to overcount for insurance/inventory purposes.

STEP 2 \u2014 IDENTIFY:
Determine if the image contains a barcode or an object.

If barcode found:
- Extract the barcode number exactly as it appears.
- Look up product details in South African retail databases.
- Validate that the product matches the visible object.

If no barcode:
- Identify brand, model, and category from visual features (logos, text, shape, packaging).
- Search for the product's average retail price in South Africa (ZAR).

STEP 3 \u2014 PRICE:
- Return the per-unit price in ZAR (not total for all items).
- Use South African retail pricing sources.

FORMAT \u2014 Return JSON only:
{
  "barcode": "123456789012" or null,
  "brand": "Brand Name",
  "model": "Product Model",
  "price": 1999,
  "category": "Product Category",
  "amount": 3
}

The "amount" field is the total count from Step 1. The "price" is per-unit from Step 3.`
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType }
    }
  ]);
  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}
function buildDeltaPrompt(userValues, originalValues) {
  if (!originalValues || !userValues) return "";
  const changes = [];
  if (originalValues.model !== userValues.model && userValues.model) {
    changes.push(`Model/Description changed: "${originalValues.model || "unknown"}" \u2192 "${userValues.model}"`);
  }
  if (originalValues.brand !== userValues.brand && userValues.brand) {
    changes.push(`Brand changed: "${originalValues.brand || "unknown"}" \u2192 "${userValues.brand}"`);
  }
  if (originalValues.category !== userValues.category && userValues.category) {
    changes.push(`Category changed: "${originalValues.category || "unknown"}" \u2192 "${userValues.category}"`);
  }
  if (changes.length > 0) {
    return `
USER HAS MADE THE FOLLOWING CORRECTIONS:
${changes.join("\n")}

Original price was: R${originalValues.price || "unknown"}

IMPORTANT: The user has corrected specifications that affect pricing.
- If size/weight/capacity changed (e.g., "1kg" to "2kg"), adjust price proportionally.
- Larger sizes typically cost more. Double the size often means 1.5x to 2x the price.
- Use the CORRECTED values to determine the new price.

Current specifications to price:
- Brand: ${userValues.brand || originalValues.brand || "unknown"}
- Model/Description: ${userValues.model || originalValues.model || "unknown"}
- Category: ${userValues.category || originalValues.category || "unknown"}`;
  }
  return `
PRICING REQUEST:
- Brand: ${userValues.brand || "unknown"}
- Model/Description: ${userValues.model || "unknown"}
- Category: ${userValues.category || "unknown"}`;
}
async function reEstimateFromUrl(imageUrl, userValues, originalValues) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) throw new Error(`Invalid content type: ${contentType}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const deltaPrompt = buildDeltaPrompt(userValues, originalValues);
  const result = await generativeModel.generateContent([
    {
      text: `You are a South African retail pricing expert. Re-estimate the price for this product.
${deltaPrompt}

PRICING RULES:
1. Use the specifications provided above - they are CORRECT.
2. Price MUST reflect the exact size/weight/capacity mentioned.
3. If the user changed size (e.g., 1kg to 2kg), the new price should be proportionally higher.
4. Return the South African retail price in ZAR.

Format response as JSON only:
{
  "barcode": null,
  "brand": "Brand Name",
  "model": "Product Model with size",
  "price": 1999,
  "category": "Product Category",
  "amount": 1
}`
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType: contentType || "image/jpeg" }
    }
  ]);
  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}
async function reEstimateFromFile(buffer, mimeType, userValues, originalValues) {
  const deltaPrompt = buildDeltaPrompt(userValues, originalValues);
  const result = await generativeModel.generateContent([
    {
      text: `You are a South African retail pricing expert. Re-estimate the price for this product.
${deltaPrompt}

PRICING RULES:
1. Use the specifications provided above - they are CORRECT.
2. Price MUST reflect the exact size/weight/capacity mentioned.
3. If the user changed size (e.g., 1kg to 2kg), the new price should be proportionally higher.
4. Return the South African retail price in ZAR.

Format response as JSON only:
{
  "barcode": null,
  "brand": "Brand Name",
  "model": "Product Model with size",
  "price": 1999,
  "category": "Product Category",
  "amount": 1
}`
    },
    {
      inlineData: { data: buffer.toString("base64"), mimeType }
    }
  ]);
  const data = JSON.parse(result.response.text());
  return { brand: data.brand, model: data.model, price: data.price, category: data.category, amount: data.amount };
}
async function askPrice(brand, model) {
  const result = await generativeModel.generateContent({
    systemInstruction: {
      role: "system",
      parts: [{ text: "not realtime information is appropriate, it's just testing" }]
    },
    contents: [
      {
        role: "user",
        parts: [
          { text: `What is the average product price in South Africa for a: ${brand} ${model}. In pure JSON format without arrays, here is the example: {"price": 17999}.` },
          { text: `${brand} ${model}` }
        ]
      }
    ]
  });
  const text = result.response.text();
  const matches = /```(?:json)?(.+?)```/gims.exec(text);
  const data = JSON.parse((matches ? matches[1] : text).trim());
  return { price: data.price };
}

// server/media.ts
import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";
function createStorage() {
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_JSON);
    return new Storage({ credentials });
  }
  const keyFilePath = path.resolve(process.cwd(), "gcs-service-account.json");
  if (fs.existsSync(keyFilePath)) {
    return new Storage({ keyFilename: keyFilePath });
  }
  return new Storage();
}
var storage2 = createStorage();
var bucketName = process.env.GCS_BUCKET || "wotigot-media";
var bucket = storage2.bucket(bucketName);
async function getUploadUrls(fileName, userId) {
  const originalKey = `${userId}/${fileName}`;
  const thumbnailKey = `${userId}/thumbs/${fileName}`;
  const [originalUrl] = await bucket.file(originalKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1e3,
    // 1 hour
    contentType: "image/jpeg"
  });
  const [thumbnailUrl] = await bucket.file(thumbnailKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1e3,
    contentType: "image/jpeg"
  });
  return { originalUrl, thumbnailUrl, originalKey, thumbnailKey };
}
async function getPresignedReadUrl(key) {
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1e3
    // 1 hour
  });
  return url;
}

// server/geocode.ts
var googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
async function geocodeAddress(address) {
  if (!address?.trim() || !googleApiKey) return null;
  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${googleApiKey}&region=za`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      console.error(`Geocode HTTP error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log(`Geocode status: ${data.status}, results: ${data.results?.length || 0}, error: ${data.error_message || "none"}`);
    if (data.status !== "OK" || !data.results?.length) return null;
    const result = data.results[0];
    return {
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      }
    };
  } catch {
    return null;
  }
}

// server/routes.ts
var { keyBy, snakeCase } = pkg2;
var { pick: pick2 } = pkg2;
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
function assertOwnership(resource, userId, resourceName, res) {
  if (!resource) {
    res.status(404).json({ message: `${resourceName} not found` });
    return false;
  }
  if (resource.owner_id !== userId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const user = await validateCredentials(parsed.data.username, parsed.data.password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const access_token = generateAccessToken(user);
    const refresh_token = await generateRefreshToken(user);
    res.json({ access_token, refresh_token });
  });
  app2.post("/api/auth/google", async (req, res) => {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    try {
      const user = await validateGoogleToken(parsed.data.id_token);
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user);
      res.json({ access_token, refresh_token });
    } catch (err) {
      if (err.message === "NOT_INVITED") {
        return res.status(403).json({ message: "Your email has not been invited. Please request access." });
      }
      res.status(401).json({ message: "Invalid Google token" });
    }
  });
  app2.post("/api/auth/google-redirect", express.urlencoded({ extended: false }), async (req, res) => {
    const credential = req.body.credential;
    if (!credential) return res.status(400).send("Missing credential");
    try {
      const user = await validateGoogleToken(credential);
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user);
      res.redirect(`/?auth=${encodeURIComponent(JSON.stringify({ access_token, refresh_token }))}`);
    } catch (err) {
      if (err.message === "NOT_INVITED") {
        return res.redirect("/?error=not_invited");
      }
      res.redirect("/?error=google_auth_failed");
    }
  });
  app2.post("/api/auth/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ message: "Refresh token required" });
    try {
      const access_token = await refreshAccessToken(refresh_token);
      res.json({ access_token, refresh_token });
    } catch {
      res.status(401).json({ message: "Invalid or expired refresh token" });
    }
  });
  app2.get("/api/auth/me", isAuthenticated, async (req, res) => {
    const user = await storage.getUserById(req.user.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({
      ...pick2(user, ["id", "name", "user_name", "role"]),
      has_password: !!user.password,
      has_google: !!user.google_id
    });
  });
  app2.put("/api/auth/profile", isAuthenticated, async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const updated = await storage.updateProfile(req.user.id, { name: parsed.data.name.trim() });
    res.json(pick2(updated, ["id", "name", "user_name", "role"]));
  });
  app2.put("/api/auth/password", isAuthenticated, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    try {
      await storage.changePassword(req.user.id, parsed.data.currentPassword, parsed.data.newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/houses", isAuthenticated, async (req, res) => {
    const parsed = insertHouseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const house = await storage.createHouse(parsed.data, req.user.id);
    res.status(201).json(house);
  });
  app2.get("/api/houses", isAuthenticated, async (req, res) => {
    const houseList = await storage.getHousesByOwner(req.user.id);
    const withTotals = await Promise.all(
      houseList.map(async (house) => {
        const totals = await storage.getTotals({ house_id: house.id });
        return { ...house, total_value: totals.total_price, total_items: totals.total_items };
      })
    );
    res.json(withTotals);
  });
  app2.get("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    res.json(house);
  });
  app2.put("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    const updated = await storage.updateHouse(house.id, req.body);
    res.json(updated);
  });
  app2.delete("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    await storage.deleteHouse(house.id);
    res.status(204).end();
  });
  app2.get("/api/houses/:id/totals", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    const totals = await storage.getTotals({ house_id: house.id });
    res.json(totals);
  });
  app2.get("/api/houses/:id/rooms", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    const roomList = await storage.getRoomsByHouse(house.id);
    const withTotals = await Promise.all(
      roomList.map(async (room) => {
        const totals = await storage.getTotals({ room_id: room.id });
        return { ...room, total_value: totals.total_price, total_items: totals.total_items };
      })
    );
    res.json(withTotals);
  });
  app2.get("/api/houses/:id/xlsx", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    const roomList = await storage.getRoomsByHouse(house.id);
    const roomsMap = keyBy(roomList, "id");
    const itemList = await storage.getItemsByHouse(house.id);
    const data = itemList.map((item) => ({
      room: roomsMap[item.room_id]?.name,
      brand: item.brand,
      model: item.model,
      category: item.category,
      serial_number: item.serial_number,
      amount: item.amount,
      price: item.price ? Number(item.price) : null,
      price_type: priceTypeNameMap[item.price_type] || item.price_type,
      total: item.amount * (item.price ? Number(item.price) : 0)
    }));
    const wb = utils.book_new();
    const ws2 = utils.json_to_sheet(data);
    ws2["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    utils.book_append_sheet(wb, ws2, house.name);
    const buffer = write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
    res.header("Content-Disposition", `attachment; filename="${snakeCase(house.name)}_${Date.now()}.xlsx"`);
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.end(buffer);
  });
  app2.post("/api/rooms", isAuthenticated, async (req, res) => {
    const parsed = insertRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const house = await storage.getHouseById(parsed.data.house_id);
    if (!assertOwnership(house, req.user.id, "House", res)) return;
    const room = await storage.createRoom(parsed.data, req.user.id);
    res.status(201).json(room);
  });
  app2.get("/api/rooms", isAuthenticated, async (req, res) => {
    const roomList = await storage.getRoomsByOwner(req.user.id);
    res.json(roomList);
  });
  app2.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    res.json(room);
  });
  app2.put("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    const updated = await storage.updateRoom(room.id, req.body);
    res.json(updated);
  });
  app2.delete("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    await storage.deleteRoom(room.id);
    res.status(204).end();
  });
  app2.get("/api/rooms/:id/items", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    const itemList = await storage.getItemsByRoom(room.id);
    res.json(itemList);
  });
  app2.get("/api/rooms/:id/totals", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    const totals = await storage.getTotals({ room_id: room.id });
    res.json(totals);
  });
  app2.post("/api/items", isAuthenticated, async (req, res) => {
    const parsed = insertItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const room = await storage.getRoomById(parsed.data.room_id);
    if (!assertOwnership(room, req.user.id, "Room", res)) return;
    const item = await storage.createItem({
      ...parsed.data,
      house_id: room.house_id,
      owner_id: req.user.id
    });
    res.status(201).json(item);
  });
  app2.get("/api/items", isAuthenticated, async (req, res) => {
    const itemList = await storage.getItemsByOwner(req.user.id);
    res.json(itemList);
  });
  app2.get("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    res.json(item);
  });
  app2.put("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    const updated = await storage.updateItem(item.id, {
      description: req.body.description,
      category: req.body.category,
      brand: req.body.brand,
      model: req.body.model,
      price: req.body.price,
      price_type: req.body.price_type,
      amount: req.body.amount,
      serial_number: req.body.serial_number,
      image: req.body.image
    });
    res.json(updated);
  });
  app2.delete("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    await storage.deleteItem(item.id);
    res.status(204).end();
  });
  app2.post("/api/items/recognition", isAuthenticated, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const result = await recognizeItem(req.file.buffer, req.file.mimetype);
    res.json(result);
  });
  app2.post("/api/items/ask-price", isAuthenticated, async (req, res) => {
    const parsed = askPriceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const result = await askPrice(parsed.data.brand, parsed.data.model);
    res.json(result);
  });
  app2.post("/api/items/re-recognize", isAuthenticated, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const parsed = reEstimateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const { brand, model, category, originalBrand, originalModel, originalCategory, originalPrice } = parsed.data;
    const result = await reEstimateFromFile(
      req.file.buffer,
      req.file.mimetype,
      { brand, model, category },
      { brand: originalBrand, model: originalModel, category: originalCategory, price: originalPrice ? Number(originalPrice) : void 0 }
    );
    res.json(result);
  });
  app2.post("/api/items/:id/re-estimate", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    if (!item.image) return res.status(404).json({ message: "No primary image found for this item" });
    const parsed = reEstimateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const result = await reEstimateFromUrl(
      item.image,
      { brand: parsed.data.brand, model: parsed.data.model, category: parsed.data.category },
      { brand: item.brand, model: item.description || void 0, category: item.category, price: item.price ? Number(item.price) : void 0 }
    );
    res.json(result);
  });
  app2.get("/api/items/:id/images", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    const images = await storage.getImagesByItem(item.id);
    res.json(images);
  });
  app2.post("/api/items/:id/images", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    const parsed = addItemImageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const image = await storage.addImage({
      item_id: item.id,
      url: parsed.data.url,
      thumbnail_url: parsed.data.thumbnail_url || null,
      is_primary: parsed.data.is_primary ?? false,
      location_lat: parsed.data.location_lat,
      location_long: parsed.data.location_long
    });
    res.status(201).json(image);
  });
  app2.delete("/api/items/:id/images/:imageId", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    const deleted = await storage.deleteImage(Number(req.params.imageId), item.id);
    if (!deleted) return res.status(404).json({ message: "Image not found for this item" });
    res.status(204).end();
  });
  app2.put("/api/items/:id/images/:imageId/primary", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user.id, "Item", res)) return;
    const updated = await storage.setPrimaryImage(Number(req.params.imageId), item.id);
    if (!updated) return res.status(404).json({ message: "Image not found for this item" });
    res.json({ success: true });
  });
  app2.post("/api/media", isAuthenticated, async (req, res) => {
    const parsed = mediaUploadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const urls = await getUploadUrls(parsed.data.fileName, req.user.id);
    res.json(urls);
  });
  app2.get("/api/media/url", isAuthenticated, async (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ message: "key is required" });
    if (!key.startsWith(`${req.user.id}/`)) return res.status(403).json({ message: "Forbidden" });
    const url = await getPresignedReadUrl(key);
    res.json({ url });
  });
  app2.post("/api/geocode", isAuthenticated, async (req, res) => {
    const parsed = geocodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const result = await geocodeAddress(parsed.data.address);
    if (!result) {
      const debugUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(parsed.data.address)}&key=${process.env.GOOGLE_MAPS_API_KEY}&region=za`;
      const debugRes = await fetch(debugUrl);
      const debugData = await debugRes.json();
      return res.status(404).json({
        message: "Address not found",
        debug: { status: debugData.status, error: debugData.error_message, resultCount: debugData.results?.length }
      });
    }
    res.json(result);
  });
  app2.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const user = await storage.createUser(parsed.data);
    res.status(201).json(pick2(user, ["id", "name", "user_name", "role"]));
  });
  app2.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    const userList = await storage.getAllUsers();
    res.json(userList.map((u) => pick2(u, ["id", "name", "user_name", "role", "email", "created_at"])));
  });
  app2.get("/api/users/:username", isAuthenticated, isAdmin, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(pick2(user, ["id", "name", "user_name", "role", "email", "created_at"]));
  });
  app2.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
    const user = await storage.updateUser(Number(req.params.id), parsed.data);
    res.json(pick2(user, ["id", "name", "user_name", "role"]));
  });
  app2.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).end();
  });
  app2.get("/api/admin/invites", isAuthenticated, isAdmin, async (_req, res) => {
    const invites = await storage.getInvitedUsers();
    res.json(invites);
  });
  app2.post("/api/admin/invites", isAuthenticated, isAdmin, async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") return res.status(400).json({ message: "Email is required" });
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const already = await storage.isEmailInvited(trimmed);
    if (already) return res.status(409).json({ message: "Email already invited" });
    const invited = await storage.inviteUser(trimmed, req.user.id);
    res.status(201).json(invited);
  });
  app2.delete("/api/admin/invites/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.removeInvite(Number(req.params.id));
    res.status(204).end();
  });
  app2.get("/api/reports/xlsx", isAuthenticated, async (req, res) => {
    const houseList = await storage.getHousesByOwner(req.user.id);
    const wb = utils.book_new();
    for (const house of houseList) {
      const roomList = await storage.getRoomsByHouse(house.id);
      const roomsMap = keyBy(roomList, "id");
      const itemList = await storage.getItemsByHouse(house.id);
      const data = itemList.map((item) => ({
        room: roomsMap[item.room_id]?.name,
        brand: item.brand,
        model: item.model,
        category: item.category,
        serial_number: item.serial_number,
        amount: item.amount,
        price: item.price ? Number(item.price) : null,
        price_type: priceTypeNameMap[item.price_type] || item.price_type,
        total: item.amount * (item.price ? Number(item.price) : 0)
      }));
      const ws2 = utils.json_to_sheet(data);
      ws2["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      utils.book_append_sheet(wb, ws2, house.name.slice(0, 31));
    }
    const buffer = write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
    res.header("Content-Disposition", `attachment; filename="wotigot_report_${Date.now()}.xlsx"`);
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.end(buffer);
  });
  app2.get("/api/health", (_req, res) => res.json({
    status: "ok",
    hasGeoKey: !!process.env.GOOGLE_MAPS_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGcsKey: !!process.env.GCS_SERVICE_ACCOUNT_JSON,
    hasDbUrl: !!process.env.DATABASE_URL
  }));
  return createServer(app2);
}

// server/api.ts
var app = express2();
app.set("trust proxy", 1);
app.use(helmet());
var allowedOrigins = (process.env.CORS_ORIGIN || "https://wotigot.vercel.app").split(",").map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
var authLimiter = rateLimit({
  windowMs: 1 * 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/refresh", authLimiter);
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" }
});
app.use("/api/", apiLimiter);
app.use(express2.json({ limit: "1mb" }));
app.use(express2.urlencoded({ extended: false }));
var isReady = false;
var initError = null;
var readyPromise = (async () => {
  try {
    await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      console.error("Unhandled error:", err);
      res.status(status).json({ message: status >= 500 ? "Internal Server Error" : err.message || "Error" });
    });
    isReady = true;
  } catch (err) {
    console.error("INIT ERROR:", err);
    initError = err;
  }
})();
async function handler(req, res) {
  if (!isReady) await readyPromise;
  if (initError) return res.status(500).json({ error: "Server initialization failed" });
  return app(req, res);
}
export {
  handler as default
};
