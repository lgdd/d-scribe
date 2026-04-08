# Pattern: Profiling — gradual memory allocation in a cache
# Adapt: use a domain-relevant cache concept
CACHE = {}

def self.add_to_cache(key)
  CACHE[key] = "\0" * (1024 * 100) # 100KB per entry
  { cached: CACHE.size, key: key }
end
