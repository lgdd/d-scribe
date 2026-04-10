using MySqlConnector;

// Pattern: DBM N+1 — loop queries children per parent row (MySQL)
// Adapt: replace parent/child tables with domain entities
public static class NplusOneMysqlEndpoint
{
    public static void Map(WebApplication app, string connectionString)
    {
        app.MapGet("/mysql/parents-with-children", async () =>
        {
            await using var conn = new MySqlConnection(connectionString);
            await conn.OpenAsync();
            var parents = new List<Dictionary<string, object>>();
            await using (var cmd = new MySqlCommand("SELECT id, name FROM parents", conn))
            await using (var reader = await cmd.ExecuteReaderAsync())
                while (await reader.ReadAsync())
                    parents.Add(new Dictionary<string, object>
                        { ["id"] = reader.GetInt32(0), ["name"] = reader.GetString(1) });

            foreach (var p in parents)
            {
                await using var childCmd = new MySqlCommand(
                    $"SELECT id, name FROM children WHERE parent_id = {p["id"]}", conn);
                await using var cr = await childCmd.ExecuteReaderAsync();
                var kids = new List<string>();
                while (await cr.ReadAsync()) kids.Add(cr.GetString(1));
                p["children"] = kids;
            }
            return Results.Json(parents);
        });
    }
}
