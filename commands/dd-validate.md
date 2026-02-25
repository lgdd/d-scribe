# Validate Datadog telemetry

Check that all demo project services are correctly sending telemetry to Datadog.

Delegate to the `dd-validate-telemetry` subagent, which will:

1. Read `.env` to identify expected services, env, and version
2. Query Datadog via MCP tools to verify:
   - Services registered in the service catalog
   - Logs flowing per service
   - Traces flowing with multi-service propagation
   - Infrastructure metrics reporting
3. Report a pass/fail checklist with suggested fixes for any failures
