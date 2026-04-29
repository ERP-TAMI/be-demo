async function test() {
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rd@erp.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  if (!token) {
    console.error('Login failed', loginData);
    return;
  }

  // Get first style
  const stylesRes = await fetch('http://localhost:3000/api/v1/styles', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const styles = await stylesRes.json();
  const style = styles[0];
  if (!style) {
    console.error('No styles found');
    return;
  }

  // Get doc
  const docsRes = await fetch(`http://localhost:3000/api/v1/styles/${style.id}/production-docs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const docs = await docsRes.json();
  let doc = docs[0];

  if (!doc) {
    const createRes = await fetch(`http://localhost:3000/api/v1/styles/${style.id}/production-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test Doc', section2Accessories: 'phu lieu test post' })
    });
    doc = await createRes.json();
  }

  console.log('Updating doc:', doc.id);
  const payload = {
    section2Accessories: 'phu lieu update ' + Date.now(),
    section3Notes: 'ghi chu update',
    sections: [{ title: 'Quy cach may', content: 'noi dung quy cach', imageUrls: [], orderIndex: 0 }]
  };
  console.log('Payload:', payload);

  const updateRes = await fetch(`http://localhost:3000/api/v1/styles/${style.id}/production-docs/${doc.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const updateData = await updateRes.json();
  console.log('Update result status:', updateRes.status);
  console.log('Update result:', updateData);

  // Verify
  const verifyRes = await fetch(`http://localhost:3000/api/v1/styles/${style.id}/production-docs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const verifyDocs = await verifyRes.json();
  console.log('Verified doc:', verifyDocs[0]);
}

test();
