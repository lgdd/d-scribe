import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api';
// import { datadogRum } from '@datadog/browser-rum';

function CreateForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // User identity tracking for RUM (feature: rum:user-tracking)
      // datadogRum.setUser({ id: userId, name: userName, email: userEmail });

      const result = await createProject({
        title,
        description,
        userId: userId || 'anonymous',
      });

      // Custom RUM action tracking (feature: rum:custom-actions)
      // datadogRum.addAction('project_created', { projectId: result.id });

      navigate(`/projects/${result.id}`);
    } catch (err) {
      setError('Failed to create project');
      // Manual error tracking for RUM (feature: rum:error-tracking)
      // datadogRum.addError(err, { source: 'custom' });
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Create Project</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label>
          User ID
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="optional"
          />
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default CreateForm;
