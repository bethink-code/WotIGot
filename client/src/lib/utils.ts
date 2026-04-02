/**
 * Format a number as South African Rand.
 */
export function formatRand(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return `R${num.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Get initials from a name (max 2 chars).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Compress an image file using canvas (max dimension, JPEG quality).
 */
async function ensureJpegCompatible(file: File): Promise<Blob> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif"
    || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
  if (!isHeic) return file;
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(blob) ? blob[0] : blob;
}

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.8
): Promise<Blob> {
  const source = await ensureJpegCompatible(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(source);
  });
}

/**
 * Generate a thumbnail from an image file.
 */
export async function generateThumbnail(file: File, size = 256, quality = 0.7): Promise<Blob> {
  return compressImage(file, size, quality);
}

/**
 * Trigger a file download from a blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
