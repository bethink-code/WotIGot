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
  bulkCreateItemsSchema, reEstimateFromKeySchema,
  geocodeSchema, mediaUploadSchema, createUserSchema, updateUserSchema,
  updateProfileSchema, changePasswordSchema, requestAccessSchema, priceTypeNameMap,
} from "../shared/schema";
import { audit, queryAuditLogs, getActivitySummary } from "./auditLog";
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
    audit(req, { action: "auth.login", resourceType: "user", resourceId: user.id });
    res.json({ access_token, refresh_token });
  });

  app.post("/api/auth/google", async (req, res) => {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    try {
      const user = await validateGoogleToken(parsed.data.id_token);
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user);
      audit(req, { action: "auth.google_login", resourceType: "user", resourceId: user.id });
      res.json({ access_token, refresh_token });
    } catch (err: any) {
      if (err.message === "NOT_INVITED") {
        audit(req, { action: "auth.login_blocked", outcome: "denied", detail: "Email not invited" });
        return res.status(403).json({ message: "Your email has not been invited. Please request access." });
      }
      console.error("[auth] Google token validation failed:", err.message);
      res.status(401).json({ message: err.message || "Invalid Google token" });
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

    const result: any = {
      ...pick(user, ["id", "name", "user_name", "role", "photo_url"]),
      has_password: !!user.password,
      has_google: !!user.google_id,
      terms_accepted: !!user.terms_accepted_at,
    };

    if (user.role === "admin") {
      result.pending_request_count = await storage.getPendingAccessRequestCount();
    }

    res.json(result);
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
    audit(req, { action: "house.create", resourceType: "house", resourceId: house.id });
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
    audit(req, { action: "house.delete", resourceType: "house", resourceId: house.id });
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
    audit(req, { action: "room.create", resourceType: "room", resourceId: room.id });
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
    audit(req, { action: "room.delete", resourceType: "room", resourceId: room.id });
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
    audit(req, { action: "item.create", resourceType: "item", resourceId: item.id });
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
    audit(req, { action: "item.delete", resourceType: "item", resourceId: item.id });
    res.status(204).end();
  });

  // ── Item Recognition (AI) ──

  app.post("/api/items/recognition", isAuthenticated, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    console.log(`[recognition] file: ${req.file.originalname}, type: ${req.file.mimetype}, size: ${req.file.size} bytes`);
    try {
      const { groups, usage } = await recognizer.recognizeGroupedItems(req.file.buffer, req.file.mimetype);
      storage.logAiUsage({ userId: req.user!.id, action: "recognition", model: "gemini-3-flash-preview", inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, estimatedCostUsd: usage.estimatedCostUsd });
      res.json({ groups, usage });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Recognition failed" });
    }
  });

  app.post("/api/items/ask-price", isAuthenticated, async (req, res) => {
    const parsed = askPriceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await recognizer.askPrice(parsed.data.brand, parsed.data.model);
    res.json(result);
  });

  app.post("/api/items/:id/re-estimate", isAuthenticated, async (req, res) => {
    const item = await storage.getItemById(Number(req.params.id));
    if (!assertOwnership(item, req.user!.id, "Item", res)) return;

    // Use item.image or fall back to primary ItemImage
    let imageKey = item.image;
    let thumbnailKey: string | null = null;
    if (!imageKey) {
      const images = await storage.getImagesByItem(item.id);
      const primary = images.find((img) => img.is_primary) || images[0];
      imageKey = primary?.url ?? null;
      thumbnailKey = primary?.thumbnail_url ?? null;
    }

    if (!imageKey) return res.status(404).json({ message: "No image found for this item" });

    // Resolve GCS key to a presigned URL, fetch the image, run grouped recognition
    const imageUrl = await media.getPresignedReadUrl(imageKey);
    const response = await fetch(imageUrl);
    if (!response.ok) return res.status(500).json({ message: "Failed to fetch stored image" });
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    try {
      const { groups, usage } = await recognizer.recognizeGroupedItems(buffer, mimeType);
      storage.logAiUsage({ userId: req.user!.id, action: "re-estimate", model: "gemini-3-flash-preview", inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, estimatedCostUsd: usage.estimatedCostUsd });

      // Find the group that best matches this item's brand/model
      const itemBrand = item.brand.toLowerCase();
      const itemModel = item.model.toLowerCase();
      const match = groups.find((g) =>
        g.brand.toLowerCase() === itemBrand || g.model.toLowerCase().includes(itemModel) || itemModel.includes(g.model.toLowerCase())
      ) || groups[0];

      res.json({
        brand: match?.brand ?? item.brand,
        model: match?.model ?? item.model,
        category: match?.category ?? item.category,
        price: match?.price ?? 0,
        amount: match?.count ?? item.amount,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Re-estimation failed" });
    }
  });

  // ── Bulk Create (from scan review) ──

  app.post("/api/items/bulk", isAuthenticated, async (req, res) => {
    const parsed = bulkCreateItemsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const room = await storage.getRoomById(parsed.data.roomId);
    if (!assertOwnership(room, req.user!.id, "Room", res)) return;

    const createdItems = [];
    for (const itemData of parsed.data.items) {
      const item = await storage.createItem({
        room_id: room.id,
        house_id: room.house_id,
        owner_id: req.user!.id,
        brand: itemData.brand,
        model: itemData.model,
        category: itemData.category,
        price: itemData.price,
        price_type: (itemData.price_type as "AI" | "user" | "invoice") || "AI",
        amount: itemData.amount,
        image: parsed.data.imageKey,
      });

      // Attach the scanned image as primary for each item
      await storage.addImage({
        item_id: item.id,
        url: parsed.data.imageKey,
        thumbnail_url: parsed.data.thumbnailKey || null,
        is_primary: true,
        location_lat: parsed.data.lat,
        location_long: parsed.data.lng,
      });

      createdItems.push(item);
    }

    audit(req, { action: "item.bulk_create", resourceType: "item", resourceId: createdItems[0]?.id, detail: `${createdItems.length} items created` });
    res.status(201).json(createdItems);
  });

  // ── Re-estimate from GCS key (for scan review) ──

  app.post("/api/items/re-estimate-from-key", isAuthenticated, async (req, res) => {
    const parsed = reEstimateFromKeySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    // Verify user owns this image key (keys are prefixed with userId/)
    if (!parsed.data.imageKey.startsWith(`${req.user!.id}/`)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Same grouped recognition as every other path
    const imageUrl = await media.getPresignedReadUrl(parsed.data.imageKey);
    const response = await fetch(imageUrl);
    if (!response.ok) return res.status(500).json({ message: "Failed to fetch image" });
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    try {
      const { groups, usage } = await recognizer.recognizeGroupedItems(buffer, mimeType);
      storage.logAiUsage({ userId: req.user!.id, action: "re-estimate-from-key", model: "gemini-3-flash-preview", inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, estimatedCostUsd: usage.estimatedCostUsd });
      res.json({ groups, usage });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Re-estimation failed" });
    }
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
    if (!result) {
      // Debug: try raw Google call to see what's happening
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

  // ── Access Requests (public) ──

  app.post("/api/request-access", async (req, res) => {
    const parsed = requestAccessSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const request = await storage.createAccessRequest(parsed.data);
    res.status(201).json({ message: "Access request submitted", id: request.id });
  });

  // ── Terms ──

  app.post("/api/user/accept-terms", isAuthenticated, async (req, res) => {
    await storage.acceptTerms(req.user!.id);
    audit(req, { action: "terms.accept" });
    res.json({ message: "Terms accepted" });
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
    audit(req, { action: "invite.create", resourceType: "invite", resourceId: invited.id, detail: trimmed });
    res.status(201).json(invited);
  });

  app.delete("/api/admin/invites/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.removeInvite(Number(req.params.id));
    audit(req, { action: "invite.remove", resourceType: "invite", resourceId: req.params.id });
    res.status(204).end();
  });

  // ── Admin: Toggle Admin ──

  app.patch("/api/admin/users/:id/admin", isAuthenticated, isAdmin, async (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.user!.id) {
      return res.status(400).json({ message: "Cannot change your own admin status" });
    }

    const user = await storage.getUserById(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newRole = user.role === "admin" ? "user" : "admin";
    const updated = await storage.updateUser(targetId, { name: user.name, user_name: user.user_name });
    // Direct role update since updateUser doesn't handle role
    const { db: database } = await import("./db");
    const { users: usersTable } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    await database.update(usersTable).set({ role: newRole as any }).where(eq(usersTable.id, targetId));

    audit(req, { action: "user.toggle_admin", resourceType: "user", resourceId: targetId, detail: `Set role to ${newRole}` });
    res.json({ id: targetId, role: newRole });
  });

  // ── Admin: Access Requests ──

  app.get("/api/admin/access-requests", isAuthenticated, isAdmin, async (_req, res) => {
    const requests = await storage.getAccessRequests();
    res.json(requests);
  });

  app.patch("/api/admin/access-requests/:id", isAuthenticated, isAdmin, async (req, res) => {
    const { status } = req.body;
    if (status !== "approved" && status !== "declined") {
      return res.status(400).json({ message: "Status must be approved or declined" });
    }

    const request = await storage.updateAccessRequestStatus(Number(req.params.id), status);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (status === "approved") {
      const already = await storage.isEmailInvited(request.email);
      if (!already) {
        await storage.inviteUser(request.email, req.user!.id);
      }
    }

    audit(req, { action: `access_request.${status}`, resourceType: "access_request", resourceId: req.params.id });
    res.json(request);
  });

  // ── Admin: Audit Logs ──

  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    const result = await queryAuditLogs({
      action: req.query.action as string | undefined,
      outcome: req.query.outcome as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });
    res.json(result);
  });

  // ── Admin: Security Overview ──

  app.get("/api/admin/security-overview", isAuthenticated, isAdmin, async (_req, res) => {
    const [allUsers, invites, pendingRequests, activity] = await Promise.all([
      storage.getAllUsers(),
      storage.getInvitedUsers(),
      storage.getPendingAccessRequestCount(),
      getActivitySummary(),
    ]);

    res.json({
      total_users: allUsers.length,
      admin_count: allUsers.filter((u) => u.role === "admin").length,
      total_invites: invites.length,
      pending_requests: pendingRequests,
      activity_24h: activity,
    });
  });

  // ── Admin: AI Usage ──

  app.get("/api/admin/ai-usage", isAuthenticated, isAdmin, async (_req, res) => {
    const summary = await storage.getAiUsageSummary();
    res.json(summary);
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

  app.get("/api/health", (_req, res) => res.json({
    status: "ok",
    hasGeoKey: !!process.env.GOOGLE_MAPS_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGcsKey: !!process.env.GCS_SERVICE_ACCOUNT_JSON,
    hasDbUrl: !!process.env.DATABASE_URL,
  }));

  return createServer(app);
}
