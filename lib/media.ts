/**
 * Product media helpers (safe for client and server).
 * Products can have images, videos, or both. Videos are uploaded straight from the
 * browser to Cloudinary (signed, chunked) so large files never pass through our API,
 * which has a ~4.5MB request body limit on Vercel.
 */

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_VIDEOS = 3;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // Cloudinary's per-video limit on standard plans
export const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/quicktime,video/webm,video/x-m4v,video/3gpp';

const CHUNK_SIZE = 20 * 1024 * 1024; // Cloudinary needs >= 5MB per chunk (except the last)
const CLOUDINARY_VIDEO_PATH = '/video/upload/';

export function isCloudinaryVideoUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url);
}

/** Only keep valid Cloudinary video URLs, de-duplicated, capped at the max */
export function sanitizeVideoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isCloudinaryVideoUrl))).slice(0, MAX_PRODUCT_VIDEOS);
}

/** JPG poster frame for a Cloudinary video (first frame), usable anywhere an image URL is expected */
export function videoPosterUrl(videoUrl: string): string {
  if (!isCloudinaryVideoUrl(videoUrl)) return '';
  const [base, rest] = videoUrl.split(CLOUDINARY_VIDEO_PATH);
  const withoutExt = rest.replace(/\.[a-z0-9]+$/i, '');
  return `${base}${CLOUDINARY_VIDEO_PATH}so_0,q_auto/${withoutExt}.jpg`;
}

export interface ProductMediaItem {
  type: 'image' | 'video';
  url: string;
  /** Image to show for thumbnails (the poster frame for videos) */
  thumbnail: string;
}

/**
 * Ordered gallery for a product: images first, then videos.
 * Video-only products store a poster frame in imageUrl for listings - it is not repeated here.
 */
export function getProductMedia(product: { imageUrl?: string; imageUrls?: string[]; videoUrls?: string[] }): ProductMediaItem[] {
  const videos = sanitizeVideoUrls(product.videoUrls);
  const imageList = (product.imageUrls || []).filter(Boolean);
  const images = imageList.length > 0
    ? imageList
    : product.imageUrl && videos.length === 0 ? [product.imageUrl] : [];

  return [
    ...images.map((url) => ({ type: 'image' as const, url, thumbnail: url })),
    ...videos.map((url) => ({ type: 'video' as const, url, thumbnail: videoPosterUrl(url) })),
  ];
}

export function validateVideoFile(file: File): string | null {
  if (!file.type.startsWith('video/')) return `"${file.name}" is not a video file`;
  if (file.size > MAX_VIDEO_BYTES) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(0)}MB - videos must be under ${MAX_VIDEO_BYTES / 1024 / 1024}MB`;
  }
  return null;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

function postChunk(
  url: string,
  form: FormData,
  headers: Record<string, string>,
  onChunkProgress: (loaded: number) => void,
  signal?: AbortSignal
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (event) => onChunkProgress(event.loaded);
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON error body
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.error?.message || `Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading video'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

/**
 * Upload a video directly to Cloudinary with a server-issued signature.
 * Large files are sent in chunks; progress is reported from 0 to 100.
 */
export async function uploadVideoToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<{ url: string; publicId: string; posterUrl: string; duration?: number }> {
  const invalid = validateVideoFile(file);
  if (invalid) throw new Error(invalid);

  const signRes = await fetch('/api/admin/cloudinary-signature', { method: 'POST', signal });
  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(signData.error || 'Could not authorise video upload');
  const sig = signData as UploadSignature;

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`;
  const uploadId = `empi-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let result: any = null;

  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const form = new FormData();
    form.append('file', file.slice(start, end), file.name);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.folder);

    result = await postChunk(
      endpoint,
      form,
      { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${start}-${end - 1}/${file.size}` },
      (loaded) => onProgress?.(Math.min(99, Math.round(((start + loaded) / file.size) * 100))),
      signal
    );
  }

  if (!result?.secure_url) throw new Error('Cloudinary did not return a video URL');
  onProgress?.(100);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    posterUrl: videoPosterUrl(result.secure_url),
    duration: result.duration,
  };
}
