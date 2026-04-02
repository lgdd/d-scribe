package com.example.service;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

// Pattern: Code Security — SQL injection via string concatenation
// WARNING: intentionally vulnerable for IAST demo
// Adapt: replace table/column with domain entity
@Path("/api/search")
@Produces(MediaType.APPLICATION_JSON)
public class UnsafeSearchResource {
    @Inject DataSource ds;
    @GET
    public List<Map<String, Object>> search(@QueryParam("q") String q) throws SQLException {
        String sql = "SELECT * FROM items WHERE name LIKE '%" + q + "%'";
        try (Connection c = ds.getConnection();
             ResultSet rs = c.createStatement().executeQuery(sql)) {
            List<Map<String, Object>> rows = new ArrayList<>();
            ResultSetMetaData md = rs.getMetaData();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= md.getColumnCount(); i++) row.put(md.getColumnName(i), rs.getObject(i));
                rows.add(row);
            }
            return rows;
        }
    }
}
