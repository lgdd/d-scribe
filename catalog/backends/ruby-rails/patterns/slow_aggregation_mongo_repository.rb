require 'mongo'

# Pattern: DBM slow aggregation — expensive pipeline on large collection
# Adapt: replace collection and field names with domain entities
MONGO_URL = ENV.fetch("MONGODB_URL", "mongodb://demo:demo@mongodb:27017/demo")

def self.aggregate_events
  client = Mongo::Client.new(MONGO_URL)
  client[:events].aggregate([
    { '$group' => { '_id' => '$category', 'total' => { '$sum' => '$amount' }, 'count' => { '$sum' => 1 } } },
    { '$sort' => { 'total' => -1 } },
    { '$limit' => 10 }
  ]).to_a
end
