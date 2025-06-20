// Script to create a new user directly in the database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Update this with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your-database-name';

async function createUser(userData) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    
    const Admin = mongoose.model('Admin', require('./backend/src/models/coreModels/Admin').schema);
    const AdminPassword = mongoose.model('AdminPassword', require('./backend/src/models/coreModels/AdminPassword').schema);
    const Client = mongoose.model('Client', require('./backend/src/models/appModels/Client').schema);
    
    // Check if user already exists
    const existingUser = await Admin.findOne({ email: userData.email });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      return;
    }
    
    // Find or create owner for organization structure
    let owner = await Admin.findOne({ role: 'owner' });
    if (!owner) {
      console.log('🔧 Creating default owner...');
      owner = new Admin({
        name: 'System',
        surname: 'Owner',
        email: 'owner@system.local',
        role: 'owner',
        organizationId: null,
        enabled: true
      });
      await owner.save();
      
      // Create password for owner
      const ownerSalt = await bcrypt.genSalt(10);
      const ownerHashedPassword = await bcrypt.hash(ownerSalt + 'defaultowner123', 10);
      const ownerPassword = new AdminPassword({
        user: owner._id,
        password: ownerHashedPassword,
        salt: ownerSalt,
      });
      await ownerPassword.save();
      console.log('✅ Default owner created');
    }
    
    // Create the new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(salt + userData.password, 10);
    
    const newUser = new Admin({
      name: userData.name,
      surname: userData.surname || '',
      email: userData.email,
      role: userData.role,
      organizationId: userData.role === 'owner' ? null : owner._id,
      hospitalName: userData.role === 'doctor' ? userData.hospitalName : undefined,
      enabled: true
    });
    
    await newUser.save();
    console.log(`✅ User created: ${newUser.name} (${newUser.role})`);
    
    // Create password
    const userPassword = new AdminPassword({
      user: newUser._id,
      password: hashedPassword,
      salt,
    });
    await userPassword.save();
    console.log('✅ Password set');
    
    // Create client record for hospital/doctor roles
    if (userData.role === 'hospital' || userData.role === 'doctor') {
      const clientRecord = new Client({
        name: `${userData.name} ${userData.surname || ''}`.trim(),
        email: userData.email,
        phone: userData.phone || null,
        address: userData.address || null,
        country: userData.country || null,
        linkedUserId: newUser._id,
        userRole: userData.role,
        organizationId: owner._id,
        hospitalName: userData.role === 'doctor' ? userData.hospitalName : undefined,
        createdBy: owner._id,
        enabled: true,
        removed: false
      });
      
      await clientRecord.save();
      console.log(`✅ Client record created for ${userData.role}`);
    }
    
    console.log('\n🎉 User creation completed successfully!');
    console.log('Login credentials:');
    console.log(`Email: ${userData.email}`);
    console.log(`Password: ${userData.password}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Example usage - modify these details:
const newUserData = {
  name: 'Dr. Jane',
  surname: 'Doe',
  email: 'jane.doe@cityhospital.com',
  password: 'securepass123',
  role: 'doctor', // 'owner', 'doctor', 'hospital', 'deliverer', 'distributor', 'accountant'
  hospitalName: 'City General Hospital', // Only for doctors
  phone: '+1234567890',
  address: '123 Medical Street, City',
  country: 'USA'
};

// Run the script
if (require.main === module) {
  createUser(newUserData).then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = createUser;
