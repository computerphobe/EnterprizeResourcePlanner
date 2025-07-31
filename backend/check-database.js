const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections in database:');
    collections.forEach(collection => {
      console.log('-', collection.name);
    });
    
    // Check admins collection specifically
    if (collections.find(c => c.name === 'admins')) {
      const Admin = require('./src/models/coreModels/Admin');
      const adminCount = await Admin.countDocuments();
      console.log('\nAdmins collection:');
      console.log('- Total documents:', adminCount);
      
      if (adminCount > 0) {
        const allAdmins = await Admin.find({}).limit(5);
        console.log('- Sample admins:', allAdmins.map(a => ({ 
          _id: a._id, 
          name: a.name, 
          email: a.email, 
          role: a.role,
          isDeleted: a.isDeleted
        })));
      }
    } else {
      console.log('\nNo "admins" collection found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
