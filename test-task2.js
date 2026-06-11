async function test() {
  // 1. Register a new user to get a token
  const res = await fetch('http://localhost:3005/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'test_task_' + Date.now() + '@example.com', password: 'password123', name: 'Test User'})
  });
  const data = await res.json();
  console.log('Register:', data);
  
  if (data.accessToken) {
    // 2. Try to create a task
    const res2 = await fetch('http://localhost:3005/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.accessToken},
      body: JSON.stringify({title: 'test task from node', projectId: null})
    });
    const data2 = await res2.json();
    console.log('Task Create with null project (status ' + res2.status + '):', data2);
    
    // 3. Try to create a task without projectId
    const res3 = await fetch('http://localhost:3005/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.accessToken},
      body: JSON.stringify({title: 'test task from node without project'})
    });
    const data3 = await res3.json();
    console.log('Task Create without project (status ' + res3.status + '):', data3);
  }
}
test();
