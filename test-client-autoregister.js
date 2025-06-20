// Test script for client auto-registration functionality
const fetch = require('node-fetch');

// Configuration - update these values
const apiBaseUrl = 'http://localhost:5000/api';
const adminToken = 'YOUR_ADMIN_TOKEN'; // Replace with valid admin token

async function testClientAutoRegistration() {
  console.log('=== TESTING CLIENT AUTO-REGISTRATION ===\n');
  
  // Test data
  const testUserId = 'test-user-' + Date.now();
  const testUserInfo = {
    name: 'Test Hospital',
    email: 'test@hospital.com',
    phone: '+1234567890',
    address: '123 Test Street'
  };
  
  try {
    console.log('1. Testing manual client creation endpoint...');
    
    const createResponse = await fetch(`${apiBaseUrl}/admin/client/find-or-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        userInfo: testUserInfo
      })
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Client creation successful:');
      console.log('   - Success:', createResult.success);
      console.log('   - Client ID:', createResult.result?._id);
      console.log('   - Client Name:', createResult.result?.name);
      console.log('   - Message:', createResult.message);
      
      // Test finding the same client again (should not create duplicate)
      console.log('\n2. Testing duplicate prevention...');
      
      const duplicateResponse = await fetch(`${apiBaseUrl}/admin/client/find-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: testUserId,
          userInfo: { name: 'Different Name' } // Try different info
        })
      });
      
      if (duplicateResponse.ok) {
        const duplicateResult = await duplicateResponse.json();
        console.log('✅ Duplicate prevention test:');
        console.log('   - Found existing client:', duplicateResult.result?.name);
        console.log('   - Same ID?', duplicateResult.result?._id === createResult.result?._id);
        console.log('   - Name preserved?', duplicateResult.result?.name === createResult.result?.name);
      } else {
        console.log('❌ Duplicate test failed:', duplicateResponse.status);
      }
      
    } else {
      console.log('❌ Client creation failed:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('   Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test the client utilities functions directly (if running in Node.js with access to the models)
async function testClientUtilsDirectly() {
  console.log('\n=== TESTING CLIENT UTILS DIRECTLY ===\n');
  
  try {
    // This would only work if running in the backend environment
    const { findOrCreateClientByUserId } = require('./backend/src/controllers/appControllers/clientController/clientUtils');
    
    const testUserId = 'direct-test-' + Date.now();
    const testUserInfo = {
      name: 'Direct Test Client',
      email: 'direct@test.com'
    };
    
    console.log('Testing findOrCreateClientByUserId...');
    const client = await findOrCreateClientByUserId(testUserId, testUserInfo);
    
    if (client) {
      console.log('✅ Direct test successful:');
      console.log('   - Client ID:', client._id);
      console.log('   - Client Name:', client.name);
      console.log('   - User ID:', client.userId);
    } else {
      console.log('❌ Direct test failed');
    }
    
  } catch (error) {
    console.log('⚠️  Direct test skipped (not in backend environment):', error.message);
  }
}

// Instructions and main execution
console.log('=== CLIENT AUTO-REGISTRATION TEST SCRIPT ===');
console.log('');
console.log('SETUP INSTRUCTIONS:');
console.log('1. Make sure your ERP server is running');
console.log('2. Update apiBaseUrl if using different port');
console.log('3. Replace adminToken with a valid admin authentication token');
console.log('4. Run: node test-client-autoregister.js');
console.log('');

// Check if required configuration is provided
if (adminToken === 'YOUR_ADMIN_TOKEN') {
  console.log('⚠️  Please update the adminToken variable before running tests');
  console.log('   You can get a token by logging in as an admin and checking the browser\'s local storage');
} else {
  // Run the tests
  testClientAutoRegistration()
    .then(() => testClientUtilsDirectly())
    .then(() => {
      console.log('\n=== TESTS COMPLETED ===');
    });
}

module.exports = { testClientAutoRegistration };
