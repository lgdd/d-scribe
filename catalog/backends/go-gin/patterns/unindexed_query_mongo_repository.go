package patterns

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Pattern: DBM unindexed query — collection scan (COLLSCAN).
func FindByCategory(coll *mongo.Collection, category string) ([]bson.M, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(50)
	cursor, err := coll.Find(context.Background(), bson.D{{Key: "category", Value: category}}, opts)
	if err != nil {
		return nil, err
	}
	var results []bson.M
	cursor.All(context.Background(), &results)
	return results, nil
}
