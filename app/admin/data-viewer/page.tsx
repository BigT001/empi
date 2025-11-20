'use client';

import { useState, useEffect } from 'react';

interface MongoDocument {
  _id: string;
  [key: string]: any;
}

export default function DataViewer() {
  const [selectedCollection, setSelectedCollection] = useState('products');
  const [data, setData] = useState<MongoDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const collections = ['products', 'buyers', 'invoices', 'orders', 'carts', 'errorlogs'];

  useEffect(() => {
    fetchData(selectedCollection);
  }, [selectedCollection]);

  const fetchData = async (collection: string) => {
    setLoading(true);
    setError('');
    try {
      // Map collection names to API endpoints
      let endpoint = `/api/${collection}`;
      if (collection === 'errorlogs') {
        endpoint = '/api/errors';
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch ${collection}`);
      
      const result = await response.json();
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return '[Object]';
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const getColumns = (): string[] => {
    if (data.length === 0) return [];
    const firstDoc = data[0];
    return Object.keys(firstDoc).slice(0, 8); // Show first 8 columns
  };

  const columns = getColumns();

  return (
    <div className="p-8 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">MongoDB Data Viewer</h1>

        {/* Collection Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Collection:
          </label>
          <div className="flex flex-wrap gap-2">
            {collections.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCollection === col
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              Loading {selectedCollection} data...
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700">
              Error: {error}
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No documents found in {selectedCollection}
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-sm font-medium text-gray-700">
                  Found {data.length} document{data.length !== 1 ? 's' : ''}
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((doc, idx) => (
                    <tr
                      key={doc._id || idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                          title={String(doc[col])}
                        >
                          {formatValue(doc[col])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => {
                            const jsonStr = JSON.stringify(doc, null, 2);
                            const blob = new Blob([jsonStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedCollection}-${doc._id}.json`;
                            a.click();
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Full
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
    </div>
  );
}
