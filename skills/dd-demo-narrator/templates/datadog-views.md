# Datadog Views — URL Construction

## Site-to-Base-URL Mapping

Construct the base URL from `DD_SITE`:

| `DD_SITE` value | Base URL |
|---|---|
| `datadoghq.com` | `https://app.datadoghq.com` |
| `datadoghq.eu` | `https://app.datadoghq.eu` |
| `us3.datadoghq.com` | `https://us3.datadoghq.com` |
| `us5.datadoghq.com` | `https://us5.datadoghq.com` |
| `ap1.datadoghq.com` | `https://ap1.datadoghq.com` |

## URL Patterns

Build URLs for each relevant view using `{base}` and `{DD_ENV}`:

| View | URL Pattern |
|---|---|
| Service Map | `{base}/apm/map?env={DD_ENV}` |
| Traces | `{base}/apm/traces?query=env%3A{DD_ENV}` |
| Service Page | `{base}/apm/services/{service}?env={DD_ENV}` |
| Logs | `{base}/logs?query=env%3A{DD_ENV}` |
| Error Tracking | `{base}/apm/error-tracking?env={DD_ENV}` |
| DBM | `{base}/databases?env={DD_ENV}` |
| RUM Sessions | `{base}/rum/sessions?query=%40type%3Asession%20%40env%3A{DD_ENV}` |
| Profiling | `{base}/profiling?env={DD_ENV}` |
