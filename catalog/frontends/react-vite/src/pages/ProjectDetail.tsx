import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProject, fetchTasks, createTask } from '../api';
// import { datadogRum } from '@datadog/browser-rum';

interface Project {
  id: string;
  title: string;
  description: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  useEffect(() => {
    if (!id) return;

    fetchProject(id)
      .then(setProject)
      .catch((err) => {
        setError('Failed to load project');
        // Manual error tracking for RUM
        // datadogRum.addError(err, { source: 'custom' });
        console.error(err);
      });

    fetchTasks(id)
      .then(setTasks)
      .catch((err) => {
        console.error('Failed to load tasks', err);
      });
  }, [id]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !taskTitle.trim()) return;

    try {
      const result = await createTask({
        title: taskTitle,
        projectId: id,
        assigneeId: assigneeId || 'unassigned',
      });

      // Custom RUM action tracking
      // datadogRum.addAction('task_created', { taskId: result.id, projectId: id });

      setTasks((prev) => [...prev, result]);
      setTaskTitle('');
      setAssigneeId('');
    } catch (err) {
      setError('Failed to create task');
      // Manual error tracking for RUM
      // datadogRum.addError(err, { source: 'custom' });
      console.error(err);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>

      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t.id}>
              {t.title} <em>({t.status})</em>
            </li>
          ))}
        </ul>
      )}

      <h2>Add Task</h2>
      <form onSubmit={handleAddTask}>
        <label>
          Title
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Assignee ID
          <input
            type="text"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            placeholder="optional"
          />
        </label>
        <button type="submit">Add Task</button>
      </form>
    </div>
  );
}

export default ProjectDetail;
