import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/**
 * Writes an uploaded image to local storage and returns its opaque id.
 * Swapping this for S3/R2 later means changing only this module and the read route.
 */
export async function storeImage(file: File): Promise<string | null> {
  const extension = ALLOWED.get(file.type);
  if (!extension) return null;
  if (file.size === 0 || file.size > MAX_BYTES) return null;

  // Name is generated, never derived from user input, so it cannot escape the directory.
  const name = `${randomUUID()}.${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export function uploadPath(name: string) {
  return path.join(UPLOAD_DIR, name);
}

/** Accepts only the generated `<uuid>.<ext>` shape, blocking traversal. */
export function isValidUploadName(name: string) {
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name);
}
