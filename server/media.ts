import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";

// Support both file-based (local dev) and env var (Vercel) service account auth
function createStorage(): Storage {
  // Option 1: JSON key in env var (Vercel)
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_JSON);
    return new Storage({ credentials });
  }
  // Option 2: JSON key file (local dev)
  const keyFilePath = path.resolve(process.cwd(), "gcs-service-account.json");
  if (fs.existsSync(keyFilePath)) {
    return new Storage({ keyFilename: keyFilePath });
  }
  // Option 3: Default credentials (GCP hosting)
  return new Storage();
}

const storage = createStorage();
const bucketName = process.env.GCS_BUCKET || "wotigot-media";
const bucket = storage.bucket(bucketName);

/**
 * Generate signed PUT URLs for uploading original + thumbnail to GCS.
 * Files are private by default — use presigned GET URLs to read.
 */
export async function getUploadUrls(fileName: string, userId: number) {
  const originalKey = `${userId}/${fileName}`;
  const thumbnailKey = `${userId}/thumbs/${fileName}`;

  const [originalUrl] = await bucket.file(originalKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
    contentType: "image/jpeg",
  });

  const [thumbnailUrl] = await bucket.file(thumbnailKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1000,
    contentType: "image/jpeg",
  });

  return { originalUrl, thumbnailUrl, originalKey, thumbnailKey };
}

/**
 * Generate a presigned GET URL for reading a private GCS object.
 */
export async function getPresignedReadUrl(key: string): Promise<string> {
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
}

/**
 * Get the public URL for a GCS object (if bucket has public access).
 * For private buckets, use getPresignedReadUrl instead.
 */
export function getPublicUrl(key: string): string {
  return `https://storage.googleapis.com/${bucketName}/${key}`;
}
