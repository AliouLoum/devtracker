const http = require('http');

async function test() {
  const res = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'demo@devtracker.local', password: 'password123'})
  });
  const data = await res.json();
  console.log('Login:', data);
  
  if (data.accessToken) {
    const res2 = await fetch('http://localhost:3005/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.accessToken},
      body: JSON.stringify({title: 'test task from node', projectId: null})
    });
    const data2 = await res2.json();
    console.log('Task Create with null project:', data2);
    
    const res3 = await fetch('http://localhost:3005/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.accessToken},
      body: JSON.stringify({title: 'test task from node without project'})
    });
    const data3 = await res3.json();
    console.log('Task Create without project:', data3);
  }
}
test();
