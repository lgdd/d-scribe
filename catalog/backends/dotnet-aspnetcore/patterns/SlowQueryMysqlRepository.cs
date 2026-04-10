using MySqlConnector;

// Pattern: DBM slow query — artificial delay via MySQL SLEEP
// Adapt: replace 'your_table' with a domain entity table
public class SlowQueryMysqlRepository
{
    private readonly string _connStr;
    public SlowQueryMysqlRepository(string connectionString) => _connStr = connectionString;

    public async Task<List<Dictionary<string, object>>> FindAllSlowAsync()
    {
        await using var conn = new MySqlConnection(_connStr);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(
            "SELECT *, SLEEP(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var rows = new List<Dictionary<string, object>>();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.GetValue(i);
            rows.Add(row);
        }
        return rows;
    }
}
