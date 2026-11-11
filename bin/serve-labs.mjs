#!/usr/bin/env node
// Serves a directory of labs as plain static files (`ui-components-labs` once installed). When the
// port is taken it moves on to the next free one, unless `--strict-port` is given.
//   node bin/serve-labs.mjs [--port $LABS_PORT] [--host 127.0.0.1] [--dir labs] [--strict-port]

import { parseArgs } from 'node:util';
import { DEFAULT_LABS_HOST, DEFAULT_LABS_PORT, listenLabServer } from './lab-server.mjs';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: process.env.LABS_PORT ?? String(DEFAULT_LABS_PORT) },
    host: { type: 'string', default: DEFAULT_LABS_HOST },
    dir: { type: 'string', default: 'labs' },
    'strict-port': { type: 'boolean', default: false },
  },
});

const port = Number(values.port);
try {
  const { url } = await listenLabServer({
    dir: values.dir,
    host: values.host,
    port,
    strictPort: values['strict-port'],
  });
  const moved = port !== 0 && !url.endsWith(`:${port}/`);
  console.log(`Serving ${values.dir} at ${url}${moved ? ` (port ${port} was in use)` : ''}`);
} catch (error) {
  const busy = /** @type {NodeJS.ErrnoException} */ (error).code === 'EADDRINUSE';
  if (!busy) throw error;
  console.error(
    values['strict-port']
      ? `Port ${port} on ${values.host} is in use; stop what holds it or pick another --port.`
      : `Ports ${port} and the ones after it on ${values.host} are in use; pick another --port.`,
  );
  process.exit(1);
}
