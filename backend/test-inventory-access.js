// Test script to verify inventory API access for different user roles
const API_BASE_URL = 'http://localhost:8888/api'; // Update this to match your backend URL

async function testInventoryAccess(token, userRole) {
  console.log(`\n🧪 Testing inventory access for ${userRole} role...`);
  
  try {
    // Test 1: List all inventory items
    console.log('📋 Test 1: List inventory items');
    const listResponse = await fetch(`${API_BASE_URL}/productinventory/list`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const listData = await listResponse.json();
    
    if (listResponse.ok && listData.success) {
      console.log(`✅ SUCCESS: Listed ${listData.result?.length || 0} inventory items`);
      
      if (listData.result && listData.result.length > 0) {
        const sampleItem = listData.result[0];
        console.log(`   Sample item: ${sampleItem.itemName} - ₹${sampleItem.price} (${sampleItem.quantity} available)`);
        
        // Test 2: Read single inventory item
        console.log('📖 Test 2: Read single inventory item');
        const readResponse = await fetch(`${API_BASE_URL}/productinventory/read/${sampleItem._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const readData = await readResponse.json();
        
        if (readResponse.ok && readData.success) {
          console.log(`✅ SUCCESS: Read item details for ${readData.result.itemName}`);
        } else {
          console.log(`❌ FAILED: Could not read item details - ${readData.message}`);
        }
      }
      
      // Test 3: Search inventory
      console.log('🔍 Test 3: Search inventory');
      const searchResponse = await fetch(`${API_BASE_URL}/productinventory/search?q=paracetamol`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const searchData = await searchResponse.json();
      
      if (searchResponse.ok && searchData.success) {
        console.log(`✅ SUCCESS: Search returned ${searchData.result?.length || 0} items`);
      } else {
        console.log(`❌ FAILED: Search failed - ${searchData.message}`);
      }
      
      // Test 4: Get inventory summary
      console.log('📊 Test 4: Get inventory summary');
      const summaryResponse = await fetch(`${API_BASE_URL}/productinventory/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const summaryData = await summaryResponse.json();
      
      if (summaryResponse.ok && summaryData.success) {
        console.log(`✅ SUCCESS: Summary retrieved`);
        console.log(`   Total Items: ${summaryData.result?.totalItems || 0}`);
        console.log(`   Low Stock Items: ${summaryData.result?.lowStockCount || 0}`);
        console.log(`   Total Value: ₹${summaryData.result?.totalValue || 0}`);
      } else {
        console.log(`❌ FAILED: Summary failed - ${summaryData.message}`);
      }
      
    } else {
      console.log(`❌ FAILED: Could not list inventory items - ${listData.message}`);
      console.log(`   Status: ${listResponse.status}`);
      console.log(`   Response: ${JSON.stringify(listData, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Example usage - replace with actual user tokens
async function runTests() {
  console.log('🚀 Starting Inventory API Access Tests...\n');
  
  // You need to replace these with actual JWT tokens from your frontend
  const testTokens = {
    // Login to your frontend and copy the token from localStorage or browser dev tools
    doctor: 'YOUR_DOCTOR_TOKEN_HERE',
    admin: 'YOUR_ADMIN_TOKEN_HERE',
    hospital: 'YOUR_HOSPITAL_TOKEN_HERE'
  };
  
  console.log('📝 Instructions:');
  console.log('1. Login to your frontend application');
  console.log('2. Open browser dev tools (F12)');
  console.log('3. Go to Application/Storage > Local Storage');
  console.log('4. Find the "token" or "auth" key and copy the JWT token');
  console.log('5. Replace the token values below and run this script');
  console.log('\nExample: node test-inventory-access.js');
  
  // Uncomment and replace tokens to run tests
  /*
  for (const [role, token] of Object.entries(testTokens)) {
    if (token && token !== `YOUR_${role.toUpperCase()}_TOKEN_HERE`) {
      await testInventoryAccess(token, role);
    } else {
      console.log(`\n⚠️  Skipping ${role} test - no token provided`);
    }
  }
  */
  
  console.log('\n🔧 Manual Test Commands:');
  console.log('You can also test manually using curl:');
  console.log('');
  console.log('# List inventory (replace YOUR_TOKEN with actual token):');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" ${API_BASE_URL}/productinventory/list`);
  console.log('');
  console.log('# Search inventory:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${API_BASE_URL}/productinventory/search?q=paracetamol"`);
  console.log('');
  console.log('# Get inventory summary:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" ${API_BASE_URL}/productinventory/summary`);
}

// Run the tests
runTests();
