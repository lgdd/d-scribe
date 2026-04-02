package com.example.service;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Pattern: Profiling — gradual memory allocation in a cache
@Path("/api/cache")
@Produces(MediaType.APPLICATION_JSON)
public class MemoryLeakResource {
    private final Map<String, byte[]> cache = new ConcurrentHashMap<>();
    @POST
    public Map<String, Object> addToCache(@QueryParam("key") String key) {
        cache.put(key, new byte[1024 * 100]);
        return Map.of("cached", cache.size(), "key", key);
    }
}
