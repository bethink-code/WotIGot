import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Resolve a GCS key (or full URL) to a readable image URL.
 * - If null/undefined, returns undefined.
 * - If already a full URL (http/https), returns as-is.
 * - If a GCS key (e.g. "5/room_123.jpg"), fetches a presigned read URL from the server.
 */
export function useImageUrl(keyOrUrl: string | null | undefined): string | undefined {
  const isKey = keyOrUrl && !keyOrUrl.startsWith("http") && !keyOrUrl.startsWith("blob:") && !keyOrUrl.startsWith("data:");

  const { data } = useQuery({
    queryKey: ["/media/url", keyOrUrl],
    queryFn: async () => {
      const res = await api.get("/media/url", { params: { key: keyOrUrl } });
      return res.data.url as string;
    },
    enabled: !!isKey,
    staleTime: 50 * 60 * 1000, // Cache for 50 minutes (URLs expire in 60)
  });

  if (!keyOrUrl) return undefined;
  if (!isKey) return keyOrUrl; // Already a full URL
  return data;
}
