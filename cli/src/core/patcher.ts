import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { renderToFile } from './renderer.js';

export interface DepSpec {
  serviceName: string;
  image: string;
  port: number;
  command?: string;
  ports?: string[];
  volumes?: { name: string; mountPath: string }[];
  environment?: Record<string, string>;
  healthcheck?: { test: string[]; interval: string; timeout: string; retries: number };
  extraVolumeMounts?: { hostPath: string; containerPath: string }[];
}

const DEP_SPECS: Record<string, DepSpec> = {
  'db:postgresql': {
    serviceName: 'postgresql',
    image: 'postgres:16',
    port: 5432,
    volumes: [{ name: 'postgres-data', mountPath: '/var/lib/postgresql/data' }],
    environment: { POSTGRES_USER: 'demo', POSTGRES_PASSWORD: 'demo', POSTGRES_DB: 'demo' },
    healthcheck: { test: ['CMD-SHELL', 'pg_isready -U demo'], interval: '10s', timeout: '5s', retries: 5 },
    extraVolumeMounts: [{ hostPath: './deps/postgresql/init.sql', containerPath: '/docker-entrypoint-initdb.d/init.sql' }],
  },
  'cache:redis': {
    serviceName: 'redis',
    image: 'redis:7-alpine',
    port: 6379,
    ports: ['6379:6379'],
    volumes: [{ name: 'redis-data', mountPath: '/data' }],
    healthcheck: { test: ['CMD', 'redis-cli', 'ping'], interval: '10s', timeout: '5s', retries: 3 },
  },
  'auth:keycloak': {
    serviceName: 'keycloak',
    image: 'quay.io/keycloak/keycloak:latest',
    port: 8080,
    command: 'start-dev --import-realm',
    ports: ['8180:8080'],
    environment: { KEYCLOAK_ADMIN: 'admin', KEYCLOAK_ADMIN_PASSWORD: 'admin' },
    extraVolumeMounts: [{ hostPath: './deps/keycloak/realm-export.json', containerPath: '/opt/keycloak/data/import/realm-export.json' }],
  },
  'db:mysql': {
    serviceName: 'mysql',
    image: 'mysql:8',
    port: 3306,
    command: '--max-digest-length=4096 --performance-schema-max-digest-length=4096 --performance-schema-max-sql-text-length=4096',
    volumes: [{ name: 'mysql-data', mountPath: '/var/lib/mysql' }],
    environment: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_USER: 'demo',
      MYSQL_PASSWORD: 'demo',
      MYSQL_DATABASE: 'demo',
    },
    healthcheck: { test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'], interval: '10s', timeout: '5s', retries: 5 },
    extraVolumeMounts: [{ hostPath: './deps/mysql/init.sql', containerPath: '/docker-entrypoint-initdb.d/init.sql' }],
  },
  'db:mongodb': {
    serviceName: 'mongodb',
    image: 'mongo:7',
    port: 27017,
    volumes: [{ name: 'mongodb-data', mountPath: '/data/db' }],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'admin',
      MONGO_INITDB_ROOT_PASSWORD: 'admin',
    },
    healthcheck: { test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"], interval: '10s', timeout: '5s', retries: 5 },
    extraVolumeMounts: [{ hostPath: './deps/mongodb/init.js', containerPath: '/docker-entrypoint-initdb.d/init.js' }],
  },
  'queue:kafka': {
    serviceName: 'kafka',
    image: 'apache/kafka:latest',
    port: 9092,
    ports: ['9092:9092'],
    environment: {
      KAFKA_NODE_ID: '1',
      KAFKA_PROCESS_ROLES: 'broker,controller',
      KAFKA_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093',
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9092',
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER',
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT',
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:9093',
      KAFKA_LOG_DIRS: '/tmp/kraft-combined-logs',
    },
    healthcheck: { test: ['CMD-SHELL', '/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092'], interval: '15s', timeout: '10s', retries: 5 },
  },
  'compute:spark': {
    serviceName: 'spark',
    image: 'apache/spark:latest',
    port: 8090,
    ports: ['8090:8080', '7077:7077'],
    environment: {
      SPARK_MODE: 'master',
      DD_DATA_JOBS_ENABLED: 'true',
    },
    healthcheck: { test: ['CMD-SHELL', 'curl -f http://localhost:8080/ || exit 1'], interval: '15s', timeout: '10s', retries: 5 },
  },
  'compute:airflow': {
    serviceName: 'airflow',
    image: 'apache/airflow:latest',
    port: 8280,
    command: 'standalone',
    ports: ['8280:8080'],
    environment: {
      AIRFLOW__CORE__EXECUTOR: 'LocalExecutor',
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false',
      _AIRFLOW_DB_MIGRATE: 'true',
      _AIRFLOW_WWW_USER_CREATE: 'true',
      _AIRFLOW_WWW_USER_USERNAME: 'admin',
      _AIRFLOW_WWW_USER_PASSWORD: 'admin',
      _PIP_ADDITIONAL_REQUIREMENTS: 'apache-airflow-providers-openlineage',
      OPENLINEAGE__TRANSPORT__TYPE: 'datadog',
      DD_API_KEY: '${DD_API_KEY}',
      DD_SITE: '${DD_SITE}',
      OPENLINEAGE_NAMESPACE: 'demo',
    },
    healthcheck: { test: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'], interval: '15s', timeout: '10s', retries: 10 },
  },
};

export function getDepSpec(depKey: string): DepSpec | undefined {
  return DEP_SPECS[depKey];
}

export function patchComposeAddService(composePath: string, spec: DepSpec, projectName: string): void {
  const content = fs.readFileSync(composePath, 'utf-8');
  const doc = YAML.parseDocument(content);

  // Check idempotency
  if (doc.hasIn(['services', spec.serviceName])) return;

  // Add named volumes
  if (spec.volumes) {
    for (const vol of spec.volumes) {
      if (!doc.hasIn(['volumes', vol.name])) {
        doc.setIn(['volumes', vol.name], null);
      }
    }
  }

  // Build service object
  const svc: Record<string, unknown> = {
    image: spec.image,
    container_name: `${projectName}-${spec.serviceName}`,
  };

  if (spec.command) {
    svc.command = spec.command;
  }

  if (spec.ports) {
    svc.ports = spec.ports;
  }

  if (spec.environment) {
    svc.environment = Object.entries(spec.environment).map(([k, v]) => `${k}=${v}`);
  }

  // Build volumes list
  const volumeEntries: string[] = [];
  if (spec.extraVolumeMounts) {
    for (const m of spec.extraVolumeMounts) {
      volumeEntries.push(`${m.hostPath}:${m.containerPath}`);
    }
  }
  if (spec.volumes) {
    for (const vol of spec.volumes) {
      volumeEntries.push(`${vol.name}:${vol.mountPath}`);
    }
  }
  if (volumeEntries.length > 0) {
    svc.volumes = volumeEntries;
  }

  if (spec.healthcheck) {
    svc.healthcheck = {
      test: spec.healthcheck.test,
      interval: spec.healthcheck.interval,
      timeout: spec.healthcheck.timeout,
      retries: spec.healthcheck.retries,
    };
  }

  svc.networks = ['dd-demo'];

  // Add service to the services map
  doc.setIn(['services', spec.serviceName], doc.createNode(svc));

  fs.writeFileSync(composePath, doc.toString(), 'utf-8');
}

export function patchComposeAddAgentEnv(composePath: string, envVars: Record<string, string>): void {
  const content = fs.readFileSync(composePath, 'utf-8');
  const doc = YAML.parseDocument(content);

  const envNode = doc.getIn(['services', 'datadog-agent', 'environment'], true);
  if (!YAML.isSeq(envNode)) return;

  const existing = new Set<string>();
  for (const item of envNode.items) {
    const val = YAML.isScalar(item) ? String(item.value) : String(item);
    const key = val.split('=')[0];
    existing.add(key);
  }

  for (const [key, value] of Object.entries(envVars)) {
    if (!existing.has(key)) {
      envNode.add(doc.createNode(`${key}=${value}`));
    }
  }

  fs.writeFileSync(composePath, doc.toString(), 'utf-8');
}

export function patchK8sForDep(
  k8sDir: string,
  spec: DepSpec,
  namespace: string,
  ddEnv: string,
  templatesDir: string,
): void {
  const k8sTplDir = path.join(templatesDir, 'k8s');

  const data = {
    namespace,
    ddEnv,
    name: spec.serviceName,
    image: spec.image,
    port: spec.port,
  };

  renderToFile(
    path.join(k8sTplDir, 'deployment.yaml.hbs'),
    data,
    path.join(k8sDir, 'deps', `${spec.serviceName}-deployment.yaml`),
  );
  renderToFile(
    path.join(k8sTplDir, 'service.yaml.hbs'),
    data,
    path.join(k8sDir, 'deps', `${spec.serviceName}-service.yaml`),
  );
}
