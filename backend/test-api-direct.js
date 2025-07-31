// Test the admin list API endpoint directly
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api/';

async function testAdminListEndpoint() {
  try {
    console.log('Testing admin list endpoint...');
    
    // You'll need to replace this with a valid admin token
    // Get it from browser localStorage or login first
    const adminToken = 'Bearer YOUR_ADMIN_TOKEN_HERE';
    
    const response = await fetch(`${API_BASE_URL}admin/list`, {
      headers: { 
        'Authorization': adminToken,
        'Content-Type': 'application/json' 
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ API returned ${data.result.length} total admins`);
      
      const deliverers = data.result.filter(user => user.role === 'deliverer');
      console.log(`📦 Deliverers found: ${deliverers.length}`);
      
      deliverers.forEach((deliverer, index) => {
        console.log(`  ${index + 1}. ${deliverer.name} (${deliverer.email})`);
      });
      
      console.log('\n🔍 All roles in response:', [...new Set(data.result.map(user => user.role))]);
    } else {
      console.error('❌ API Error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n⚠️ Make sure:');
    console.log('1. Backend server is running on port 5000');
    console.log('2. Replace YOUR_ADMIN_TOKEN_HERE with a valid admin token');
    console.log('   (Get it from browser localStorage after admin login)');
  }
}

testAdminListEndpoint();
