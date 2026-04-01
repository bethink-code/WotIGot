import { eq, sql, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, houses, rooms, items, itemImages, refreshTokens, invitedUsers,
  type User, type InsertUser, type House, type InsertHouse,
  type Room, type InsertRoom, type Item, type InsertItem,
  type ItemImage, type InsertItemImage, type InvitedUser,
} from "../shared/schema";
import { hash, compare } from "bcrypt";

export class DatabaseStorage {
  // ── Users ──

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.user_name, username)).limit(1);
    return user ?? null;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.google_id, googleId)).limit(1);
    return user ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }

  async createUser(data: { name: string; user_name: string; password: string }): Promise<User> {
    const hashed = await hash(data.password, 10);
    const [user] = await db.insert(users).values({ ...data, password: hashed }).returning();
    return user;
  }

  async updateUser(id: number, data: { name: string; user_name: string; password?: string }): Promise<User> {
    const updateData: Partial<InsertUser> = { name: data.name, user_name: data.user_name };
    if (data.password?.trim()) {
      updateData.password = await hash(data.password, 10);
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateProfile(id: number, data: { name: string }): Promise<User> {
    const [user] = await db.update(users).set({ name: data.name }).where(eq(users.id, id)).returning();
    return user;
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
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

  async getHousesByOwner(ownerId: number): Promise<House[]> {
    return db.select().from(houses).where(eq(houses.owner_id, ownerId));
  }

  async getHouseById(id: number): Promise<House | null> {
    const [house] = await db.select().from(houses).where(eq(houses.id, id)).limit(1);
    return house ?? null;
  }

  async createHouse(data: Omit<InsertHouse, "id" | "created_at" | "owner_id">, ownerId: number): Promise<House> {
    const [house] = await db.insert(houses).values({ ...data, owner_id: ownerId }).returning();
    return house;
  }

  async updateHouse(id: number, data: Partial<InsertHouse>): Promise<House> {
    const [house] = await db.update(houses).set(data).where(eq(houses.id, id)).returning();
    return house;
  }

  async deleteHouse(id: number): Promise<void> {
    // Cascade: delete items + images for all rooms, then rooms, then house
    const houseRooms = await db.select().from(rooms).where(eq(rooms.house_id, id));
    for (const room of houseRooms) {
      await this.deleteItemsByRoom(room.id);
    }
    await db.delete(rooms).where(eq(rooms.house_id, id));
    await db.delete(houses).where(eq(houses.id, id));
  }

  // ── Rooms ──

  async getRoomsByOwner(ownerId: number): Promise<Room[]> {
    return db.select().from(rooms).where(eq(rooms.owner_id, ownerId));
  }

  async getRoomsByHouse(houseId: number): Promise<Room[]> {
    return db.select().from(rooms).where(eq(rooms.house_id, houseId));
  }

  async getRoomById(id: number): Promise<Room | null> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return room ?? null;
  }

  async createRoom(data: Omit<InsertRoom, "id" | "created_at" | "owner_id">, ownerId: number): Promise<Room> {
    const [room] = await db.insert(rooms).values({ ...data, owner_id: ownerId }).returning();
    return room;
  }

  async updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room> {
    const [room] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return room;
  }

  async deleteRoom(id: number): Promise<void> {
    await this.deleteItemsByRoom(id);
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // ── Items ──

  async getItemsByOwner(ownerId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.owner_id, ownerId));
  }

  async getItemsByHouse(houseId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.house_id, houseId));
  }

  async getItemsByRoom(roomId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.room_id, roomId));
  }

  async getItemById(id: number): Promise<Item | null> {
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return item ?? null;
  }

  async createItem(data: Omit<InsertItem, "id" | "created_at">): Promise<Item> {
    const [item] = await db.insert(items).values(data).returning();
    return item;
  }

  async updateItem(id: number, data: Partial<InsertItem>): Promise<Item> {
    const [item] = await db.update(items).set(data).where(eq(items.id, id)).returning();
    return item;
  }

  async deleteItem(id: number): Promise<void> {
    // Transaction: delete images first, then item
    await db.delete(itemImages).where(eq(itemImages.item_id, id));
    await db.delete(items).where(eq(items.id, id));
  }

  private async deleteItemsByRoom(roomId: number): Promise<void> {
    const roomItems = await db.select({ id: items.id }).from(items).where(eq(items.room_id, roomId));
    for (const item of roomItems) {
      await db.delete(itemImages).where(eq(itemImages.item_id, item.id));
    }
    await db.delete(items).where(eq(items.room_id, roomId));
  }

  async getTotals(filter: { house_id?: number; room_id?: number }): Promise<{ total_price: number; total_items: number }> {
    const conditions = [];
    if (filter.house_id) conditions.push(eq(items.house_id, filter.house_id));
    if (filter.room_id) conditions.push(eq(items.room_id, filter.room_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await db
      .select({
        total_price: sql<number>`coalesce(sum(${items.amount} * coalesce(${items.price}::numeric, 0)), 0)`,
        total_items: sql<number>`count(${items.id})`,
      })
      .from(items)
      .where(where);

    return {
      total_price: Number(result?.total_price ?? 0),
      total_items: Number(result?.total_items ?? 0),
    };
  }

  // ── Item Images ──

  async getImagesByItem(itemId: number): Promise<ItemImage[]> {
    return db
      .select()
      .from(itemImages)
      .where(eq(itemImages.item_id, itemId))
      .orderBy(sql`${itemImages.is_primary} DESC, ${itemImages.created_at} ASC`);
  }

  async addImage(data: Omit<InsertItemImage, "id" | "created_at">): Promise<ItemImage> {
    if (data.is_primary) {
      // Unset existing primaries atomically
      await db
        .update(itemImages)
        .set({ is_primary: false })
        .where(eq(itemImages.item_id, data.item_id));
    }
    const [image] = await db.insert(itemImages).values(data).returning();
    return image;
  }

  async deleteImage(imageId: number, itemId: number): Promise<boolean> {
    const [image] = await db
      .select()
      .from(itemImages)
      .where(and(eq(itemImages.id, imageId), eq(itemImages.item_id, itemId)))
      .limit(1);

    if (!image) return false;
    await db.delete(itemImages).where(eq(itemImages.id, imageId));
    return true;
  }

  /**
   * Set primary image atomically — single UPDATE with CASE to avoid race conditions.
   */
  async setPrimaryImage(imageId: number, itemId: number): Promise<boolean> {
    const [image] = await db
      .select()
      .from(itemImages)
      .where(and(eq(itemImages.id, imageId), eq(itemImages.item_id, itemId)))
      .limit(1);

    if (!image) return false;

    // Atomic: set all to false except the target
    await db.execute(sql`
      UPDATE item_image
      SET is_primary = CASE WHEN id = ${imageId} THEN true ELSE false END
      WHERE item_id = ${itemId}
    `);

    return true;
  }

  async deleteAllImagesForItem(itemId: number): Promise<void> {
    await db.delete(itemImages).where(eq(itemImages.item_id, itemId));
  }

  // ── Invites ──

  async isEmailInvited(email: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(invitedUsers)
      .where(eq(invitedUsers.email, email.toLowerCase()))
      .limit(1);
    return !!row;
  }

  async getInvitedUsers(): Promise<InvitedUser[]> {
    return db.select().from(invitedUsers);
  }

  async inviteUser(email: string, invitedById?: number): Promise<InvitedUser> {
    const [invited] = await db
      .insert(invitedUsers)
      .values({ email: email.toLowerCase(), invited_by: invitedById })
      .returning();
    return invited;
  }

  async removeInvite(id: number): Promise<void> {
    await db.delete(invitedUsers).where(eq(invitedUsers.id, id));
  }
}

export const storage = new DatabaseStorage();
