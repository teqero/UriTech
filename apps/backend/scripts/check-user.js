const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'uritech',
  password: 'uritech',
  database: 'uritech'
});
ds.initialize().then(async () => {
  const user = await ds.query('SELECT id,email,name,deleted_at FROM users WHERE id=$1', ['41a4be2b-1928-42e7-b8b0-f2b0ef68c06b']);
  console.log('USER:', JSON.stringify(user));
  await ds.destroy();
}).catch(e => console.error('ERROR:', e.message));
