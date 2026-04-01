import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import pkg from "lodash";
const { keyBy, snakeCase } = pkg;
import { utils, write } from "xlsx";

import { isAuthenticated, isAdmin, generateAccessToken, generateRefreshToken, refreshAccessToken, validateGoogleToken, validateCredentials } from "./auth";
import { storage } from "./storage";
import * as recognizer from "./recognizer";
import * as media from "./media";
import { geocodeAddress } from "./geocode";
import {
  loginSchema, googleAuthSchema, insertHouseSchema, insertRoomSchema,
  insertItemSchema, addItemImageSchema, askPriceSchema, reEstimateSchema,
  geocodeSchema, mediaUploadSchema, createUserSchema, updateUserSchema,
  updateProfileSchema, changePasswordSchema, priceTypeNameMap,
} from "../shared/schema";
const { pick } = pkg;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Assert ownership of a resource. Returns 404/403 response if invalid.
 */
function assertOwnership(resource: { owner_id: number } | null, userId: number, resourceName: string, res: any): resource is { owner_id: number } {
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

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Auth (public) ──

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const user = await validateCredentials(parsed.data.username, parsed.data.password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const access_token = generateAccessToken(user);
    const refresh_token = await generateRefreshToken(user);
    res.json({ access_token, refresh_token });
  });

  app.post("/api/auth/google", async (req, res) => {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    try {
      const user = await validateGoogleToken(parsed.data.id_token);
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user);
      res.json({ access_token, refresh_token });
    } catch (err: any) {
      if (err.message === "NOT_INVITED") {
        return res.status(403).json({ message: "Your email has not been invited. Please request access." });
      }
      res.status(401).json({ message: "Invalid Google token" });
    }
  });

  // Google OAuth redirect flow — receives credential via form POST, sets tokens, redirects to app
  app.post("/api/auth/google-redirect", express.urlencoded({ extended: false }), async (req, res) => {
    const credential = req.body.credential;
    if (!credential) return res.status(400).send("Missing credential");

    try {
      const user = await validateGoogleToken(credential);
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user);

      // Redirect to frontend with tokens in URL hash (not query — hash stays client-side)
      res.redirect(`/?auth=${encodeURIComponent(JSON.stringify({ access_token, refresh_token }))}`);
    } catch (err: any) {
      if (err.message === "NOT_INVITED") {
        return res.redirect("/?error=not_invited");
      }
      res.redirect("/?error=google_auth_failed");
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ message: "Refresh token required" });

    try {
      const access_token = await refreshAccessToken(refresh_token);
      res.json({ access_token, refresh_token });
    } catch {
      res.status(401).json({ message: "Invalid or expired refresh token" });
    }
  });

  // ── Auth (protected) ──

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    const user = await storage.getUserById(req.user!.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    res.json({
      ...pick(user, ["id", "name", "user_name", "role"]),
      has_password: !!user.password,
      has_google: !!user.google_id,
    });
  });

  app.put("/api/auth/profile", isAuthenticated, async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const updated = await storage.updateProfile(req.user!.id, { name: parsed.data.name.trim() });
    res.json(pick(updated, ["id", "name", "user_name", "role"]));
  });

  app.put("/api/auth/password", isAuthenticated, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    try {
      await storage.changePassword(req.user!.id, parsed.data.currentPassword, parsed.data.newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── Houses ──

  app.post("/api/houses", isAuthenticated, async (req, res) => {
    const parsed = insertHouseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const house = await storage.createHouse(parsed.data, req.user!.id);
    res.status(201).json(house);
  });

  app.get("/api/houses", isAuthenticated, async (req, res) => {
    const houseList = await storage.getHousesByOwner(req.user!.id);
    const withTotals = await Promise.all(
      houseList.map(async (house) => {
        const totals = await storage.getTotals({ house_id: house.id });
        return { ...house, total_value: totals.total_price, total_items: totals.total_items };
      })
    );
    res.json(withTotals);
  });

  app.get("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;
    res.json(house);
  });

  app.put("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

    const updated = await storage.updateHouse(house.id, req.body);
    res.json(updated);
  });

  app.delete("/api/houses/:id", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

    await storage.deleteHouse(house.id);
    res.status(204).end();
  });

  app.get("/api/houses/:id/totals", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

    const totals = await storage.getTotals({ house_id: house.id });
    res.json(totals);
  });

  app.get("/api/houses/:id/rooms", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

    const roomList = await storage.getRoomsByHouse(house.id);
    const withTotals = await Promise.all(
      roomList.map(async (room) => {
        const totals = await storage.getTotals({ room_id: room.id });
        return { ...room, total_value: totals.total_price, total_items: totals.total_items };
      })
    );
    res.json(withTotals);
  });

  app.get("/api/houses/:id/xlsx", isAuthenticated, async (req, res) => {
    const house = await storage.getHouseById(Number(req.params.id));
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

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
      total: item.amount * (item.price ? Number(item.price) : 0),
    }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    utils.book_append_sheet(wb, ws, house.name);

    const buffer = write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
    res.header("Content-Disposition", `attachment; filename="${snakeCase(house.name)}_${Date.now()}.xlsx"`);
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.end(buffer);
  });

  // ── Rooms ──

  app.post("/api/rooms", isAuthenticated, async (req, res) => {
    const parsed = insertRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const house = await storage.getHouseById(parsed.data.house_id);
    if (!assertOwnership(house, req.user!.id, "House", res)) return;

    const room = await storage.createRoom(parsed.data, req.user!.id);
    res.status(201).json(room);
  });

  app.get("/api/rooms", isAuthenticated, async (req, res) => {
    const roomList = await storage.getRoomsByOwner(req.user!.id);
    res.json(roomList);
  });

  app.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;
    res.json(room);
  });

  app.put("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    const updated = await storage.updateRoom(room.id, req.body);
    res.json(updated);
  });

  app.delete("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    await storage.deleteRoom(room.id);
    res.status(204).end();
  });

  app.get("/api/rooms/:id/items", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    const itemList = await storage.getItemsByRoom(room.id);
    res.json(itemList);
  });

  app.get("/api/rooms/:id/totals", isAuthenticated, async (req, res) => {
    const room = await storage.getRoomById(Number(req.params.id));
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    const totals = await storage.getTotals({ room_id: room.id });
    res.json(totals);
  });

  // ── Items ──

  app.post("/api/items", isAuthenticated, async (req, res) => {
    const parsed = insertItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const room = await storage.getRoomById(parsed.data.room_id);
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    const item = await storage.createItem({
      ...parsed.data,
      house_id: room.house_id,
      owner_id: req.user!.id,
    });
    res.status(201).json(item);
  });

  app.get("/api/items", isAuthenticated, async (req, res) => {
    const itemList = await storage.getItemsByOwner(req.user!.id);
    res.json(itemList);
  });

  app.get("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;
    res.json(item);
  });

  app.put("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    const updated = await storage.updateItem(item.id, {
      description: req.body.description,
      category: req.body.category,
      brand: req.body.brand,
      model: req.body.model,
      price: req.body.price,
      price_type: req.body.price_type,
      amount: req.body.amount,
      serial_number: req.body.serial_number,
      image: req.body.image,
    });
    res.json(updated);
  });

  app.delete("/api/items/:id", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    await storage.deleteItem(item.id);
    res.status(204).end();
  });

  // ── Item Recognition (AI) ──

  app.post("/api/items/recognition", isAuthenticated, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const result = await recognizer.recognizeItem(req.file.buffer, req.file.mimetype);
    res.json(result);
  });

  app.post("/api/items/ask-price", isAuthenticated, async (req, res) => {
    const parsed = askPriceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await recognizer.askPrice(parsed.data.brand, parsed.data.model);
    res.json(result);
  });

  app.post("/api/items/re-recognize", isAuthenticated, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File is required" });

    const parsed = reEstimateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { brand, model, category, originalBrand, originalModel, originalCategory, originalPrice } = parsed.data;
    const result = await recognizer.reEstimateFromFile(
      req.file.buffer,
      req.file.mimetype,
      { brand, model, category },
      { brand: originalBrand, model: originalModel, category: originalCategory, price: originalPrice ? Number(originalPrice) : undefined }
    );
    res.json(result);
  });

  app.post("/api/items/:id/re-estimate", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    if (!item.image) return res.status(404).json({ message: "No primary image found for this item" });

    const parsed = reEstimateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await recognizer.reEstimateFromUrl(
      item.image,
      { brand: parsed.data.brand, model: parsed.data.model, category: parsed.data.category },
      { brand: item.brand, model: item.description || undefined, category: item.category, price: item.price ? Number(item.price) : undefined }
    );
    res.json(result);
  });

  // ── Item Images ──

  app.get("/api/items/:id/images", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    const images = await storage.getImagesByItem(item.id);
    res.json(images);
  });

  app.post("/api/items/:id/images", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    const parsed = addItemImageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const image = await storage.addImage({
      item_id: item.id,
      url: parsed.data.url,
      thumbnail_url: parsed.data.thumbnail_url || null,
      is_primary: parsed.data.is_primary ?? false,
      location_lat: parsed.data.location_lat,
      location_long: parsed.data.location_long,
    });
    res.status(201).json(image);
  });

  app.delete("/api/items/:id/images/:imageId", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    const deleted = await storage.deleteImage(Number(req.params.imageId), item.id);
    if (!deleted) return res.status(404).json({ message: "Image not found for this item" });
    res.status(204).end();
  });

  app.put("/api/items/:id/images/:imageId/primary", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    const updated = await storage.setPrimaryImage(Number(req.params.imageId), item.id);
    if (!updated) return res.status(404).json({ message: "Image not found for this item" });
    res.json({ success: true });
  });

  // ── Media ──

  app.post("/api/media", isAuthenticated, async (req, res) => {
    const parsed = mediaUploadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const urls = await media.getUploadUrls(parsed.data.fileName, req.user!.id);
    res.json(urls);
  });

  // Get a presigned read URL for a private GCS object
  app.get("/api/media/url", isAuthenticated, async (req, res) => {
    const key = req.query.key as string;
    if (!key) return res.status(400).json({ message: "key is required" });
    // Verify user owns the file (key starts with userId/)
    if (!key.startsWith(`${req.user!.id}/`)) return res.status(403).json({ message: "Forbidden" });

    const url = await media.getPresignedReadUrl(key);
    res.json({ url });
  });

  // ── Geocode ──

  app.post("/api/geocode", isAuthenticated, async (req, res) => {
    const parsed = geocodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await geocodeAddress(parsed.data.address);
    if (!result) return res.status(404).json({ message: "Address not found" });
    res.json(result);
  });

  // ── Users (admin) ──

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const user = await storage.createUser(parsed.data);
    res.status(201).json(pick(user, ["id", "name", "user_name", "role"]));
  });

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    const userList = await storage.getAllUsers();
    res.json(userList.map((u) => pick(u, ["id", "name", "user_name", "role", "email", "created_at"])));
  });

  app.get("/api/users/:username", isAuthenticated, isAdmin, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(pick(user, ["id", "name", "user_name", "role", "email", "created_at"]));
  });

  app.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const user = await storage.updateUser(Number(req.params.id), parsed.data);
    res.json(pick(user, ["id", "name", "user_name", "role"]));
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).end();
  });

  // ── Invites (admin) ──

  app.get("/api/admin/invites", isAuthenticated, isAdmin, async (_req, res) => {
    const invites = await storage.getInvitedUsers();
    res.json(invites);
  });

  app.post("/api/admin/invites", isAuthenticated, isAdmin, async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") return res.status(400).json({ message: "Email is required" });

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const already = await storage.isEmailInvited(trimmed);
    if (already) return res.status(409).json({ message: "Email already invited" });

    const invited = await storage.inviteUser(trimmed, req.user!.id);
    res.status(201).json(invited);
  });

  app.delete("/api/admin/invites/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.removeInvite(Number(req.params.id));
    res.status(204).end();
  });

  // ── Reports ──

  app.get("/api/reports/xlsx", isAuthenticated, async (req, res) => {
    const houseList = await storage.getHousesByOwner(req.user!.id);
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
        total: item.amount * (item.price ? Number(item.price) : 0),
      }));

      const ws = utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      utils.book_append_sheet(wb, ws, house.name.slice(0, 31));
    }

    const buffer = write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
    res.header("Content-Disposition", `attachment; filename="wotigot_report_${Date.now()}.xlsx"`);
    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.end(buffer);
  });

  // ── Health ──

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  return createServer(app);
}
