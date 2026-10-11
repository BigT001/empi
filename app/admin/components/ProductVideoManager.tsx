'use client';

import { useEffect, useRef, useState } from 'react';
import { Film, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  uploadVideoToCloudinary,
  validateVideoFile,
  videoPosterUrl,
} from '@/lib/media';

interface UploadEntry {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

interface ProductVideoManagerProps {
  /** Already-uploaded Cloudinary video URLs */
  videoUrls: string[];
  /** Updater form so concurrent uploads never overwrite each other */
  onChange: (update: (prev: string[]) => string[]) => void;
  /** Lets the parent block saving while videos are still uploading */
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

/**
 * Upload/remove product videos. Each video uploads straight to Cloudinary as soon as it is
 * picked, so the admin can keep filling in the product while it finishes.
 */
export function ProductVideoManager({ videoUrls, onChange, onUploadingChange, disabled }: ProductVideoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const nextId = useRef(0);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [notice, setNotice] = useState('');

  const activeCount = uploads.filter((u) => !u.error).length;
  const remainingSlots = MAX_PRODUCT_VIDEOS - videoUrls.length - uploads.length;

  useEffect(() => {
    onUploadingChange?.(activeCount > 0);
  }, [activeCount, onUploadingChange]);

  // Cancel anything still uploading if the form closes
  useEffect(() => {
    const current = controllers.current;
    return () => current.forEach((c) => c.abort());
  }, []);

  const startUpload = (entry: UploadEntry) => {
    const controller = new AbortController();
    controllers.current.set(entry.id, controller);

    uploadVideoToCloudinary(
      entry.file,
      (progress) => setUploads((prev) => prev.map((u) => (u.id === entry.id ? { ...u, progress } : u))),
      controller.signal
    )
      .then(({ url }) => {
        onChange((prev) => (prev.includes(url) ? prev : [...prev, url]));
        setUploads((prev) => prev.filter((u) => u.id !== entry.id));
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          setUploads((prev) => prev.filter((u) => u.id !== entry.id));
          return;
        }
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploads((prev) => prev.map((u) => (u.id === entry.id ? { ...u, error: message } : u)));
      })
      .finally(() => controllers.current.delete(entry.id));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const problems: string[] = [];
    const accepted: UploadEntry[] = [];
    for (const file of files) {
      const invalid = validateVideoFile(file);
      if (invalid) {
        problems.push(invalid);
      } else if (accepted.length < remainingSlots) {
        nextId.current += 1;
        accepted.push({ id: `video-${nextId.current}`, file, progress: 0 });
      } else {
        problems.push(`Only ${MAX_PRODUCT_VIDEOS} videos allowed per product`);
        break;
      }
    }

    setNotice(problems.join(' · '));
    if (accepted.length === 0) return;
    setUploads((prev) => [...prev, ...accepted]);
    accepted.forEach(startUpload);
  };

  const cancelUpload = (id: string) => {
    controllers.current.get(id)?.abort();
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const retryUpload = (entry: UploadEntry) => {
    const fresh = { ...entry, progress: 0, error: undefined };
    setUploads((prev) => prev.map((u) => (u.id === entry.id ? fresh : u)));
    startUpload(fresh);
  };

  const removeVideo = (url: string) => onChange((prev) => prev.filter((v) => v !== url));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Optional. Up to {MAX_PRODUCT_VIDEOS} videos, max {MAX_VIDEO_BYTES / 1024 / 1024}MB each (MP4, MOV, WebM).
        </p>
        <span className="text-xs bg-lime-100 text-lime-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
          {videoUrls.length}/{MAX_PRODUCT_VIDEOS}
        </span>
      </div>

      {(videoUrls.length > 0 || uploads.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videoUrls.map((url, idx) => (
            <div key={url} className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-black">
              <video
                src={url}
                poster={videoPosterUrl(url)}
                controls
                playsInline
                preload="none"
                className="w-full aspect-video object-contain"
              />
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                Video {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeVideo(url)}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition disabled:opacity-50"
                title="Remove video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {uploads.map((u) => (
            <div key={u.id} className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3 flex flex-col justify-center gap-2 aspect-video">
              <div className="flex items-center gap-2 min-w-0">
                {u.error ? (
                  <Film className="h-4 w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-lime-600 animate-spin flex-shrink-0" />
                )}
                <p className="text-xs font-semibold text-gray-800 truncate">{u.file.name}</p>
              </div>
              {u.error ? (
                <>
                  <p className="text-xs text-red-600">{u.error}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => retryUpload(u)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-lime-600 text-white hover:bg-lime-700"
                    >
                      <RotateCcw className="h-3 w-3" /> Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelUpload(u.id)}
                      className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-lime-600 transition-all" style={{ width: `${u.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Uploading… {u.progress}%</span>
                    <button
                      type="button"
                      onClick={() => cancelUpload(u.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {remainingSlots > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:bg-lime-50/50 hover:border-lime-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Film className="h-5 w-5 text-lime-600" />
          <span className="text-sm font-bold text-gray-700">Add Video ({remainingSlots} left)</span>
        </button>
      )}
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_VIDEO_TYPES} onChange={handleFiles} className="hidden" />

      {notice && <p className="text-xs text-red-600">{notice}</p>}
    </div>
  );
}
