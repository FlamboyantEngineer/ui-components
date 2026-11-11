// The static lab server: plain files from one directory, which is all the labs need. It uses only
// Node's built-in modules, so the package can ship it for libraries built on this one to serve their
// own labs (`ui-components-labs`, UIC-LABS-4.3). `bin/serve-labs.mjs` is its command line.

import { createReadStream, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

/** Where the lab server listens unless told otherwise. */
export const DEFAULT_LABS_HOST = '127.0.0.1';
export const DEFAULT_LABS_PORT = 4173;

/** How many ports after a busy one the server tries before it gives up. */
const PORT_ATTEMPTS = 20;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  // Extensionless files, such as a vendored LICENSE.
  '': 'text/plain; charset=utf-8',
};

/**
 * A server for the files under `dir`, rejecting paths that leave it.
 * @param {string} dir
 */
function createLabServer(dir) {
  return createServer((request, response) => {
    let pathname;
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400, { 'content-type': 'text/plain' }).end('Bad request');
      return;
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(dir, pathname));
    if (file !== dir && !file.startsWith(dir + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let stat;
    let realFile;
    try {
      realFile = realpathSync(file);
      if (realFile !== dir && !realFile.startsWith(dir + sep)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      stat = statSync(realFile);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    if (!stat.isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    const extension = extname(file).toLowerCase();
    const type = TYPES[extension];
    if (!type) {
      // A guessed type breaks the files that need theirs, such as WebAssembly, so fail loudly.
      console.error(`No content type for ${extension} files (${pathname}); add one to TYPES.`);
      response
        .writeHead(500, { 'content-type': 'text/plain' })
        .end(`No content type for ${extension} files`);
      return;
    }
    response.writeHead(200, {
      'content-type': type,
      'content-length': stat.size,
      'cache-control': 'no-store',
    });
    createReadStream(realFile).pipe(response);
  });
}

/**
 * Listens on `port`, or when another process holds it and `strictPort` is off, on the next free port
 * after it. Resolves with the server and the URL it serves.
 * @param {{ dir: string, host?: string, port?: number, strictPort?: boolean }} options
 * @returns {Promise<{ server: import('node:http').Server, url: string }>}
 */
export async function listenLabServer({
  dir,
  host = DEFAULT_LABS_HOST,
  port = DEFAULT_LABS_PORT,
  strictPort = false,
}) {
  const server = createLabServer(realpathSync(resolve(dir)));
  const last = strictPort || port === 0 ? port : port + PORT_ATTEMPTS - 1;
  for (let candidate = port; ; candidate += 1) {
    try {
      await new Promise((done, fail) => {
        server.once('error', fail);
        server.listen(candidate, host, () => {
          server.off('error', fail);
          done(undefined);
        });
      });
      const { port: bound } = /** @type {import('node:net').AddressInfo} */ (server.address());
      return { server, url: `http://${host}:${bound}/` };
    } catch (error) {
      const busy = /** @type {NodeJS.ErrnoException} */ (error).code === 'EADDRINUSE';
      if (!busy || candidate >= last) throw error;
    }
  }
}
