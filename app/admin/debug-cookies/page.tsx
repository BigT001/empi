'use client';

import { useEffect, useState } from 'react';

export default function DebugCookies() {
  const [cookies, setCookies] = useState<{ name: string; value: string }[]>([]);

  useEffect(() => {
    // Get all cookies from the document
    const cookiePairs = document.cookie.split('; ').map(pair => {
      const [name, value] = pair.split('=');
      return { name, value: decodeURIComponent(value || '') };
    });
    setCookies(cookiePairs);
    console.log('🍪 Cookies:', cookiePairs);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Cookies Debug</h1>
      <p>Total cookies: {cookies.length}</p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Value (truncated)</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}><strong>{cookie.name}</strong></td>
              <td style={{ padding: '8px' }}>
                {cookie.value.length > 50 
                  ? cookie.value.substring(0, 50) + '...' 
                  : cookie.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
