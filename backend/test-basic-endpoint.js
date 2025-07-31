// Simple test without authentication to check basic endpoint
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api/';

async function testBasicEndpoint() {
  try {
    console.log('Testing admin/list endpoint...');
    
    const response = await fetch(`${API_BASE_URL}admin/list`, {
      headers: { 
        'Content-Type': 'application/json' 
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text(); // Get raw text first
    console.log('Raw response:', data);
    
    try {
      const jsonData = JSON.parse(data);
      if (jsonData.success && jsonData.result) {
        const deliverers = jsonData.result.filter(user => user.role === 'deliverer');
        console.log(`✅ Found ${deliverers.length} deliverers`);
      }
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testBasicEndpoint();
