'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CloudinaryAsset {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
}

export default function CloudinaryViewer() {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [folder, setFolder] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      // Default to 'empi' folder if no folder specified
      const searchFolder = folder || 'empi';
      const response = await fetch('/api/cloudinary/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: searchFolder }),
      });

      if (!response.ok) throw new Error('Failed to fetch Cloudinary assets');
      const result = await response.json();
      setAssets(result.resources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Cloudinary Media Manager</h1>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subfolder (defaults to "empi"):
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g., products, men, women (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to see all images in the empi folder</p>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAssets}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            Error: {error}
          </div>
        )}

        {/* Assets Grid */}
        <div>
          {loading && (
            <div className="text-center py-12 text-gray-500">
              Loading Cloudinary assets...
            </div>
          )}

          {!loading && assets.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              No images found in empi folder. Start uploading products to see images here.
            </div>
          )}

          {!loading && assets.length > 0 && (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                Found {assets.length} image{assets.length !== 1 ? 's' : ''}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                  <div
                    key={asset.public_id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Image Preview */}
                    <div className="relative w-full h-48 bg-gray-200">
                      <Image
                        src={asset.secure_url}
                        alt={asset.public_id}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Details */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-sm truncate mb-2">
                        {asset.public_id.split('/').pop()}
                      </h3>

                      <dl className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <dt className="font-medium">Size:</dt>
                          <dd>{formatBytes(asset.bytes)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Dimensions:</dt>
                          <dd>
                            {asset.width}×{asset.height}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Format:</dt>
                          <dd>{asset.format.toUpperCase()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Uploaded:</dt>
                          <dd>{formatDate(asset.created_at)}</dd>
                        </div>
                      </dl>

                      {/* URL Copy */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">URL:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={asset.secure_url}
                            readOnly
                            className="flex-1 text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(asset.secure_url);
                              alert('URL copied!');
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete image "${asset.public_id}"?`)) return;
                          try {
                            const res = await fetch('/api/cloudinary/delete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ publicId: asset.public_id }),
                            });
                            if (res.ok) {
                              alert('Image deleted');
                              fetchAssets();
                            } else {
                              alert('Failed to delete');
                            }
                          } catch (err) {
                            alert('Delete failed: ' + err);
                          }
                        }}
                        className="mt-4 w-full py-2 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
    </div>
  );
}
