const http = require('http');

async function test() {
  const res = await fetch('http://localhost:3005/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'test_get_' + Date.now() + '@example.com', password: 'password123', name: 'Test'})
  });
  const data = await res.json();
  
  if (data.accessToken) {
    const res2 = await fetch('http://localhost:3005/api/tasks', {
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + data.accessToken}
    });
    console.log('GET /tasks (status ' + res2.status + '):', await res2.text());
  }
}
test();
