'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [dataAuth, setDataAuth] = useState<any>(null);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  const [loadingPublic, setLoadingPublic] = useState(true);
  const [dataPublic, setDataPublic] = useState<any>(null);
  const [errorPublic, setErrorPublic] = useState<string | null>(null);

  useEffect(() => {
    // Test AUTHENTICATED endpoint
    const fetchAuthData = async () => {
      try {
        console.log('🔍 Fetching /api/admin/users?subAdminsOnly=true (WITH auth)');
        const response = await fetch('/api/admin/users?subAdminsOnly=true', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const json = await response.json();
          console.log('✅ Success! Data:', json);
          setDataAuth(json);
        } else {
          const json = await response.json().catch(() => ({}));
          console.log('❌ Error response:', json);
          setErrorAuth(`${response.status}: ${json.error || response.statusText}`);
        }
      } catch (err) {
        console.error('🔥 Exception:', err);
        setErrorAuth(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingAuth(false);
      }
    };

    // Test PUBLIC endpoint
    const fetchPublicData = async () => {
      try {
        console.log('🔍 Fetching /api/admin/debug-public-sub-admins (NO auth)');
        const response = await fetch('/api/admin/debug-public-sub-admins', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const json = await response.json();
          console.log('✅ Success! Data:', json);
          setDataPublic(json);
        } else {
          const json = await response.json().catch(() => ({}));
          console.log('❌ Error response:', json);
          setErrorPublic(`${response.status}: ${json.error || response.statusText}`);
        }
      } catch (err) {
        console.error('🔥 Exception:', err);
        setErrorPublic(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingPublic(false);
      }
    };

    fetchAuthData();
    fetchPublicData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h1>Debug: Sub-Admins API</h1>
      <hr />
      
      <h2>1️⃣ AUTHENTICATED Endpoint (/api/admin/users?subAdminsOnly=true)</h2>
      {loadingAuth && <p>Loading...</p>}
      {errorAuth && (
        <div style={{ color: 'red', backgroundColor: '#ffe0e0', padding: '10px', marginBottom: '20px' }}>
          ❌ Error: {errorAuth}
        </div>
      )}
      {dataAuth && (
        <div style={{ color: 'green', backgroundColor: '#e0ffe0', padding: '10px' }}>
          ✅ Success! Found {dataAuth.length || 0} sub-admins:
          <pre>{JSON.stringify(dataAuth, null, 2)}</pre>
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />

      <h2>2️⃣ PUBLIC Endpoint (/api/admin/debug-public-sub-admins)</h2>
      {loadingPublic && <p>Loading...</p>}
      {errorPublic && (
        <div style={{ color: 'red', backgroundColor: '#ffe0e0', padding: '10px', marginBottom: '20px' }}>
          ❌ Error: {errorPublic}
        </div>
      )}
      {dataPublic && (
        <div style={{ color: 'green', backgroundColor: '#e0ffe0', padding: '10px' }}>
          ✅ Success! Found {dataPublic.count || 0} sub-admins:
          <pre>{JSON.stringify(dataPublic, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
