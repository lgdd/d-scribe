package com.example.service;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.net.URI;
import java.net.http.*;

// Pattern: Code Security — SSRF via unvalidated URL parameter
// WARNING: intentionally vulnerable for IAST demo
@Path("/api/fetch-url")
@Produces(MediaType.APPLICATION_JSON)
public class SsrfExampleResource {
    private final HttpClient client = HttpClient.newHttpClient();
    @GET
    public String fetchUrl(@QueryParam("url") String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url)).build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }
}
