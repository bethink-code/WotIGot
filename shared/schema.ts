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
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Enums (must match existing PostgreSQL enum names exactly) ---

export const userRoleEnum = pgEnum("user_role_enum", ["user", "admin"]);
export const priceTypeEnum = pgEnum("item_price_type_enum", ["AI", "user", "invoice"]);

export const priceTypeNameMap: Record<string, string> = {
  AI: "Price suggested by AI",
  user: "Price captured by user",
  invoice: "Price from invoice",
};

// --- Users ---
// DB columns: id(int4), name(varchar), user_name(varchar), password(varchar nullable),
//   role(user_role_enum), created_at(timestamp), google_id(varchar nullable), email(varchar nullable)

export const users = pgTable(
  "user",
  {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    user_name: varchar("user_name").notNull(),
    password: varchar("password"),
    google_id: varchar("google_id"),
    email: varchar("email"),
    photo_url: varchar("photo_url"),
    role: userRoleEnum("role").default("user").notNull(),
    terms_accepted_at: timestamp("terms_accepted_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_user_name_idx").on(table.user_name),
    uniqueIndex("user_google_id_idx").on(table.google_id),
  ]
);

// --- Refresh Tokens ---
// DB columns: userId(int4 PK), token(varchar), payload(json)

export const refreshTokens = pgTable(
  "refresh_token",
  {
    userId: integer("userId").primaryKey(),
    token: varchar("token").notNull(),
    payload: json("payload").notNull(),
  },
  (table) => [index("refresh_token_token_idx").on(table.token)]
);

// --- Houses ---
// DB columns: id(int4), owner_id(int4), name(varchar), address(varchar),
//   image(varchar nullable), location_lat(float8 nullable), location_long(float8 nullable), created_at(timestamp)

export const houses = pgTable(
  "house",
  {
    id: serial("id").primaryKey(),
    owner_id: integer("owner_id").notNull(),
    name: varchar("name").notNull(),
    address: varchar("address").notNull(),
    image: varchar("image"),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("house_owner_id_idx").on(table.owner_id)]
);

// --- Rooms ---
// DB columns: id(int4), house_id(int4), owner_id(int4), name(varchar),
//   image(varchar nullable), location_lat(float8 nullable), location_long(float8 nullable), created_at(timestamp)

export const rooms = pgTable(
  "room",
  {
    id: serial("id").primaryKey(),
    house_id: integer("house_id").notNull(),
    owner_id: integer("owner_id").notNull(),
    name: varchar("name").notNull(),
    image: varchar("image"),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("room_house_id_idx").on(table.house_id),
    index("room_owner_id_idx").on(table.owner_id),
  ]
);

// --- Items ---
// DB columns: id(int4), room_id(int4), house_id(int4), owner_id(int4),
//   image(varchar nullable), price(numeric nullable), price_type(item_price_type_enum),
//   amount(int4 default 1), description(varchar nullable), category(varchar), brand(varchar),
//   model(varchar), receipt_image(varchar nullable), serial_number(varchar nullable),
//   location_lat(float8 nullable), location_long(float8 nullable), created_at(timestamp)

export const items = pgTable(
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
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("item_room_id_idx").on(table.room_id),
    index("item_house_id_idx").on(table.house_id),
    index("item_owner_id_idx").on(table.owner_id),
  ]
);

// --- Item Images ---
// DB columns: id(int4), item_id(int4), url(varchar), thumbnail_url(varchar nullable),
//   is_primary(bool default false), location_lat(float8 nullable), location_long(float8 nullable), created_at(timestamp)

export const itemImages = pgTable(
  "item_image",
  {
    id: serial("id").primaryKey(),
    item_id: integer("item_id").notNull(),
    url: varchar("url").notNull(),
    thumbnail_url: varchar("thumbnail_url"),
    is_primary: boolean("is_primary").default(false).notNull(),
    location_lat: doublePrecision("location_lat"),
    location_long: doublePrecision("location_long"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("item_image_item_id_idx").on(table.item_id)]
);

// --- Invited Users (invite-only access) ---

export const invitedUsers = pgTable(
  "invited_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email").notNull().unique(),
    invited_by: integer("invited_by"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  }
);

// --- Audit Logs ---

export const auditLogs = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id"),
    user_email: varchar("user_email"),
    action: varchar("action").notNull(),
    resource_type: varchar("resource_type"),
    resource_id: varchar("resource_id"),
    outcome: varchar("outcome").default("success").notNull(),
    detail: varchar("detail"),
    ip_address: varchar("ip_address"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_user_id_idx").on(table.user_id),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_created_at_idx").on(table.created_at),
  ]
);

// --- Access Requests ---

export const accessRequests = pgTable(
  "access_request",
  {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    email: varchar("email").notNull(),
    cell: varchar("cell"),
    status: varchar("status").default("pending").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  }
);

// --- AI Usage ---

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id"),
    user_email: varchar("user_email"),
    action: varchar("action").notNull(),
    model: varchar("model").notNull(),
    input_tokens: integer("input_tokens").default(0).notNull(),
    output_tokens: integer("output_tokens").default(0).notNull(),
    estimated_cost_usd: numeric("estimated_cost_usd"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  }
);

// --- Inferred Types ---

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type House = typeof houses.$inferSelect;
export type InsertHouse = typeof houses.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type ItemImage = typeof itemImages.$inferSelect;
export type InsertItemImage = typeof itemImages.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InvitedUser = typeof invitedUsers.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type AiUsage = typeof aiUsage.$inferSelect;

export type PublicUserProfile = Pick<User, "id" | "user_name" | "name" | "role">;

// --- Zod Schemas ---

export const insertUserSchema = createInsertSchema(users);
export const insertHouseSchema = createInsertSchema(houses).omit({ id: true, owner_id: true, created_at: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, owner_id: true, created_at: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, owner_id: true, house_id: true, created_at: true });
export const insertItemImageSchema = createInsertSchema(itemImages).omit({ id: true, created_at: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  id_token: z.string().min(1, "ID token is required"),
});

export const askPriceSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
});

export const reEstimateSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  originalBrand: z.string().optional(),
  originalModel: z.string().optional(),
  originalCategory: z.string().optional(),
  originalPrice: z.union([z.string(), z.number()]).optional(),
});

export const geocodeSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

export const mediaUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  user_name: z.string().min(1),
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  name: z.string().min(1),
  user_name: z.string().min(1),
  password: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const requestAccessSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  cell: z.string().optional(),
});

export const addItemImageSchema = z.object({
  url: z.string().min(1),
  thumbnail_url: z.string().optional(),
  is_primary: z.boolean().optional(),
  location_lat: z.number().optional(),
  location_long: z.number().optional(),
});
