# Data Jobs Monitoring

## Prerequisites

- A data processing framework in the project (Apache Spark, Apache Airflow, dbt, or similar)
- Datadog Agent v7.40.0+ (for Spark); Airflow and dbt use agentless reporting
- For Spark: cluster access to install the Datadog Spark integration

## Agent Configuration

### Apache Spark

The Agent needs the Spark integration enabled to collect job-level metrics. Configure a Spark check:

```yaml
# datadog-agent volumes
volumes:
  - ./agent-config/spark.d/conf.yaml:/etc/datadog-agent/conf.d/spark.d/conf.yaml
```

```yaml
# agent-config/spark.d/conf.yaml
init_config:

instances:
  - spark_url: http://spark-master:8080
    cluster_name: demo-cluster
    spark_cluster_mode: spark_standalone_mode
```

### Apache Airflow

Airflow reports to Datadog via StatsD (metrics) and the Datadog Airflow provider (traces). Add to the Agent:

```yaml
environment:
  - DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
```

### dbt

dbt uses the `dbt-datadog` package for agentless reporting — no Agent configuration changes needed.

## Application Changes

### Apache Spark

Install the `datadog-agent` Spark integration on the cluster. For Databricks, use the Databricks-Datadog integration. For self-managed Spark:

```bash
# On the Spark driver
pip install datadog-spark
```

Enable Data Jobs Monitoring:

```yaml
environment:
  - DD_DATA_JOBS_ENABLED=true
  - DD_SPARK_APP_NAME=<your-spark-app>
```

### Apache Airflow

Install the Datadog Airflow provider:

```bash
pip install apache-airflow-providers-datadog
```

Configure in `airflow.cfg` or environment:

```ini
[datadog]
api_key = ${DD_API_KEY}
datadog_conn_id = datadog_default
```

Or via environment variables:

```yaml
environment:
  - AIRFLOW__DATADOG__API_KEY=${DD_API_KEY}
  - AIRFLOW__DATADOG__DATADOG_CONN_ID=datadog_default
```

### dbt

Add the Datadog integration to `packages.yml`:

```yaml
packages:
  - package: datadog/dbt_datadog
    version: [">=0.1.0", "<1.0.0"]
```

Configure in `profiles.yml` or environment:

```yaml
environment:
  - DD_API_KEY=${DD_API_KEY}
  - DD_SITE=${DD_SITE:-datadoghq.com}
  - DBT_DATADOG_ENABLED=true
```

## Deployment Config

### Docker Compose — Spark Example

```yaml
services:
  spark-master:
    image: bitnami/spark:latest
    environment:
      - SPARK_MODE=master
    ports:
      - "8080:8080"
      - "7077:7077"

  spark-worker:
    image: bitnami/spark:latest
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
    depends_on:
      - spark-master
```

## Cross-Product Wiring

- **APM**: Data job spans appear in distributed traces — Spark jobs, Airflow tasks, and dbt models are visible as spans
- **Infrastructure**: Spark executor and driver metrics correlate with cluster resource usage
- **Log Management**: Job logs (stderr/stdout) are correlated to job traces
- **Monitors**: Alert on job duration, failure rate, or data freshness

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Spark job OOM | Job failure in Data Jobs view, executor memory metrics spike |
| Airflow DAG failure | Failed task spans, DAG run failure in Data Jobs |
| dbt model failure | dbt run error in Data Jobs, model-level failure trace |
| Long-running job | Job duration exceeds threshold, visible in Data Jobs timeline |

## References

- [Data Jobs Monitoring](https://docs.datadoghq.com/data_jobs/)
- [Spark Integration](https://docs.datadoghq.com/integrations/spark/)
- [Airflow Integration](https://docs.datadoghq.com/integrations/airflow/)
- [dbt Integration](https://docs.datadoghq.com/integrations/dbt_cloud/)
