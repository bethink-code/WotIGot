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
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const isHeic = type === "image/heic" || type === "image/heif"
    || name.endsWith(".heic") || name.endsWith(".heif");
  if (!isHeic) return file;

  try {
    const mod = await import("heic2any");
    const convert = mod.default || mod;
    const blob = await convert({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return Array.isArray(blob) ? blob[0] : blob;
  } catch (err) {
    console.error("[utils] HEIC conversion failed:", err);
    // Fall back to original file — the browser may still handle it
    return file;
  }
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
