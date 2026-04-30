package com.example.service;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import javax.sql.DataSource;
import java.net.URI;
import java.net.http.*;
import java.sql.*;
import java.util.*;

// Pattern: LLM Obs via OTel GenAI semconv — RAG chat (Quarkus)
// Adapt: replace system prompt and retrieval logic with domain context
@Path("/api/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RagChatResource {

    @Inject DataSource ds;
    private final Tracer tracer = GlobalOpenTelemetry.getTracer("rag-chat", "1.0.0");
    private final HttpClient http = HttpClient.newHttpClient();
    private final String apiKey = System.getenv("OPENAI_API_KEY");

    @POST
    public Map<String, Object> chat(Map<String, Object> body) throws Exception {
        String userMsg = (String) body.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) body.getOrDefault("history", List.of());
        var root = tracer.spanBuilder("rag.chat").setSpanKind(SpanKind.INTERNAL).startSpan();
        try (var scope = root.makeCurrent()) {
            String queryVec = embed(userMsg);
            List<Map<String, Object>> sources = search(queryVec);
            String context = sources.stream().map(s -> "[" + s.get("title") + "]: " + s.get("content")).reduce("", (a, b) -> a + "\n\n" + b).trim();
            String answer = generate(context, history, userMsg);
            return Map.of("response", answer, "sources", sources.stream().map(s -> Map.of("title", s.get("title"), "score", s.get("score"))).toList());
        } finally { root.end(); }
    }

    private String embed(String text) throws Exception {
        var span = tracer.spanBuilder("embeddings.openai").setSpanKind(SpanKind.CLIENT)
            .setAttribute("gen_ai.system", "openai").setAttribute("gen_ai.operation.name", "embeddings")
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

    private List<Map<String, Object>> search(String queryVec) throws Exception {
        var span = tracer.spanBuilder("retrieval.pgvector").setSpanKind(SpanKind.CLIENT).startSpan();
        try (var scope = span.makeCurrent(); Connection c = ds.getConnection()) {
            PreparedStatement ps = c.prepareStatement(
                "SELECT title, content, 1 - (embedding <=> ?::vector) AS score FROM documents ORDER BY embedding <=> ?::vector LIMIT 3");
            ps.setString(1, queryVec);
            ps.setString(2, queryVec);
            ResultSet rs = ps.executeQuery();
            List<Map<String, Object>> rows = new ArrayList<>();
            while (rs.next()) {
                rows.add(Map.of("title", rs.getString("title"), "content", rs.getString("content"), "score", rs.getDouble("score")));
            }
            return rows;
        } finally { span.end(); }
    }

    private String generate(String context, List<Map<String, String>> history, String userMsg) throws Exception {
        var span = tracer.spanBuilder("chat.openai").setSpanKind(SpanKind.CLIENT)
            .setAttribute("gen_ai.system", "openai").setAttribute("gen_ai.operation.name", "chat")
            .setAttribute("gen_ai.request.model", "gpt-4o-mini").startSpan();
        try (var scope = span.makeCurrent()) {
            StringBuilder msgs = new StringBuilder("[{\"role\":\"system\",\"content\":\"Answer using this context:\\n")
                .append(context.replace("\"", "\\\"")).append("\"},");
            for (var h : history) msgs.append("{\"role\":\"").append(h.get("role")).append("\",\"content\":\"").append(h.get("content").replace("\"", "\\\"")).append("\"},");
            msgs.append("{\"role\":\"user\",\"content\":\"").append(userMsg.replace("\"", "\\\"")).append("\"}]");
            String json = "{\"model\":\"gpt-4o-mini\",\"messages\":" + msgs + "}";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            String resp = http.send(req, HttpResponse.BodyHandlers.ofString()).body();
            int s = resp.indexOf("\"content\":\"") + 11;
            return resp.substring(s, resp.indexOf("\"", s));
        } finally { span.end(); }
    }
}
