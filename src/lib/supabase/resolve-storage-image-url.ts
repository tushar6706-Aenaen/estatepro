const DEFAULT_BUCKET = "images";

/**
 * Returns a browser-loadable URL for a property image.
 * Accepts either a full public URL or a storage object path (e.g. uploads/file.jpg)
 * relative to the "images" bucket.
 */
export function resolveStorageImageUrl(
  imageRef: string | null | undefined,
  bucket: string = DEFAULT_BUCKET,
): string | null {
  if (imageRef == null) return null;

  const trimmed = String(imageRef).trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  if (!base) {
    return trimmed;
  }

  // Stored as "/storage/v1/object/public/images/..." without host
  if (trimmed.startsWith("/storage/") || trimmed.startsWith("storage/")) {
    const segment = trimmed.replace(/^\/+/, "");
    return `${base}/${segment}`;
  }

  let path = trimmed.replace(/^\/+/, "");
  if (path.startsWith(`${bucket}/`)) {
    path = path.slice(bucket.length + 1);
  }

  // Older listings used bucket "property-images" with paths like properties/{user}/{id}/...
  if (path.startsWith("properties/")) {
    return `${base}/storage/v1/object/public/property-images/${path}`;
  }

  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
