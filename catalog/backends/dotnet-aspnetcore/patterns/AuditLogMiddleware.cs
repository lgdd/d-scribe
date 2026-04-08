using Serilog;

// Pattern: SIEM audit log — structured log for auth events
// Adapt: add domain-specific fields (userId, resource, action)
public class AuditLogMiddleware
{
    private readonly RequestDelegate _next;
    public AuditLogMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        await _next(ctx);
        Log.Information("audit.request {Method} {Path} {StatusCode} {User}",
            ctx.Request.Method,
            ctx.Request.Path,
            ctx.Response.StatusCode,
            ctx.User.Identity?.Name ?? "anonymous");
    }
}
