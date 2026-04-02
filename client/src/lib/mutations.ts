import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// Helper to invalidate related queries after mutations
function useInvalidate(...keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

// ── Houses ──

export function useCreateHouse() {
  const invalidate = useInvalidate("/houses");
  return useMutation({
    mutationFn: async (data: { name: string; address: string; image?: string; location_lat?: number; location_long?: number }) => {
      return (await api.post("/houses", data)).data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; address?: string; image?: string; location_lat?: number; location_long?: number }) => {
      return (await api.put(`/houses/${id}`, data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: [`/houses/${vars.id}`] });
    },
  });
}

export function useDeleteHouse() {
  const invalidate = useInvalidate("/houses", "/rooms", "/items");
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/houses/${id}`);
    },
    onSuccess: invalidate,
  });
}

// ── Rooms ──

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; house_id: number; image?: string }) => {
      return (await api.post("/rooms", data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/rooms"] });
      qc.invalidateQueries({ queryKey: [`/houses/${vars.house_id}/rooms`] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; image?: string }) => {
      return (await api.put(`/rooms/${id}`, data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/rooms"] });
      qc.invalidateQueries({ queryKey: [`/rooms/${vars.id}`] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/rooms"] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: ["/items"] });
    },
  });
}

// ── Items ──

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { room_id: number; brand: string; model: string; category: string; price?: string; price_type?: string; amount?: number; description?: string; serial_number?: string; image?: string }) => {
      return (await api.post("/items", data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/items"] });
      qc.invalidateQueries({ queryKey: [`/rooms/${vars.room_id}/items`] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: ["/rooms"] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; brand?: string; model?: string; category?: string; price?: string; price_type?: string; amount?: number; description?: string; serial_number?: string; image?: string }) => {
      return (await api.put(`/items/${id}`, data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/items"] });
      qc.invalidateQueries({ queryKey: [`/items/${vars.id}`] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: ["/rooms"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/items"] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: ["/rooms"] });
    },
  });
}

// ── Item Images ──

export function useAddItemImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: number; url: string; thumbnail_url?: string; is_primary?: boolean; location_lat?: number; location_long?: number }) => {
      return (await api.post(`/items/${itemId}/images`, data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [`/items/${vars.itemId}/images`] });
      qc.invalidateQueries({ queryKey: [`/items/${vars.itemId}`] });
    },
  });
}

export function useDeleteItemImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, imageId }: { itemId: number; imageId: number }) => {
      await api.delete(`/items/${itemId}/images/${imageId}`);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [`/items/${vars.itemId}/images`] });
    },
  });
}

export function useSetPrimaryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, imageId }: { itemId: number; imageId: number }) => {
      return (await api.put(`/items/${itemId}/images/${imageId}/primary`)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [`/items/${vars.itemId}/images`] });
    },
  });
}

// ── Media ──

export function useGetUploadUrls() {
  return useMutation({
    mutationFn: async (fileName: string) => {
      return (await api.post("/media", { fileName })).data as {
        originalUrl: string;
        thumbnailUrl: string;
        originalKey: string;
        thumbnailKey: string;
      };
    },
  });
}

// ── AI Recognition ──

export function useRecognizeItem() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return (await api.post("/items/recognition", formData, { headers: { "Content-Type": "multipart/form-data" } })).data as {
        groups: Array<{ brand: string; model: string; price: number; category: string; count: number }>;
        usage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
      };
    },
  });
}

export function useAskPrice() {
  return useMutation({
    mutationFn: async (data: { brand: string; model: string }) => {
      return (await api.post("/items/ask-price", data)).data as { price: number };
    },
  });
}

export function useReRecognize() {
  return useMutation({
    mutationFn: async ({ file, ...data }: { file: File; brand?: string; model?: string; category?: string; originalBrand?: string; originalModel?: string; originalCategory?: string; originalPrice?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });
      return (await api.post("/items/re-recognize", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
    },
  });
}

export function useBulkCreateItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      roomId: number;
      imageKey: string;
      thumbnailKey?: string;
      lat?: number;
      lng?: number;
      items: Array<{ brand: string; model: string; category: string; price?: string; price_type?: string; amount?: number }>;
    }) => {
      return (await api.post("/items/bulk", data)).data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/items"] });
      qc.invalidateQueries({ queryKey: [`/rooms/${vars.roomId}`] });
      qc.invalidateQueries({ queryKey: ["/houses"] });
      qc.invalidateQueries({ queryKey: ["/rooms"] });
    },
  });
}

export function useReEstimateFromKey() {
  return useMutation({
    mutationFn: async (data: { imageKey: string }) => {
      return (await api.post("/items/re-estimate-from-key", data)).data as {
        groups: Array<{ brand: string; model: string; price: number; category: string; count: number }>;
        usage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
      };
    },
  });
}

export function useReEstimate() {
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: number; brand?: string; model?: string; category?: string }) => {
      return (await api.post(`/items/${itemId}/re-estimate`, data)).data as {
        brand?: string; model?: string; category?: string; price?: number; amount?: number;
      };
    },
  });
}

// ── Geocode ──

export function useGeocode() {
  return useMutation({
    mutationFn: async (address: string) => {
      return (await api.post("/geocode", { address })).data as { formattedAddress: string; coordinates: { lat: number; lng: number } };
    },
  });
}

// ── Admin: Users ──

export function useCreateUser() {
  const invalidate = useInvalidate("/users");
  return useMutation({
    mutationFn: async (data: { name: string; user_name: string; password: string }) => {
      return (await api.post("/users", data)).data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate("/users");
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name: string; user_name: string; password?: string }) => {
      return (await api.put(`/users/${id}`, data)).data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate("/users");
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(`/users/${id}`); },
    onSuccess: invalidate,
  });
}

// ── Admin: Invites ──

export function useInviteUser() {
  const invalidate = useInvalidate("/admin/invites");
  return useMutation({
    mutationFn: async (email: string) => {
      return (await api.post("/admin/invites", { email })).data;
    },
    onSuccess: invalidate,
  });
}

export function useRemoveInvite() {
  const invalidate = useInvalidate("/admin/invites");
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(`/admin/invites/${id}`); },
    onSuccess: invalidate,
  });
}

// ── Profile ──

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      return (await api.put("/auth/profile", data)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/auth/me"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return (await api.put("/auth/password", data)).data;
    },
  });
}
