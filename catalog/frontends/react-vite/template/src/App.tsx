import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HealthCheck from './components/HealthCheck';
import './App.css';

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
    </BrowserRouter>
  );
}

export default App;
