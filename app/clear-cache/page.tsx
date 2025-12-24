'use client';

import { useEffect, useState } from 'react';

export default function ClearCachePage() {
  const [cacheInfo, setCacheInfo] = useState<any>({});
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    const info: any = {
      totalKeys: keys.length,
      caches: {},
      others: {}
    };

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const size = value ? (value.length / 1024).toFixed(2) : '0';

      if (key.startsWith('empi_products_cache_')) {
        try {
          const data = JSON.parse(value || '{}');
          info.caches[key] = {
            size,
            products: data.products?.length || 0,
            cachedAt: new Date(data.timestamp).toISOString(),
            firstProduct: data.products?.[0]?.name || 'N/A'
          };
        } catch (e) {
          info.caches[key] = { size, error: 'Failed to parse' };
        }
      } else {
        info.others[key] = { size };
      }
    });

    setCacheInfo(info);
  }, []);

  const handleClearCache = () => {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;

    keys.forEach(key => {
      if (key.startsWith('empi_products_cache_')) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    setCleared(true);
    alert(`✅ Cleared ${clearedCount} product cache entries!\n\nRefresh the page to see the updated data.`);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure? This will clear ALL localStorage data including session data and preferences!')) {
      localStorage.clear();
      setCleared(true);
      alert('✅ All localStorage cleared!\n\nRefresh the page.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">🗑️ Cache Management</h1>
          <p className="text-slate-600 mb-8">Clear stale product caches from localStorage</p>

          {/* Cache Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">📊 Cache Information</h2>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600">
                <strong>Total localStorage keys:</strong> {cacheInfo.totalKeys}
              </p>
            </div>

            {/* Product Caches */}
            {Object.keys(cacheInfo.caches || {}).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Product Caches ({Object.keys(cacheInfo.caches).length}):</h3>
                <div className="space-y-3 ml-4">
                  {Object.entries(cacheInfo.caches).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white p-3 rounded border border-blue-100">
                      <p className="font-mono text-xs text-slate-700 mb-1 break-all">{key}</p>
                      {value.error ? (
                        <p className="text-red-600 text-sm">{value.error}</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600">
                            📦 <strong>{value.products}</strong> products ({value.size} KB)
                          </p>
                          {value.firstProduct && (
                            <p className="text-sm text-slate-600">
                              First: <strong>{value.firstProduct}</strong>
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Cached: {value.cachedAt}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Keys */}
            {Object.keys(cacheInfo.others || {}).length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Other Data ({Object.keys(cacheInfo.others).length}):</h3>
                <div className="space-y-2 ml-4">
                  {Object.entries(cacheInfo.others).map(([key, value]: [string, any]) => (
                    <p key={key} className="text-sm text-slate-600">
                      {key} <span className="text-slate-400">({value.size} KB)</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleClearCache}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              🗑️ Clear Product Caches Only
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              🔥 Clear ALL localStorage
            </button>
          </div>

          {cleared && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                ✅ Cache cleared! <br/>
                <strong>Next step:</strong> Refresh this page or navigate to the dashboard to see fresh data from the database.
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              💡 <strong>Note:</strong> If the "Samuel Stanley" card still appears after clearing the cache, the issue may be in the Next.js build cache. In that case:
              <br/>1. Stop the dev server (Ctrl + C)
              <br/>2. Delete the <code className="bg-white px-1 py-0.5 rounded">.next</code> folder
              <br/>3. Run <code className="bg-white px-1 py-0.5 rounded">npm run dev</code> again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
