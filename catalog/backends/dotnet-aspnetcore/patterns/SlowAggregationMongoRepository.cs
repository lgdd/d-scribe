using MongoDB.Bson;
using MongoDB.Driver;

// Pattern: DBM slow aggregation — expensive pipeline on large collection
// Adapt: replace collection and field names with domain entities
public class SlowAggregationMongoRepository
{
    private readonly IMongoCollection<BsonDocument> _events;

    public SlowAggregationMongoRepository(IMongoClient client)
    {
        _events = client.GetDatabase("demo").GetCollection<BsonDocument>("events");
    }

    public async Task<List<BsonDocument>> AggregateEventsAsync()
    {
        var pipeline = new[]
        {
            BsonDocument.Parse("{ $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }"),
            BsonDocument.Parse("{ $sort: { total: -1 } }"),
            BsonDocument.Parse("{ $limit: 10 }"),
        };
        return await _events.Aggregate<BsonDocument>(pipeline).ToListAsync();
    }
}
