import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HealthCheck from './components/HealthCheck';
import ChatWidget from './components/ChatWidget';
import './App.css';

const FEATURE_CHAT = import.meta.env.VITE_FEATURE_CHAT === 'true';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HealthCheck />} />
        </Routes>
      </main>
      {FEATURE_CHAT && <ChatWidget />}
    </BrowserRouter>
  );
}

export default App;
