// Test script to check endpoints
const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('Testing endpoints...');
  
  // Test 1: Check if test route works
  try {
    const testResponse = await fetch('http://localhost:5000/api/returns/test');
    const testResult = await testResponse.json();
    console.log('Test route result:', testResult);
  } catch (error) {
    console.error('Test route error:', error.message);
  }
  
  // Test 2: Check if collect route exists (should return 401 without auth)
  try {
    const collectResponse = await fetch('http://localhost:5000/api/returns/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const collectResult = await collectResponse.json();
    console.log('Collect route result:', collectResult);
    console.log('Collect route status:', collectResponse.status);
  } catch (error) {
    console.error('Collect route error:', error.message);
  }
}

testEndpoints();
