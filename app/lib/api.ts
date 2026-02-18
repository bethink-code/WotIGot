import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API client without authentication workflow
 */
export const publicApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshToken();
        return api(originalRequest);
      } catch (refreshError) {
        await removeTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

interface Tokens {
  access_token: string;
  refresh_token: string;
}

let tokens: Tokens | null = null;

export const setTokens = async (newTokens: Tokens) => {
  await AsyncStorage.setItem('rt', newTokens.refresh_token);
  tokens = newTokens;
};

export const removeTokens = async () => {
  await AsyncStorage.removeItem('rt');
  tokens = null;
};

const refreshToken = async () => {
  const refresh_token =
    tokens?.refresh_token || (await AsyncStorage.getItem('rt'));
  
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }
  
  const { data } = await publicApi.post('/auth/refresh', { refresh_token });
  await setTokens(data);
};

/**
 * Initialize tokens from storage on app startup.
 * This ensures we can refresh the access token after page reload.
 */
export const initializeAuth = async (): Promise<boolean> => {
  try {
    const storedRefreshToken = await AsyncStorage.getItem('rt');
    if (storedRefreshToken) {
      const { data } = await publicApi.post('/auth/refresh', { refresh_token: storedRefreshToken });
      await setTokens(data);
      return true;
    }
  } catch (error) {
    await removeTokens();
  }
  return false;
};

export const getAccessToken = () => {
  return tokens?.access_token;
};
