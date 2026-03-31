import os
from locust import HttpUser, task, between

class DemoUser(HttpUser):
    wait_time = between(1, 3)

    # Track created entity IDs for use in subsequent requests
    user_id = None
    project_id = None
    task_id = None

    @task(70)
    def golden_path(self):
        """Full CRUD cycle — creates, reads, and exercises the distributed traces"""
        # Create user
        resp = self.client.post("/api/users", json={"name": "demo-user", "email": "demo@test.com"})
        if resp.status_code == 200 or resp.status_code == 201:
            data = resp.json()
            user_id = data.get("id")
        else:
            return

        # Create project
        resp = self.client.post("/api/projects", json={"title": "Demo Project", "description": "Load test project", "userId": user_id})
        if resp.status_code == 200 or resp.status_code == 201:
            data = resp.json()
            project_id = data.get("id")
        else:
            return

        # Create task
        self.client.post("/api/tasks", json={"title": "Demo Task", "projectId": project_id, "assigneeId": user_id})

        # Read operations
        self.client.get("/api/users")
        self.client.get("/api/projects")
        self.client.get("/api/tasks")
        if project_id:
            self.client.get(f"/api/projects/{project_id}")

    @task(5)
    def error_500(self):
        """Trigger 500 error via magic value"""
        self.client.post("/api/users", json={"name": "test-fail-500", "email": "error@demo.test"})

    @task(5)
    def slow_request(self):
        """Trigger timeout via magic value"""
        with self.client.post("/api/users", json={"name": "test-fail-timeout", "email": "timeout@demo.test"}, timeout=3, catch_response=True) as resp:
            if resp.elapsed.total_seconds() > 2:
                resp.failure("Request too slow")

    @task(10)
    def not_found(self):
        """Hit nonexistent resource"""
        self.client.get("/api/users/nonexistent-id-12345")

    @task(5)
    def search_injection(self):
        """SQL injection attempt via search (feature: security:code)"""
        self.client.get("/api/users/search", params={"q": "' OR 1=1 --"})

    @task(5)
    def ssrf_attempt(self):
        """SSRF attempt via fetch-url (feature: security:code)"""
        self.client.get("/api/tasks/fetch-url", params={"url": "http://169.254.169.254/latest/meta-data/"})
