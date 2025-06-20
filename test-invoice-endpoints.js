// Test script to check invoice endpoints
const fetch = require('node-fetch');

// Adjust these values based on your test environment
const apiBaseUrl = 'http://localhost:5000/api'; // Change to match your server
const authToken = 'YOUR_AUTH_TOKEN'; // Replace with valid token
const testClientId = 'CLIENT_ID_TO_TEST'; // Replace with a real client ID

async function testInvoiceEndpoints() {
  console.log('Testing invoice endpoints...');
  
  // Test 1: Hospital Sales Bills
  try {
    console.log('\n--- Testing Hospital Sales Bills Endpoint ---');
    const response = await fetch(`${apiBaseUrl}/hospital/sales-bills`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Status:', response.status);
      console.log('Success:', result.success);
      console.log('Message:', result.message);
      console.log('Invoice Count:', result.result?.length || 0);
      
      // Show first invoice if available
      if (result.result && result.result.length > 0) {
        console.log('Sample Invoice:', {
          id: result.result[0]._id,
          billNumber: result.result[0].billNumber,
          amount: result.result[0].totalAmount,
          status: result.result[0].status
        });
      }
    } else {
      console.log('Error Response:', response.status);
      const errorText = await response.text();
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.error('Hospital Sales Bills Error:', error.message);
  }
  
  // Test 2: Doctor Sales Bills
  try {
    console.log('\n--- Testing Doctor Sales Bills Endpoint ---');
    const response = await fetch(`${apiBaseUrl}/doctor/sales-bills`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Status:', response.status);
      console.log('Success:', result.success);
      console.log('Message:', result.message);
      console.log('Invoice Count:', result.result?.length || 0);
    } else {
      console.log('Error Response:', response.status);
      const errorText = await response.text();
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.error('Doctor Sales Bills Error:', error.message);
  }
  
  // Test 3: Admin Client Invoices Lookup
  try {
    console.log('\n--- Testing Admin Client Invoices Lookup ---');
    const response = await fetch(`${apiBaseUrl}/admin/client-invoices/${testClientId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Status:', response.status);
      console.log('Success:', result.success);
      console.log('Message:', result.message);
      console.log('Invoice Count:', result.result?.length || 0);
    } else {
      console.log('Error Response:', response.status);
      const errorText = await response.text();
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.error('Admin Client Invoices Lookup Error:', error.message);
  }
}

// Instructions for running the test
console.log('=======================================================');
console.log('IMPORTANT: Before running this test script:');
console.log('1. Update apiBaseUrl if your server runs on a different port');
console.log('2. Replace YOUR_AUTH_TOKEN with a valid authentication token');
console.log('3. Replace CLIENT_ID_TO_TEST with an actual client ID to test');
console.log('=======================================================');
console.log('To run: node test-invoice-endpoints.js');
console.log('=======================================================');

// Uncomment to run automatically
// testInvoiceEndpoints();

module.exports = { testInvoiceEndpoints };
