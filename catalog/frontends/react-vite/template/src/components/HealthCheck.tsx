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

  const badgeClass =
    status === 'ok' ? 'badge-success' :
    status === 'checking...' ? 'badge-ghost' :
    'badge-error';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
      <div className="stat bg-base-100 rounded-box border border-base-300 shadow-sm">
        <div className="stat-title">API Status</div>
        <div className="stat-value text-base mt-1">
          <span className={`badge ${badgeClass}`}>{status}</span>
        </div>
        <div className="stat-desc">Endpoint: {API_URL}/health</div>
      </div>
    </div>
  );
}
