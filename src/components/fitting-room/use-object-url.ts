import { useEffect, useState } from 'react';
export function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const value = blob ? URL.createObjectURL(blob) : '';
    // Synchronize the browser-owned URL resource and revoke it on replacement.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(value);
    return () => { if (value) URL.revokeObjectURL(value); };
  }, [blob]);
  return url;
}
