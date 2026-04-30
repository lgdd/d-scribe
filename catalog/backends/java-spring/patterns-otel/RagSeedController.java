package com.example.service;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;

// Pattern: seed documents into pgvector with OTel spans
// Adapt: replace seed corpus with domain content
@RestController
public class RagSeedController {

    private final Tracer tracer = GlobalOpenTelemetry.getTracer("rag-seed", "1.0.0");
    private final JdbcTemplate jdbc;
    private final HttpClient http = HttpClient.newHttpClient();
    private final String apiKey = System.getenv("OPENAI_API_KEY");

    public RagSeedController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final List<Map<String, String>> DOCS = List.of(
        Map.of("title", "Sample A", "content", "Replace this with real domain content."),
        Map.of("title", "Sample B", "content", "Replace this with real domain content.")
    );

    @PostMapping("/api/seed")
    public Map<String, Object> seed() throws Exception {
        var root = tracer.spanBuilder("rag.seed").setSpanKind(SpanKind.INTERNAL).startSpan();
        try (var scope = root.makeCurrent()) {
            for (var doc : DOCS) {
                String vec = embed(doc.get("content"));
                jdbc.update("INSERT INTO documents (title, content, embedding) VALUES (?, ?, ?::vector)",
                    doc.get("title"), doc.get("content"), vec);
            }
            return Map.of("seeded", DOCS.size());
        } finally { root.end(); }
    }

    private String embed(String text) throws Exception {
        var span = tracer.spanBuilder("embeddings.openai").setSpanKind(SpanKind.CLIENT)
            .setAttribute("gen_ai.system", "openai")
            .setAttribute("gen_ai.request.model", "text-embedding-3-small").startSpan();
        try (var scope = span.makeCurrent()) {
            String json = "{\"model\":\"text-embedding-3-small\",\"input\":[\"" + text.replace("\"", "\\\"") + "\"]}";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/embeddings"))
                .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            String resp = http.send(req, HttpResponse.BodyHandlers.ofString()).body();
            int start = resp.indexOf("[", resp.indexOf("\"embedding\""));
            return resp.substring(start, resp.indexOf("]", start) + 1);
        } finally { span.end(); }
    }
}
