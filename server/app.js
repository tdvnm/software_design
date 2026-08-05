import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = resolve(root, 'dist');
const docs = resolve(root, 'docs');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
};

// Serve the planner, project documentation and one API health check. Plan/course endpoints come later.
export function createApp(db) {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return json(response, 405, { error: 'Method not allowed.' }, { Allow: 'GET, HEAD' });
    }
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (path === '/api/health') {
        db.prepare('SELECT 1').get();
        return json(
          response,
          200,
          { status: 'ok', database: 'sqlite', stage: 'setup' },
          {},
          request.method,
        );
      }

      let file;
      if (path === '/') file = resolve(root, 'index.html');
      if (path === '/about') file = resolve(root, 'about.html');
      if (path === '/abstract' || path === '/asbtract') file = resolve(root, 'abstract.html');
      if (path === '/components') file = resolve(root, 'components.html');
      if (path === '/sequence') file = resolve(root, 'sequence.html');
      if (path === '/data/courses.csv') file = resolve(root, 'data/courses.csv');
      if (path.startsWith('/assets/')) {
        const candidate = resolve(assets, path.slice('/assets/'.length));
        if (candidate.startsWith(assets + sep) && ['.js', '.css'].includes(extname(candidate)))
          file = candidate;
      }
      // Design documents linked from the About page: only images and PDFs, never the Markdown or anything above docs/.
      if (path.startsWith('/docs/')) {
        const candidate = resolve(docs, path.slice('/docs/'.length));
        if (candidate.startsWith(docs + sep) && ['.svg', '.pdf', '.png'].includes(extname(candidate)))
          file = candidate;
      }
      if (path === '/favicon.ico') {
        response.writeHead(204);
        return response.end();
      }
      if (!file) return json(response, 404, { error: 'Not found.' }, {}, request.method);

      const content = await readFile(file);
      response.writeHead(200, {
        'Content-Type': `${mime[extname(file)]}; charset=utf-8`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error instanceof URIError ? 400 : error.code === 'ENOENT' ? 404 : 500;
      if (status === 500) console.error(error);
      json(
        response,
        status,
        { error: status === 404 ? 'File missing. Run npm run build first.' : 'Request failed.' },
        {},
        request.method,
      );
    }
  });
}

function json(response, status, body, headers = {}, method = 'GET') {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(method === 'HEAD' ? undefined : JSON.stringify(body));
}
