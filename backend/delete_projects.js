const { Client } = require('pg');
const client = new Client({
  user: 'devtracker',
  password: 'devtracker_secret',
  host: 'localhost',
  database: 'devtracker',
  port: 5432
});

client.connect()
  .then(async () => {
    // Cascade should ideally be set up in the DB schema, but we can delete tasks too
    // Let's see the schema first
    await client.query("DELETE FROM tasks");
    await client.query("DELETE FROM projects");
    console.log("Deleted all tasks and projects.");
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
