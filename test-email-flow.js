// Quick test for email-based client-invoice flow
const fetch = require('node-fetch');

const apiBaseUrl = 'http://localhost:5000/api';
const adminToken = 'YOUR_ADMIN_TOKEN';

async function testEmailBasedFlow() {
  console.log('=== TESTING EMAIL-BASED CLIENT-INVOICE FLOW ===\n');
  
  const testData = {
    name: 'Test Hospital',
    surname: 'Medical Center', 
    email: `test-hospital-${Date.now()}@email.com`,
    password: 'password123',
    role: 'hospital',
    phone: '+1234567890',
    address: '123 Medical Street',
    country: 'USA'
  };
  
  try {
    console.log('1. Testing user registration with auto-client creation...');
    
    const registerResponse = await fetch(`${apiBaseUrl}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Registration successful:');
      console.log('   - User created:', registerResult.result?.user?.name);
      console.log('   - Client auto-created:', registerResult.result?.client ? 'YES' : 'NO');
      console.log('   - Client ID:', registerResult.result?.client?.id);
      
      // Test login with the new user
      console.log('\n2. Testing login with new user...');
      
      const loginResponse = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testData.email,
          password: testData.password
        })
      });
      
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        const userToken = loginResult.token;
        console.log('✅ Login successful, token obtained');
        
        // Test invoice viewing
        console.log('\n3. Testing invoice viewing with email-based lookup...');
        
        const invoiceResponse = await fetch(`${apiBaseUrl}/hospital/sales-bills`, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (invoiceResponse.ok) {
          const invoiceResult = await invoiceResponse.json();
          console.log('✅ Invoice lookup successful:');
          console.log('   - Success:', invoiceResult.success);
          console.log('   - Invoice count:', invoiceResult.result?.length || 0);
          console.log('   - Client found:', invoiceResult.clientInfo ? 'YES' : 'NO');
          console.log('   - Client email:', invoiceResult.clientInfo?.email);
        } else {
          console.log('❌ Invoice lookup failed:', invoiceResponse.status);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.status);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResponse.status);
      const errorText = await registerResponse.text();
      console.log('   Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

console.log('=== EMAIL-BASED FLOW TEST SCRIPT ===');
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Replace adminToken with a valid admin token');
console.log('2. Make sure your ERP server is running');
console.log('3. Run: node test-email-flow.js');
console.log('');

if (adminToken === 'YOUR_ADMIN_TOKEN') {
  console.log('⚠️  Please update the adminToken before running');
} else {
  testEmailBasedFlow()
    .then(() => console.log('\n=== TEST COMPLETED ==='));
}

module.exports = { testEmailBasedFlow };
