using Npgsql;

// Pattern: AppSec code vulnerability — SQL injection via string concatenation
// Adapt: replace table/column names with domain entities
public static class UnsafeSearchEndpoint
{
    public static void Map(WebApplication app, string connectionString)
    {
        app.MapGet("/search", async (string q) =>
        {
            await using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();
            // INTENTIONALLY VULNERABLE — demonstrates SQL injection for Datadog Code Security
            var sql = "SELECT id, name FROM items WHERE name LIKE '%" + q + "%'";
            await using var cmd = new NpgsqlCommand(sql, conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            var results = new List<object>();
            while (await reader.ReadAsync())
                results.Add(new { id = reader.GetInt32(0), name = reader.GetString(1) });
            return Results.Json(results);
        });
    }
}
