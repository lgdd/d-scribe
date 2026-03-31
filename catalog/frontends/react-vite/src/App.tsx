import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import CreateForm from './pages/CreateForm';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Projects</Link>
        {' | '}
        <Link to="/create">New Project</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/create" element={<CreateForm />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
