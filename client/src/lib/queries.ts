import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { House, Room, Item, ItemImage } from "@shared/schema";

type HouseWithTotals = House & { total_value: number; total_items: number };
type RoomWithTotals = Room & { total_value: number; total_items: number };

export function useHouses() {
  return useQuery<HouseWithTotals[]>({
    queryKey: ["/houses"],
    queryFn: async () => (await api.get("/houses")).data,
  });
}

export function useHouse(id: number | undefined) {
  return useQuery<House>({
    queryKey: [`/houses/${id}`],
    queryFn: async () => (await api.get(`/houses/${id}`)).data,
    enabled: !!id,
  });
}

export function useHouseRooms(houseId: number | undefined) {
  return useQuery<RoomWithTotals[]>({
    queryKey: [`/houses/${houseId}/rooms`],
    queryFn: async () => (await api.get(`/houses/${houseId}/rooms`)).data,
    enabled: !!houseId,
  });
}

export function useHouseTotals(houseId: number | undefined) {
  return useQuery<{ total_price: number; total_items: number }>({
    queryKey: [`/houses/${houseId}/totals`],
    queryFn: async () => (await api.get(`/houses/${houseId}/totals`)).data,
    enabled: !!houseId,
  });
}

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ["/rooms"],
    queryFn: async () => (await api.get("/rooms")).data,
  });
}

export function useRoom(id: number | undefined) {
  return useQuery<Room>({
    queryKey: [`/rooms/${id}`],
    queryFn: async () => (await api.get(`/rooms/${id}`)).data,
    enabled: !!id,
  });
}

export function useRoomItems(roomId: number | undefined) {
  return useQuery<Item[]>({
    queryKey: [`/rooms/${roomId}/items`],
    queryFn: async () => (await api.get(`/rooms/${roomId}/items`)).data,
    enabled: !!roomId,
  });
}

export function useRoomTotals(roomId: number | undefined) {
  return useQuery<{ total_price: number; total_items: number }>({
    queryKey: [`/rooms/${roomId}/totals`],
    queryFn: async () => (await api.get(`/rooms/${roomId}/totals`)).data,
    enabled: !!roomId,
  });
}

export function useItems() {
  return useQuery<Item[]>({
    queryKey: ["/items"],
    queryFn: async () => (await api.get("/items")).data,
  });
}

export function useItem(id: number | undefined) {
  return useQuery<Item>({
    queryKey: [`/items/${id}`],
    queryFn: async () => (await api.get(`/items/${id}`)).data,
    enabled: !!id,
  });
}

export function useItemImages(itemId: number | undefined) {
  return useQuery<ItemImage[]>({
    queryKey: [`/items/${itemId}/images`],
    queryFn: async () => (await api.get(`/items/${itemId}/images`)).data,
    enabled: !!itemId,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["/users"],
    queryFn: async () => (await api.get("/users")).data,
  });
}

export function useInvites() {
  return useQuery({
    queryKey: ["/admin/invites"],
    queryFn: async () => (await api.get("/admin/invites")).data,
  });
}
