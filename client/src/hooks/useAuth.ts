import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, publicApi, setTokens, removeTokens, initializeAuth, getAccessToken } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  name: string;
  user_name: string;
  role: "user" | "admin";
  has_password: boolean;
  has_google: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check for Google OAuth redirect tokens in URL
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    const errorParam = params.get("error");

    if (authParam) {
      try {
        const tokens = JSON.parse(authParam);
        setTokens(tokens);
        setHasToken(true);
        setInitialized(true);
        // Clean URL
        window.history.replaceState({}, "", "/");
        queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
        return;
      } catch { /* fall through to normal init */ }
    }

    if (errorParam) {
      window.history.replaceState({}, "", "/");
    }

    initializeAuth().then((success) => {
      setHasToken(success);
      setInitialized(true);
    });
  }, []);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/auth/me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    // Only query if we have a token — prevents 401 loop for unauthenticated users
    enabled: initialized && hasToken,
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await publicApi.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      setTokens(data);
      setHasToken(true);
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const res = await publicApi.post("/auth/google", { id_token: idToken });
      return res.data;
    },
    onSuccess: (data) => {
      setTokens(data);
      setHasToken(true);
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; user_name: string; password: string }) => {
      await publicApi.post("/auth/signup", data);
      const res = await publicApi.post("/auth/login", { username: data.user_name, password: data.password });
      return res.data;
    },
    onSuccess: (data) => {
      setTokens(data);
      setHasToken(true);
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });

  const logout = useCallback(() => {
    removeTokens();
    window.location.href = "/";
  }, []);

  return {
    user: user ?? null,
    isLoading: !initialized || (hasToken && isLoading),
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: loginMutation,
    googleLogin: googleLoginMutation,
    signup: signupMutation,
    logout,
  };
}
