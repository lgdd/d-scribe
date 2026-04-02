package com.example.service;

import com.timgroup.statsd.NonBlockingStatsDClient;
import com.timgroup.statsd.StatsDClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// Pattern: DogStatsD — custom gauge and counter
// Adapt: metric names should reflect domain (e.g., orders.pending)
@RestController
public class CustomMetricsService {

    private final StatsDClient statsd = new NonBlockingStatsDClient(
        "", "datadog-agent", 8125
    );

    @PostMapping("/api/metrics/record")
    public Map<String, String> record(@RequestParam String name, @RequestParam double value) {
        statsd.gauge(name, value);
        statsd.incrementCounter(name + ".calls");
        return Map.of("status", "recorded", "metric", name);
    }
}
