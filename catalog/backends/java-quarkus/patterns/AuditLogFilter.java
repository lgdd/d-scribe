package com.example.service;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;
import java.io.IOException;

// Pattern: SIEM — structured audit log for auth-relevant events
@Provider
public class AuditLogFilter implements ContainerRequestFilter, ContainerResponseFilter {
    private static final Logger audit = Logger.getLogger("audit");
    @Override
    public void filter(ContainerRequestContext req) throws IOException {}
    @Override
    public void filter(ContainerRequestContext req, ContainerResponseContext res) throws IOException {
        audit.infof("request method=%s path=%s status=%d remote=%s",
            req.getMethod(), req.getUriInfo().getPath(), res.getStatus(),
            req.getHeaderString("X-Forwarded-For"));
    }
}
