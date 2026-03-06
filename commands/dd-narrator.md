# Generate demo runbook

Analyze the demo project and generate a presentation-ready `DEMO-RUNBOOK.md` with talking points, Datadog UI navigation, and failure playbooks.

Delegate to the `dd-demo-narrator` subagent, which will:

1. Read project README, deployment config, and `.env.example` to discover architecture and enabled products
2. Scan service source code to catalog endpoints and failure-path triggers
3. Identify applicable demo segments (core + product-specific)
4. Query Datadog via MCP tools for direct links to relevant views
5. Generate `DEMO-RUNBOOK.md` at the project root
