import sharp from "sharp";
import { HttpError } from "./errors.js";

export const MAX_PORTRAIT_UPLOAD_BYTES = 5 * 1024 * 1024;
export const PORTRAIT_MAX_EDGE = 512;
export const PORTRAIT_WEBP_QUALITY = 82;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function assertAllowedPortraitMime(mime: string | undefined) {
  if (!mime || !ALLOWED_MIME.has(mime)) {
    throw new HttpError(
      400,
      "Unsupported image type. Use JPEG, PNG, WebP, GIF, or AVIF.",
    );
  }
}

export function assertPortraitUploadSize(byteLength: number) {
  if (byteLength <= 0) {
    throw new HttpError(400, "Empty image upload.");
  }
  if (byteLength > MAX_PORTRAIT_UPLOAD_BYTES) {
    throw new HttpError(400, "Image must be 5 MB or smaller.");
  }
}

/** Convert any supported raster input to a compact WebP suitable for DB storage. */
export async function convertPortraitToWebp(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input, { animated: false })
      .rotate()
      .resize({
        width: PORTRAIT_MAX_EDGE,
        height: PORTRAIT_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: PORTRAIT_WEBP_QUALITY, effort: 4 })
      .toBuffer();
  } catch {
    throw new HttpError(400, "Could not process image. Try another file.");
  }
}
