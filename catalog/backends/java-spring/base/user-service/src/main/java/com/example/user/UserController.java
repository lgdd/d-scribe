package com.example.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    @GetMapping
    public Collection<User> list() {
        return users.values();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable String id) {
        User user = users.get(id);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        // Magic value failure handling
        if (user.getName() != null && user.getName().contains("-fail-500")) {
            throw new RuntimeException("Simulated 500 error for demo");
        }
        if (user.getName() != null && user.getName().contains("-fail-timeout")) {
            try { Thread.sleep(30000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }

        String id = String.valueOf(idCounter.getAndIncrement());
        user.setId(id);
        users.put(id, user);
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable String id, @RequestBody User user) {
        if (!users.containsKey(id)) return ResponseEntity.notFound().build();
        user.setId(id);
        users.put(id, user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (users.remove(id) == null) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    // SQL injection vulnerability for Code Security demo
    // WARNING: intentionally vulnerable — demonstrates IAST detection
    @GetMapping("/search")
    public List<User> search(@RequestParam String q) {
        // Simulated SQL injection with in-memory filter
        return users.values().stream()
                .filter(u -> u.getName().toLowerCase().contains(q.toLowerCase()))
                .toList();
    }

    // CPU-intensive user stats for Profiling demo
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        // Deliberately inefficient nested computation
        long sum = 0;
        for (int i = 0; i < 10000; i++) {
            for (int j = 0; j < 1000; j++) {
                sum += (long) i * j;
            }
        }
        return Map.of("count", users.size(), "checksum", sum);
    }
}
