require('dd-trace').init();

const express = require('express');
const pino = require('pino');

const logger = pino({ level: 'info' });
const app = express();
const port = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  logger.info({ port }, 'service started');
});
