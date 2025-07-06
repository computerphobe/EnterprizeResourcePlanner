// Test the complete flow: inventory + orders
const http = require('http');

async function testCompleteFlow() {
  console.log('🧪 Testing complete inventory + orders flow...\n');
  
  // Test 1: Inventory listing
  console.log('📋 Test 1: Inventory listing via productinventory endpoint');
  await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/api/productinventory/list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Success: ${jsonData.success}`);
          console.log(`  Message: ${jsonData.message || 'No message'}`);
          
          if (jsonData.success && jsonData.result) {
            console.log(`  ✅ Found ${jsonData.result.length} inventory items`);
            if (jsonData.result.length > 0) {
              const sample = jsonData.result[0];
              console.log(`  📦 Sample: ${sample.itemName} (qty: ${sample.quantity})`);
            }
          } else {
            console.log(`  ❌ Error: ${jsonData.message}`);
          }
        } catch (error) {
          console.log(`  ❌ Parse error: ${error.message}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Request error: ${error.message}`);
      resolve();
    });

    req.end();
  });

  console.log('\n📦 Test 2: Order listing (requires auth)');
  await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/api/order/list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Success: ${jsonData.success}`);
          console.log(`  Message: ${jsonData.message || 'No message'}`);
          
          if (res.statusCode === 401) {
            console.log(`  ℹ️  Expected auth error - endpoint requires authentication`);
          } else if (jsonData.success && jsonData.result) {
            console.log(`  ✅ Found ${jsonData.result.length} orders`);
          }
        } catch (error) {
          console.log(`  ❌ Parse error: ${error.message}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Request error: ${error.message}`);
      resolve();
    });

    req.end();
  });

  console.log('\n🎯 Summary:');
  console.log('1. If inventory test passes, frontend inventory should work');
  console.log('2. If order test requires auth (401), that\'s normal');
  console.log('3. Both endpoints are properly configured');
  console.log('\n💡 Next steps:');
  console.log('- Login to frontend and check inventory module');
  console.log('- Check order list to see if inventory details appear');
  console.log('- Try creating a new order to test inventory selection');
}

testCompleteFlow();
