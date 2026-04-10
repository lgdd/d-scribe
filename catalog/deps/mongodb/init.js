// Datadog Database Monitoring setup for MongoDB
// Reference: https://docs.datadoghq.com/database_monitoring/setup_mongodb/selfhosted/

db = db.getSiblingDB('admin');

db.createUser({
  user: 'datadog',
  pwd: 'datadog',
  roles: [
    { role: 'read', db: 'admin' },
    { role: 'clusterMonitor', db: 'admin' },
    { role: 'read', db: 'local' },
    { role: 'read', db: 'demo' },
  ],
});

// Application database
db = db.getSiblingDB('demo');

db.createUser({
  user: 'demo',
  pwd: 'demo',
  roles: [{ role: 'readWrite', db: 'demo' }],
});

// Enable profiling for slow operations (>100ms)
db.setProfilingLevel(1, { slowms: 100 });

// Sample collections for DBM demo patterns
// Events collection (no index on 'category' — intentional for COLLSCAN demo)
db.createCollection('events');
for (let i = 0; i < 1000; i++) {
  db.events.insertOne({
    category: ['electronics', 'clothing', 'food', 'books', 'toys'][i % 5],
    amount: Math.floor(Math.random() * 1000),
    created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)),
  });
}

// Parents + children collections
db.createCollection('parents');
db.createCollection('children');
['Parent A', 'Parent B', 'Parent C', 'Parent D', 'Parent E'].forEach((name, i) => {
  const parentId = db.parents.insertOne({ name, created_at: new Date() }).insertedId;
  for (let j = 0; j < (i % 4) + 1; j++) {
    db.children.insertOne({ parent_id: parentId, name: 'Child ' + (j + 1) + ' of ' + name });
  }
});
