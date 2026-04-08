# Pattern: Cross-service HTTP call — tracing headers propagated
# automatically by dd-trace-rb. Adapt: inject the target service
# URL via environment variable.
require "net/http"
require "json"

TARGET_URL = ENV.fetch("TARGET_SERVICE_URL", "http://localhost:8080")

def self.call(path)
  uri = URI("#{TARGET_URL}#{path}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
end
