import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function HealthCheck() {
  const [status, setStatus] = useState<string>('checking...');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setStatus(data.status || 'ok'))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <div>
      <h1>Demo Application</h1>
      <p>API status: <strong>{status}</strong></p>
    </div>
  );
}
