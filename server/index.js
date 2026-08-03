import { openDatabase } from './database.js';
import { createApp } from './app.js';

const db = openDatabase();
const server = createApp(db);
const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`Tracey: http://127.0.0.1:${server.address().port}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => db.close()));
}
