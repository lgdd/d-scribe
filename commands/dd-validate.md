# Validate Datadog telemetry

Readonly, non-destructive check that all demo project services are correctly sending telemetry to Datadog. Use this when the stack is **already running** and you want to verify telemetry without rebuilding or restarting anything. For a full build/deploy/test cycle, use `/dd-preflight` instead.

Delegate to the `dd-validate-telemetry` subagent, which will:

1. Read `.env` to identify expected services, env, and version
2. Query Datadog via MCP tools to verify:
   - Services registered in the service catalog
   - Logs flowing per service
   - Traces flowing with multi-service propagation
   - Infrastructure metrics reporting
3. Report a pass/fail checklist with suggested fixes for any failures
