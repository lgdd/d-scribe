package patterns

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Pattern: DBM slow aggregation — expensive pipeline on large collection.
func AggregateEvents(coll *mongo.Collection) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$category"}, {Key: "total", Value: bson.D{{Key: "$sum", Value: "$amount"}}}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "total", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}
	cursor, err := coll.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	var results []bson.M
	cursor.All(context.Background(), &results)
	return results, nil
}
