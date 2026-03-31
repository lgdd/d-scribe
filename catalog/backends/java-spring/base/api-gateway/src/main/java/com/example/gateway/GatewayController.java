package com.example.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api")
public class GatewayController {

    private final RestTemplate rest = new RestTemplate();

    @Value("${SERVICE_USER_URL:http://user-service:8081}")
    private String userServiceUrl;

    @Value("${SERVICE_PROJECT_URL:http://project-service:8082}")
    private String projectServiceUrl;

    @Value("${SERVICE_TASK_URL:http://task-service:8083}")
    private String taskServiceUrl;

    // --- Users ---

    @GetMapping("/users")
    public ResponseEntity<String> getUsers() {
        return rest.getForEntity(userServiceUrl + "/api/users", String.class);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<String> getUser(@PathVariable String id) {
        return rest.getForEntity(userServiceUrl + "/api/users/" + id, String.class);
    }

    @PostMapping("/users")
    public ResponseEntity<String> createUser(@RequestBody String body) {
        return rest.postForEntity(userServiceUrl + "/api/users", body, String.class);
    }

    @PutMapping("/users/{id}")
    public void updateUser(@PathVariable String id, @RequestBody String body) {
        rest.put(userServiceUrl + "/api/users/" + id, body);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable String id) {
        rest.delete(userServiceUrl + "/api/users/" + id);
    }

    @GetMapping("/users/search")
    public ResponseEntity<String> searchUsers(@RequestParam String q) {
        return rest.getForEntity(userServiceUrl + "/api/users/search?q=" + q, String.class);
    }

    @GetMapping("/users/stats")
    public ResponseEntity<String> userStats() {
        return rest.getForEntity(userServiceUrl + "/api/users/stats", String.class);
    }

    // --- Projects ---

    @GetMapping("/projects")
    public ResponseEntity<String> getProjects() {
        return rest.getForEntity(projectServiceUrl + "/api/projects", String.class);
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<String> getProject(@PathVariable String id) {
        return rest.getForEntity(projectServiceUrl + "/api/projects/" + id, String.class);
    }

    @PostMapping("/projects")
    public ResponseEntity<String> createProject(@RequestBody String body) {
        return rest.postForEntity(projectServiceUrl + "/api/projects", body, String.class);
    }

    @PutMapping("/projects/{id}")
    public void updateProject(@PathVariable String id, @RequestBody String body) {
        rest.put(projectServiceUrl + "/api/projects/" + id, body);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteProject(@PathVariable String id) {
        rest.delete(projectServiceUrl + "/api/projects/" + id);
    }

    @GetMapping("/projects/search")
    public ResponseEntity<String> searchProjects(@RequestParam String q) {
        return rest.getForEntity(projectServiceUrl + "/api/projects/search?q=" + q, String.class);
    }

    @GetMapping("/projects/{id}/details")
    public ResponseEntity<String> projectDetails(@PathVariable String id) {
        return rest.getForEntity(projectServiceUrl + "/api/projects/" + id + "/details", String.class);
    }

    // --- Tasks ---

    @GetMapping("/tasks")
    public ResponseEntity<String> getTasks() {
        return rest.getForEntity(taskServiceUrl + "/api/tasks", String.class);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<String> getTask(@PathVariable String id) {
        return rest.getForEntity(taskServiceUrl + "/api/tasks/" + id, String.class);
    }

    @PostMapping("/tasks")
    public ResponseEntity<String> createTask(@RequestBody String body) {
        return rest.postForEntity(taskServiceUrl + "/api/tasks", body, String.class);
    }

    @PutMapping("/tasks/{id}")
    public void updateTask(@PathVariable String id, @RequestBody String body) {
        rest.put(taskServiceUrl + "/api/tasks/" + id, body);
    }

    @DeleteMapping("/tasks/{id}")
    public void deleteTask(@PathVariable String id) {
        rest.delete(taskServiceUrl + "/api/tasks/" + id);
    }

    @GetMapping("/tasks/fetch-url")
    public ResponseEntity<String> taskFetchUrl(@RequestParam String url) {
        return rest.getForEntity(taskServiceUrl + "/api/tasks/fetch-url?url=" + url, String.class);
    }

    @GetMapping("/tasks/aggregate")
    public ResponseEntity<String> taskAggregate() {
        return rest.getForEntity(taskServiceUrl + "/api/tasks/aggregate", String.class);
    }
}
