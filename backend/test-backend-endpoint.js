// Test if the backend productinventory endpoint is working
const http = require('http');

async function testBackendEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 8888,
    path: '/api/productinventory/list',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add a simple test token - you'll need to replace with a real one
      'Authorization': 'Bearer test-token'
    }
  };

  console.log('🔍 Testing backend endpoint: http://localhost:8888/api/productinventory/list');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Backend Response Status:', res.statusCode);
        console.log('📋 Response:');
        console.log('  - Success:', jsonData.success);
        console.log('  - Message:', jsonData.message);
        
        if (jsonData.success) {
          console.log('  - Items found:', jsonData.result?.length || 0);
          if (jsonData.result && jsonData.result.length > 0) {
            console.log('  - Sample items:');
            jsonData.result.slice(0, 3).forEach((item, i) => {
              console.log(`    ${i + 1}. ${item.itemName} (qty: ${item.quantity})`);
            });
          }
        } else {
          console.log('❌ Backend error:', jsonData.message);
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

testBackendEndpoint();
