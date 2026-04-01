import { Storage } from "@google-cloud/storage";
import path from "path";

const keyFilePath = path.resolve(process.cwd(), "gcs-service-account.json");
const storage = new Storage({ keyFilename: keyFilePath });
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
