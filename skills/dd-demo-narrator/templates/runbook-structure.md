# Runbook Structure

Generate `DEMO-RUNBOOK.md` with the following sections. Use the project name from `README.md` as the title.

## Section: Before the Demo

A checklist of everything the SE should verify before starting.

```
## Before the Demo

- [ ] `.env` contains valid `DD_API_KEY` and `DD_SITE`
- [ ] Run `make up` — all services are healthy
- [ ] Run `make traffic` — let it run for 2-3 minutes to populate telemetry
- [ ] Open Datadog in your browser and confirm you are in the correct org
- [ ] Bookmark these views:
  - Service Map: <URL>
  - Traces: <URL>
  - Logs: <URL>
```

Add product-specific items when applicable (e.g., "Open RUM Sessions in a separate tab" if RUM is enabled).

## Section: Demo Flow

Organize the demo into numbered acts. Each act covers one observability concept and takes approximately 5 minutes. Every act must include:

- **Title** with time estimate
- **Concept** — the observability idea being demonstrated (one sentence)
- **Steps** — numbered list where each step has:
  - **Action**: what the SE does (curl command, browser click, or UI navigation)
  - **Show**: what to point out in Datadog (specific view, specific data point)
  - **Say**: a talking-point sentence the SE can use or adapt

Always start with these acts in order:

**Act 1: The Topology** — show the Service Map, point out auto-discovery, explain how traces built the map.

**Act 2: The Golden Path** — trigger the golden path request, show the distributed trace waterfall, show correlated logs.

**Act 3: The Failure** — trigger a failure scenario using its human-friendly action (e.g., "Add product *Phantom Widget* to cart and place the order" rather than a raw curl command). Show how Datadog surfaces the root cause (Error Tracking, trace waterfall, correlated logs with error context). When a frontend exists, prefer triggering failures through the UI so the prospect sees the full end-user-to-backend flow.

Then add one act per conditional segment detected. Use the act guidance from `demo-segments.md`.

## Section: Failure Playbook

For each failure scenario found during project discovery, create a sub-section with:

1. **Scenario name**
2. **Human action** — what the demoer does in the UI or browser (e.g., "Add product *Phantom Widget* (SKU: sku-fail-500) to cart and place the order"). This is the primary trigger instruction
3. **curl equivalent** — the API call that produces the same failure, for SEs who prefer the terminal
4. **Wait** — how long to pause for telemetry to propagate (typically 15-30 seconds)
5. **Datadog views to show** — ordered list of views to navigate to, with what to point out in each
6. **Narrative** — 2-3 sentences explaining the root cause as if speaking to the prospect ("Here you can see that service-b returned a 500, which caused service-a to retry three times. Each retry is visible as a separate span in the trace waterfall. The retry storm doubled database load, which you can see in the DBM dashboard.")

## Section: Product Spotlights

One sub-section per conditional segment. Each spotlight provides a deeper product-specific demo flow beyond what the main acts cover. Include:

- Which DD navigation path to follow (e.g., APM > Services > service-b > Queries)
- Specific features to highlight (e.g., query explain plans in DBM, session replay in RUM)
- Talking points connecting the product to the prospect's use case

Only include this section if at least one conditional segment was detected.

## Section: Appendix — Endpoints

Table of every HTTP endpoint in the demo project:

```
| Service | Method | Path | Purpose | Expected Status |
|---------|--------|------|---------|-----------------|
```

## Section: Appendix — Datadog Views

Table of every Datadog view referenced in the runbook:

```
| View | Navigation | What to Show | URL |
|------|------------|--------------|-----|
```

Populate the URL column with the links constructed using the patterns from `datadog-views.md`.
