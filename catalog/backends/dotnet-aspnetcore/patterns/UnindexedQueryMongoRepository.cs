using MongoDB.Bson;
using MongoDB.Driver;

// Pattern: DBM unindexed query — collection scan (COLLSCAN)
// Adapt: replace collection and field names with domain entities
public class UnindexedQueryMongoRepository
{
    private readonly IMongoCollection<BsonDocument> _events;

    public UnindexedQueryMongoRepository(IMongoClient client)
    {
        _events = client.GetDatabase("demo").GetCollection<BsonDocument>("events");
    }

    public async Task<List<BsonDocument>> FindByCategoryAsync(string category)
    {
        var filter = Builders<BsonDocument>.Filter.Eq("category", category);
        var sort = Builders<BsonDocument>.Sort.Descending("created_at");
        return await _events.Find(filter).Sort(sort).Limit(50).ToListAsync();
    }
}
