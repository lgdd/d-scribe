import logging

# Pattern: SIEM — structured audit log for auth-relevant events
# Adapt: log fields relevant to your domain's security events
audit = logging.getLogger("audit")


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        audit.info(
            "request",
            extra={
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "remote": request.META.get("REMOTE_ADDR", ""),
            },
        )
        return response
