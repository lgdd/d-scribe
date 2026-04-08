package com.example.service;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.net.URI;
import java.net.http.*;

// Pattern: Cross-service HTTP call — tracing headers propagated automatically by dd-java-agent.
@ApplicationScoped
public class InterServiceClient {
    private final HttpClient client = HttpClient.newHttpClient();
    @ConfigProperty(name = "TARGET_SERVICE_URL", defaultValue = "http://localhost:8080")
    String targetUrl;
    public String call(String path) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(targetUrl + path)).build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }
}
