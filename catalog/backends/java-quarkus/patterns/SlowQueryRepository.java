package com.example.service;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

// Pattern: DBM slow query — artificial delay via pg_sleep
// Adapt: replace 'your_table' with a domain entity table
@ApplicationScoped
public class SlowQueryRepository {
    @Inject DataSource ds;
    public List<Map<String, Object>> findAllSlow() throws SQLException {
        try (Connection c = ds.getConnection();
             ResultSet rs = c.createStatement().executeQuery(
                 "SELECT *, pg_sleep(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50")) {
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
