# Instrumentation patterns — .NET ASP.NET Core (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|

No OTel-specific patterns are defined for this backend. Auto-instrumentation via `AddAspNetCoreInstrumentation()` captures all HTTP traces automatically. Use `System.Diagnostics.ActivitySource` for custom spans in business logic patterns.
