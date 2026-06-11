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
    const res = await client.query("SELECT email, password FROM users WHERE email = 'aliouloum2004@gmail.com'");
    console.log(res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
