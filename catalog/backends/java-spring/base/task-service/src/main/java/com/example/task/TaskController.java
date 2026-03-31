package com.example.task;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final Map<String, Task> tasks = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    private final RestTemplate rest = new RestTemplate();

    @Value("${SERVICE_USER_URL:http://user-service:8081}")
    private String userServiceUrl;

    @Value("${SERVICE_PROJECT_URL:http://project-service:8082}")
    private String projectServiceUrl;

    @GetMapping
    public Collection<Task> list() {
        return tasks.values();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> get(@PathVariable String id) {
        Task task = tasks.get(id);
        if (task == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Task task) {
        // Magic value failure handling
        if (task.getTitle() != null && task.getTitle().contains("-fail-500")) {
            throw new RuntimeException("Simulated 500 error for demo");
        }
        if (task.getTitle() != null && task.getTitle().contains("-fail-timeout")) {
            try { Thread.sleep(30000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }

        // Validate projectId by calling project-service
        if (task.getProjectId() != null) {
            try {
                rest.getForEntity(projectServiceUrl + "/api/projects/" + task.getProjectId(), String.class);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid projectId: " + task.getProjectId()));
            }
        }

        // Validate assigneeId by calling user-service
        if (task.getAssigneeId() != null) {
            try {
                rest.getForEntity(userServiceUrl + "/api/users/" + task.getAssigneeId(), String.class);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid assigneeId: " + task.getAssigneeId()));
            }
        }

        // Default status and priority
        if (task.getStatus() == null) task.setStatus("TODO");
        if (task.getPriority() == null) task.setPriority("MEDIUM");

        String id = String.valueOf(idCounter.getAndIncrement());
        task.setId(id);
        tasks.put(id, task);
        return ResponseEntity.status(201).body(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable String id, @RequestBody Task task) {
        if (!tasks.containsKey(id)) return ResponseEntity.notFound().build();
        task.setId(id);
        tasks.put(id, task);
        return ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (tasks.remove(id) == null) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    // SSRF vulnerability for Code Security demo
    // WARNING: intentionally vulnerable — demonstrates IAST detection
    @GetMapping("/fetch-url")
    public String fetchUrl(@RequestParam String url) {
        // Arbitrary URL fetch — SSRF vector
        try {
            return new RestTemplate().getForObject(url, String.class);
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    // CPU-intensive aggregation for Profiling demo
    @GetMapping("/aggregate")
    public Map<String, Object> aggregate() {
        // Deliberately inefficient: recompute from scratch each time
        Map<String, Long> byStatus = new HashMap<>();
        for (int i = 0; i < 100; i++) { // Repeat to burn CPU
            byStatus.clear();
            tasks.values().forEach(t -> byStatus.merge(t.getStatus(), 1L, Long::sum));
        }
        return Map.of("byStatus", byStatus, "total", tasks.size());
    }
}
