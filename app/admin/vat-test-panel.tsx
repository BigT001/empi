import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Code, Copy } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'idle';
  message: string;
  data?: any;
  timestamp?: string;
}

export default function VATTestPanel() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const runTest = async (testName: string, endpoint: string) => {
    const testId = `test-${Date.now()}`;
    
    // Add pending test
    setResults(prev => [...prev, {
      name: testName,
      status: 'pending',
      message: 'Running...',
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      setResults(prev => prev.map(r => 
        r.name === testName 
          ? {
              ...r,
              status: response.ok ? 'success' : 'error',
              message: response.ok ? 'Test passed' : 'Test failed',
              data: data,
              timestamp: new Date().toLocaleTimeString()
            }
          : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.name === testName 
          ? {
              ...r,
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toLocaleTimeString()
            }
          : r
      ));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    
    const tests = [
      { name: 'Database Connection', endpoint: '/api/test/db-connection' },
      { name: 'VAT Calculations', endpoint: '/api/test/vat-calc' },
      { name: 'Environment Check', endpoint: '/api/test/env' },
      { name: 'Manual Rollover', endpoint: '/api/admin/vat/rollover' },
      { name: 'VAT Analytics', endpoint: '/api/admin/vat-analytics' },
    ];

    setResults([]);

    for (const test of tests) {
      await runTest(test.name, test.endpoint);
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">VAT System Test Panel</h2>
        <p className="text-sm text-gray-600">Test the VAT rollover system and view results</p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              ▶️ Run All Tests
            </>
          )}
        </button>

        <button
          onClick={() => runTest('Manual Rollover', '/api/admin/vat/rollover')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          🔄 Manual Rollover
        </button>

        <button
          onClick={() => runTest('VAT Analytics', '/api/admin/vat-analytics')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
        >
          📊 Get Analytics
        </button>

        <button
          onClick={() => setResults([])}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No tests run yet. Click a button above to start testing.</p>
          </div>
        ) : (
          results.map((result, idx) => (
            <div
              key={idx}
              className={`border rounded-lg overflow-hidden ${
                result.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : result.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : result.status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                onClick={() => setExpandedTest(expandedTest === result.name ? null : result.name)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  {result.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  {result.status === 'pending' && (
                    <Loader className="h-5 w-5 text-yellow-600 animate-spin flex-shrink-0" />
                  )}

                  <div>
                    <p className="font-medium text-gray-900">{result.name}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    {result.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
                    )}
                  </div>
                </div>

                {result.data && (
                  <Code className="h-4 w-4 text-gray-600 ml-4 flex-shrink-0" />
                )}
              </button>

              {/* Expandable Details */}
              {expandedTest === result.name && result.data && (
                <div className="border-t px-4 py-4 bg-black/2">
                  <div className="relative bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                      className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded transition"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Testing Tips:</strong> Start with "Run All Tests" to verify everything is working. 
          Use "Manual Rollover" to test VAT calculations with current data. 
          Expand test results to see detailed response data.
        </p>
      </div>
    </div>
  );
}
