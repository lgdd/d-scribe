const API_BASE = '/api';

export async function fetchProjects() {
  return fetch(`${API_BASE}/projects`).then((r) => r.json());
}

export async function fetchProject(id: string) {
  return fetch(`${API_BASE}/projects/${id}`).then((r) => r.json());
}

export async function createProject(data: {
  title: string;
  description: string;
  userId: string;
}) {
  return fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

export async function fetchTasks(projectId?: string) {
  const url = projectId
    ? `${API_BASE}/tasks?projectId=${projectId}`
    : `${API_BASE}/tasks`;
  return fetch(url).then((r) => r.json());
}

export async function createTask(data: {
  title: string;
  projectId: string;
  assigneeId: string;
}) {
  return fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}
