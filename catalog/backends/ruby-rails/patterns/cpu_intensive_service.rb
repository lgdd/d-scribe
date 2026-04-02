# Pattern: Profiling — CPU-intensive nested loop
# Adapt: replace with domain-relevant aggregation logic

def self.aggregate
  counts = {}
  100.times do
    counts.clear
    10_000.times do |j|
      key = "bucket-#{j % 50}"
      counts[key] = (counts[key] || 0) + 1
    end
  end
  { buckets: counts.size, iterations: 100 * 10_000 }
end
