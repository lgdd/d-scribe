import requests as http_client
from django.http import JsonResponse

# Pattern: Code Security — SSRF via unvalidated URL parameter
# WARNING: intentionally vulnerable for IAST demo
# Adapt: use a domain-appropriate endpoint name


def fetch_url(request):
    url = request.GET.get("url", "")
    try:
        resp = http_client.get(url, timeout=5)
        return JsonResponse({"body": resp.text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
