import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HealthCheck from './components/HealthCheck';
import ChatWidget from './components/ChatWidget';

const FEATURE_CHAT = import.meta.env.VITE_FEATURE_CHAT === 'true';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-200">
        <div className="navbar bg-primary text-primary-content px-4">
          <div className="navbar-start">
            <span className="font-bold tracking-tight">Demo App</span>
          </div>
          <div className="navbar-end">
            <Link to="/" className="btn btn-ghost btn-sm text-primary-content">Home</Link>
          </div>
        </div>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<HealthCheck />} />
          </Routes>
        </main>
      </div>
      {FEATURE_CHAT && <ChatWidget />}
    </BrowserRouter>
  );
}

export default App;
