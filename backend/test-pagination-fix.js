
const mongoose = require('mongoose');

async function testPaginationFix() {
  try {
    console.log('🔧 Testing pagination fix...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/idurar-erp-crm');
    console.log('✅ Connected to MongoDB');
    
    const Admin = require('./src/models/coreModels/Admin');
    
    // Test the query directly with pagination
    const page = 1;
    const limit = 10;
    const skip = page * limit - limit;
    
    const baseQuery = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: undefined }
      ]
    };
    
    console.log('🔍 Testing pagination query with limit:', limit);
    
    const [admins, totalCount] = await Promise.all([
      Admin.find(baseQuery)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Admin.countDocuments(baseQuery)
    ]);
    
    const deliverers = admins.filter(admin => admin.role === 'deliverer');
    
    console.log('📊 Pagination Results:');
    console.log(`  - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
    console.log(`  - Total Count: ${totalCount}`);
    console.log(`  - Returned: ${admins.length} admins, ${deliverers.length} deliverers`);
    console.log(`  - Pages needed: ${Math.ceil(totalCount / limit)}`);
    
    const pagination = { 
      page, 
      pages: Math.ceil(totalCount / limit), 
      count: totalCount 
    };
    console.log('📋 Pagination object:', pagination);
    
    console.log('🚚 Deliverers on this page:', deliverers.map(d => d.name));
    
    // Test with larger page size (like frontend will use)
    console.log('\n🔍 Testing with larger page size (100)...');
    
    const [allAdmins, _] = await Promise.all([
      Admin.find(baseQuery)
        .skip(0)
        .limit(100)
        .sort({ createdAt: -1 })
        .exec(),
      Admin.countDocuments(baseQuery)
    ]);
    
    const allDeliverers = allAdmins.filter(admin => admin.role === 'deliverer');
    console.log(`  - With limit 100: ${allAdmins.length} admins, ${allDeliverers.length} deliverers`);
    console.log('🚚 All deliverers:', allDeliverers.map(d => d.name));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPaginationFix();
