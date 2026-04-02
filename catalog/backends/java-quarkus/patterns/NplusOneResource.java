package com.example.service;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

// Pattern: DBM N+1 — one query per parent row
// Adapt: replace table/column names with domain entities
@Path("/api/items-with-details")
@Produces(MediaType.APPLICATION_JSON)
public class NplusOneResource {
    @Inject DataSource ds;
    @GET
    public List<Map<String, Object>> itemsWithDetails() throws SQLException {
        try (Connection c = ds.getConnection()) {
            List<Map<String, Object>> parents = new ArrayList<>();
            try (ResultSet rs = c.createStatement().executeQuery("SELECT * FROM parents")) {
                while (rs.next()) parents.add(Map.of("id", rs.getObject("id")));
            }
            for (Map<String, Object> p : parents) {
                try (PreparedStatement ps = c.prepareStatement("SELECT * FROM children WHERE parent_id = ?")) {
                    ps.setObject(1, p.get("id"));
                    List<Map<String, Object>> children = new ArrayList<>();
                    try (ResultSet rs = ps.executeQuery()) { while (rs.next()) children.add(Map.of("id", rs.getObject("id"))); }
                    p = new HashMap<>(p); p.put("children", children);
                }
            }
            return parents;
        }
    }
}
