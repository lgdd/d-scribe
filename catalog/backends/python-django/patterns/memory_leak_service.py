from django.http import JsonResponse

# Pattern: Profiling — gradual memory allocation in a cache
# Adapt: use a domain-relevant cache concept
_cache = {}


def add_to_cache(request):
    key = request.GET.get("key", "default")
    _cache[key] = bytearray(1024 * 100)  # 100KB per entry
    return JsonResponse({"cached": len(_cache), "key": key})
