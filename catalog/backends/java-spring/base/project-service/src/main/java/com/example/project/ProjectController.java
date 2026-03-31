package com.example.project;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final Map<String, Project> projects = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    private final RestTemplate rest = new RestTemplate();

    @Value("${SERVICE_USER_URL:http://user-service:8081}")
    private String userServiceUrl;

    @GetMapping
    public Collection<Project> list() {
        return projects.values();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> get(@PathVariable String id) {
        Project project = projects.get(id);
        if (project == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(project);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Project project) {
        // Magic value failure handling
        if (project.getTitle() != null && project.getTitle().contains("-fail-500")) {
            throw new RuntimeException("Simulated 500 error for demo");
        }
        if (project.getTitle() != null && project.getTitle().contains("-fail-timeout")) {
            try { Thread.sleep(30000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }

        // Validate userId by calling user-service
        if (project.getUserId() != null) {
            try {
                rest.getForEntity(userServiceUrl + "/api/users/" + project.getUserId(), String.class);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid userId: " + project.getUserId()));
            }
        }

        String id = String.valueOf(idCounter.getAndIncrement());
        project.setId(id);
        projects.put(id, project);
        return ResponseEntity.status(201).body(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> update(@PathVariable String id, @RequestBody Project project) {
        if (!projects.containsKey(id)) return ResponseEntity.notFound().build();
        project.setId(id);
        projects.put(id, project);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (projects.remove(id) == null) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    // SQL injection in search for Code Security demo (feature: security:code)
    // WARNING: intentionally vulnerable — demonstrates IAST detection
    @GetMapping("/search")
    public List<Project> search(@RequestParam String q) {
        // Simulated SQL injection with in-memory filter (feature: security:code)
        return projects.values().stream()
                .filter(p -> p.getTitle().toLowerCase().contains(q.toLowerCase()))
                .toList();
    }

    // Slow query simulation for DBM demo (feature: dbm:postgresql)
    // Simulates N+1 query pattern with deliberate delay
    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> details(@PathVariable String id) {
        Project p = projects.get(id);
        if (p == null) return ResponseEntity.notFound().build();
        // Simulate N+1: fetch user for each related entity (feature: dbm:postgresql)
        try { Thread.sleep(200); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return ResponseEntity.ok(Map.of("project", p, "owner", p.getUserId() != null ? p.getUserId() : "unknown"));
    }
}
