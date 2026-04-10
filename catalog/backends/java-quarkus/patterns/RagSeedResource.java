package com.example.service;

import datadog.trace.api.llmobs.LLMObs;
import datadog.trace.api.llmobs.LLMObsSpan;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import javax.sql.DataSource;
import java.net.URI;
import java.net.http.*;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.*;

// Pattern: LLM Obs — Embed and store documents in pgvector for RAG
// Adapt: replace document schema with domain-specific fields
@Path("/api/rag/seed")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RagSeedResource {

    @Inject DataSource ds;
    private final HttpClient http = HttpClient.newHttpClient();
    private final String apiKey = System.getenv("OPENAI_API_KEY");

    @POST
    public Map<String, Object> seed(Map<String, Object> body) throws Exception {
        List<Map<String, String>> docs = (List<Map<String, String>>) body.get("documents");
        List<String> texts = docs.stream().map(d -> d.get("content")).toList();
        LLMObsSpan span = LLMObs.startTaskSpan("embed-documents");
        try {
            String json = "{\"model\":\"text-embedding-3-small\",\"input\":" + toJsonArray(texts) + "}";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/embeddings"))
                .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            String resp = http.send(req, HttpResponse.BodyHandlers.ofString()).body();
            List<String> vectors = parseEmbeddings(resp);
            try (Connection c = ds.getConnection()) {
                PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO documents (title, content, embedding) VALUES (?, ?, ?::vector)");
                for (int i = 0; i < docs.size(); i++) {
                    ps.setString(1, docs.get(i).get("title"));
                    ps.setString(2, docs.get(i).get("content"));
                    ps.setString(3, vectors.get(i));
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        } finally { span.finish(); }
        return Map.of("stored", docs.size());
    }

    private String toJsonArray(List<String> items) {
        return "[" + String.join(",", items.stream().map(s -> "\"" + s.replace("\"", "\\\"") + "\"").toList()) + "]";
    }

    private List<String> parseEmbeddings(String json) {
        List<String> result = new ArrayList<>();
        int idx = 0;
        while ((idx = json.indexOf("\"embedding\":", idx)) != -1) {
            int start = json.indexOf("[", idx);
            int end = json.indexOf("]", start) + 1;
            result.add(json.substring(start, end));
            idx = end;
        }
        return result;
    }
}
