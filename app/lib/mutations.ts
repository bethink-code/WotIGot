import { api, publicApi, removeTokens, setTokens } from '@/lib/api';
import { Item } from '@/types/item';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

const MAX_IMAGE_DIMENSION = 1600;
const THUMBNAIL_SIZE = 256;
const IMAGE_QUALITY = 0.8;

async function compressImageWeb(
  uri: string,
  maxDimension: number,
  quality: number = IMAGE_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = uri;
  });
}

async function compressImageNative(
  uri: string,
  maxDimension: number,
  quality: number = IMAGE_QUALITY,
): Promise<string> {
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxDimension } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

async function compressImage(
  uri: string,
  maxDimension: number,
  quality: number = IMAGE_QUALITY,
): Promise<string> {
  if (Platform.OS === 'web') {
    return compressImageWeb(uri, maxDimension, quality);
  }
  return compressImageNative(uri, maxDimension, quality);
}

async function createThumbnail(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return compressImageWeb(uri, THUMBNAIL_SIZE, 0.7);
  }
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: THUMBNAIL_SIZE } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

async function imageUriToBlobAsync(uri: string) {
  return fetch(uri).then((res) => res.blob());
}

function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.split(',')[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('data:')) {
    return dataUriToArrayBuffer(uri);
  }
  return fetch(uri).then((res) => res.arrayBuffer());
}

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: async (payload: { username: string; password: string }) => {
      const { data } = await publicApi.post('/auth/login', payload);
      await setTokens(data);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['/auth/me'],
      }),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: async () => {
      await removeTokens();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['/auth/me'],
      }),
  });
};

export interface CreateHouseData {
  name: string;
  address: string;
  image?: string;
  location_lat?: number;
  location_long?: number;
}

export const useCreateHouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateHouseData) => {
      await api.post('/houses', payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['/houses'],
      }),
  });
};

export interface UpdateHouseData {
  id: number;
  name: string;
  address: string;
  image?: string;
}

export const useUpdateHouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateHouseData) => {
      const { id, ...data } = payload;
      await api.put(`/houses/${id}`, data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ['/houses'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/houses/${payload.id}`],
      });
    },
  });
};

export const useDeleteHouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/houses/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['/houses'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/houses/${id}`],
      });
    },
  });
};

export interface UpdateRoomData {
  id: number;
  name: string;
  image?: string;
}

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateRoomData) => {
      const { id, ...data } = payload;
      await api.put(`/rooms/${id}`, data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ['/rooms'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${payload.id}`],
      });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['/rooms'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${id}`],
      });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['/items'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/items/${id}`],
      });
    },
  });
};

export const useRecognition = () => {
  return useMutation({
    mutationFn: async (image: ImagePickerAsset) => {
      const form = new FormData();
      if (Platform.OS === 'web') {
        const blob = await imageUriToBlobAsync(image.uri);
        form.append('file', blob);
      } else {
        form.append('file', {
          uri: image.uri,
          name: image.fileName,
          type: image.mimeType,
        } as unknown as Blob);
      }
      return api
        .post('/items/recognition', form, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((res) => res.data);
    },
  });
};

export const useAskPrice = () => {
  return useMutation({
    mutationFn: async (data: { brand?: string; model?: string }) => {
      return api
        .post('/items/ask-price', data)
        .then((res) => res.data)
        .catch(() => ({}));
    },
  });
};

export interface ReRecognizeData {
  image: ImagePickerAsset;
  brand?: string;
  model?: string;
  category?: string;
  originalBrand?: string;
  originalModel?: string;
  originalCategory?: string;
  originalPrice?: number;
}

export const useReRecognize = () => {
  return useMutation({
    mutationFn: async (data: ReRecognizeData): Promise<ReEstimateResult> => {
      const form = new FormData();
      if (Platform.OS === 'web') {
        const blob = await imageUriToBlobAsync(data.image.uri);
        form.append('file', blob);
      } else {
        form.append('file', {
          uri: data.image.uri,
          name: data.image.fileName,
          type: data.image.mimeType,
        } as unknown as Blob);
      }
      if (data.brand) form.append('brand', data.brand);
      if (data.model) form.append('model', data.model);
      if (data.category) form.append('category', data.category);
      if (data.originalBrand) form.append('originalBrand', data.originalBrand);
      if (data.originalModel) form.append('originalModel', data.originalModel);
      if (data.originalCategory) form.append('originalCategory', data.originalCategory);
      if (data.originalPrice) form.append('originalPrice', data.originalPrice.toString());
      
      return api
        .post('/items/re-recognize', form, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        })
        .then((res) => res.data);
    },
  });
};

export interface ReEstimateData {
  itemId: number;
  brand?: string;
  model?: string;
  category?: string;
}

export interface ReEstimateResult {
  brand?: string;
  model?: string;
  price?: number;
  category?: string;
  amount?: number;
}

export const useReEstimate = () => {
  return useMutation({
    mutationFn: async (data: ReEstimateData): Promise<ReEstimateResult> => {
      const { itemId, ...context } = data;
      return api
        .post(`/items/${itemId}/re-estimate`, context, {
          timeout: 60000,
        })
        .then((res) => res.data);
    },
  });
};

export interface CreateRoomData {
  name: string;
  house_id: number;
  image?: string;
  location_lat?: number;
  location_long?: number;
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRoomData) => {
      await api.post('/rooms', payload);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ['/rooms'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/houses/${payload.house_id}/rooms`],
      });
    },
  });
};

export interface CreateItemData {
  category: string;
  room_id?: number;
  image?: string;
  brand?: string;
  model?: string;
  price?: number;
  amount: number;
  serial_number?: string;
  location_lat?: number;
  location_long?: number;
  price_type?: 'AI' | 'user' | 'invoice';
}

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateItemData) => {
      return api.post<Item>('/items', payload).then((res) => res.data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${payload.room_id}/items`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${payload.room_id}`],
      });
    },
  });
};

export interface UpdateItemData {
  id: number;
  category: string;
  brand?: string;
  model?: string;
  price?: number;
  amount: number;
  serial_number?: string;
  price_type: 'AI' | 'user' | 'invoice';
}

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateItemData) => {
      return api
        .put<Item>(`/items/${payload.id}`, payload)
        .then((res) => res.data);
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${item.room_id}/items`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/rooms/${item.room_id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/items/${item.id}`],
      });
    },
  });
};

export interface UploadMediaResult {
  url: string;
  thumbnailUrl: string;
}

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async (image: ImagePickerAsset): Promise<UploadMediaResult> => {
      const fileName = `${Date.now()}.jpg`;
      const { data } = await api.post('/media', { fileName });

      const [compressedUri, thumbnailUri] = await Promise.all([
        compressImage(image.uri, MAX_IMAGE_DIMENSION),
        createThumbnail(image.uri),
      ]);

      const [originalBuffer, thumbnailBuffer] = await Promise.all([
        uriToArrayBuffer(compressedUri),
        uriToArrayBuffer(thumbnailUri),
      ]);

      await Promise.all([
        axios.put(data.url, originalBuffer, {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
        axios.put(data.thumbnailUploadUrl, thumbnailBuffer, {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ]);

      return {
        url: data.url.replace(/\?.*$/, ''),
        thumbnailUrl: data.thumbnailUploadUrl.replace(/\?.*$/, ''),
      };
    },
  });
};

export interface AddItemImageData {
  itemId: number;
  url: string;
  thumbnail_url?: string;
  is_primary?: boolean;
  location_lat?: number;
  location_long?: number;
}

export const useAddItemImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddItemImageData) => {
      const { itemId, ...data } = payload;
      return api.post(`/items/${itemId}/images`, data).then((res) => res.data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: [`/items/${payload.itemId}/images`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/items/${payload.itemId}`],
      });
    },
  });
};

export interface DeleteItemImageData {
  itemId: number;
  imageId: number;
}

export const useDeleteItemImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeleteItemImageData) => {
      return api.delete(`/items/${payload.itemId}/images/${payload.imageId}`);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: [`/items/${payload.itemId}/images`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/items/${payload.itemId}`],
      });
    },
  });
};

export interface CreateUserData {
  name: string;
  user_name: string;
  password: string;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserData) => {
      await api.post('/users', payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['/users'],
      }),
  });
};

export interface UpdateUserData {
  id: number;
  name: string;
  user_name: string;
  password?: string;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateUserData) => {
      const { id, ...data } = payload;
      await api.put(`/users/${id}`, data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ['/users'],
      });

      queryClient.invalidateQueries({
        queryKey: [`/users/${payload.user_name}`],
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/users'],
      });
    },
  });
};

export interface UpdateProfileData {
  name: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfileData) => {
      await api.put('/auth/profile', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/auth/me'],
      });
    },
  });
};

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: ChangePasswordData) => {
      await api.put('/auth/password', payload);
    },
  });
};
