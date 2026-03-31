import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../api';

interface Project {
  id: string;
  title: string;
  description: string;
}

function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => {
        setError('Failed to load projects');
        // Manual error tracking for RUM (feature: rum:error-tracking)
        // datadogRum.addError(err, { source: 'custom' });
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h1>Projects</h1>
      {error && <p className="error">{error}</p>}
      {projects.length === 0 && !error && <p>No projects yet.</p>}
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}`}>{p.title}</Link>
            {p.description && <span> — {p.description}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectList;
