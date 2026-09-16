import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../server/app.js';
import { openDatabase } from '../server/database.js';

let db;
let server;
let base;

before(async () => {
  db = openDatabase(':memory:');
  server = createApp(db);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test('the planner, the About page and its documents are served', async () => {
  const planner = await fetch(`${base}/`);
  assert.equal(planner.status, 200);
  assert.match(await planner.text(), /id="board"/);

  const about = await fetch(`${base}/about`);
  assert.equal(about.status, 200);
  assert.match(about.headers.get('content-type'), /text\/html/);
  assert.match(await about.text(), /About Tracey/);

  const diagram = await fetch(`${base}/docs/sequence-diagram.svg`);
  assert.equal(diagram.status, 200);
  assert.match(diagram.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(await diagram.text(), /<svg/);

  const proposal = await fetch(`${base}/docs/hw1-proposal.pdf`, { method: 'HEAD' });
  assert.equal(proposal.status, 200);
  assert.match(proposal.headers.get('content-type'), /application\/pdf/);
});

test('only images and PDFs under docs/ are public', async () => {
  for (const path of [
    '/docs/course-map.md',
    '/docs/sequence-diagram.mmd',
    '/docs/%2e%2e/server/index.js',
    '/docs/%2e%2e/package.json',
    '/server/schema.sql',
    '/data/tracey.sqlite',
  ]) {
    assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  }
});

test('the health check reads SQLite and other API routes are not there yet', async () => {
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'sqlite', stage: 'setup' });
  assert.equal((await fetch(`${base}/api/plans`)).status, 404);
  assert.equal((await fetch(`${base}/api/plans`, { method: 'POST', body: '{}' })).status, 405);
});
