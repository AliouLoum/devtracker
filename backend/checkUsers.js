const { Client } = require('pg');
const client = new Client({
  user: 'devtracker',
  password: 'devtracker_secret',
  host: 'localhost',
  database: 'devtracker',
  port: 5432
});

const bcrypt = require('bcryptjs');

client.connect()
  .then(async () => {
    const password = await bcrypt.hash('devtracker2026', 10);
    await client.query('UPDATE users SET password = $1 WHERE email = $2', [password, 'aliouloum2004@gmail.com']);
    console.log("Password reset successfully to 'devtracker2026' for aliouloum2004@gmail.com");
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
