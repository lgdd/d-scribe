require 'mongo'

# Pattern: DBM unindexed query — collection scan (COLLSCAN)
# Adapt: replace collection and field names with domain entities
MONGO_URL = ENV.fetch("MONGODB_URL", "mongodb://demo:demo@mongodb:27017/demo")

def self.find_by_category(category)
  client = Mongo::Client.new(MONGO_URL)
  client[:events].find(category: category).sort(created_at: -1).limit(50).to_a
end
