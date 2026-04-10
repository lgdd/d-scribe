package com.example.service;

import datadog.trace.api.llmobs.LLMObs;
import datadog.trace.api.llmobs.LLMObsSpan;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import javax.sql.DataSource;
import java.net.URI;
import java.net.http.*;
import java.sql.*;
import java.util.*;

// Pattern: LLM Obs — RAG chat: embed query, search pgvector, generate response
// Adapt: replace system prompt and retrieval logic with domain context
@Path("/api/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RagChatResource {

    @Inject DataSource ds;
    private final HttpClient http = HttpClient.newHttpClient();
    private final String apiKey = System.getenv("OPENAI_API_KEY");

    @POST
    public Map<String, Object> chat(Map<String, Object> body) throws Exception {
        String userMsg = (String) body.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) body.getOrDefault("history", List.of());
        LLMObsSpan wf = LLMObs.startWorkflowSpan("rag-chat");
        try {
            String queryVec = embedQuery(userMsg);
            List<Map<String, Object>> sources = searchDocs(queryVec);
            String context = sources.stream()
                .map(s -> "[" + s.get("title") + "]: " + s.get("content"))
                .reduce("", (a, b) -> a + "\n\n" + b).trim();
            String answer = generate(context, history, userMsg);
            return Map.of("response", answer, "sources",
                sources.stream().map(s -> Map.of("title", s.get("title"), "score", s.get("score"))).toList());
        } finally { wf.finish(); }
    }

    private String embedQuery(String text) throws Exception {
        LLMObsSpan span = LLMObs.startTaskSpan("embed-query");
        try {
            String json = "{\"model\":\"text-embedding-3-small\",\"input\":[\"" + text.replace("\"", "\\\"") + "\"]}";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/embeddings"))
                .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            String resp = http.send(req, HttpResponse.BodyHandlers.ofString()).body();
            int start = resp.indexOf("[", resp.indexOf("\"embedding\""));
            return resp.substring(start, resp.indexOf("]", start) + 1);
        } finally { span.finish(); }
    }

    private List<Map<String, Object>> searchDocs(String queryVec) throws Exception {
        LLMObsSpan span = LLMObs.startTaskSpan("search-docs");
        try (Connection c = ds.getConnection()) {
            PreparedStatement ps = c.prepareStatement(
                "SELECT title, content, 1 - (embedding <=> ?::vector) AS score " +
                "FROM documents ORDER BY embedding <=> ?::vector LIMIT 3");
            ps.setString(1, queryVec);
            ps.setString(2, queryVec);
            ResultSet rs = ps.executeQuery();
            List<Map<String, Object>> rows = new ArrayList<>();
            while (rs.next()) {
                rows.add(Map.of("title", rs.getString("title"), "content", rs.getString("content"),
                    "score", rs.getDouble("score")));
            }
            return rows;
        } finally { span.finish(); }
    }

    private String generate(String context, List<Map<String, String>> history, String userMsg) throws Exception {
        LLMObsSpan span = LLMObs.startLLMSpan("generate-response", "gpt-4o-mini", "openai", null, null);
        try {
            StringBuilder msgs = new StringBuilder("[");
            msgs.append("{\"role\":\"system\",\"content\":\"Answer using this context:\\n").append(context.replace("\"", "\\\"")).append("\"},");
            for (var h : history) msgs.append("{\"role\":\"").append(h.get("role")).append("\",\"content\":\"").append(h.get("content").replace("\"", "\\\"")).append("\"},");
            msgs.append("{\"role\":\"user\",\"content\":\"").append(userMsg.replace("\"", "\\\"")).append("\"}]");
            String json = "{\"model\":\"gpt-4o-mini\",\"messages\":" + msgs + "}";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            String resp = http.send(req, HttpResponse.BodyHandlers.ofString()).body();
            int start = resp.indexOf("\"content\":\"") + 11;
            return resp.substring(start, resp.indexOf("\"", start));
        } finally { span.finish(); }
    }
}
