const Admin = require("@/models/coreModels/Admin");
const AdminPassword = require("@/models/coreModels/AdminPassword");
const Client = require("@/models/appModels/Client");
const bcrypt = require("bcryptjs");

console.log("register endpoint hit");

const register = async (req, res) => {
    const { name, surname, email, password, role, phone, address, country, hospitalName } = req.body;
    console.log("register endpoint hit", req.body);
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }
  
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    try {
      // Determine the organization ID based on the admin creating this user
      let organizationId;
      let adminContext = req.admin;
      
      if (req.admin) {
        // If the admin has an organizationId, use it (they're a sub-admin)
        // If they don't have organizationId, they're the owner, so use their ID
        organizationId = req.admin.organizationId || req.admin._id;
      } else {
        // Fallback: Find or create an owner admin if no admin context
        console.log('⚠️ No admin context found, looking for owner admin...');
        
        let ownerAdmin = await Admin.findOne({ role: 'owner' });
        
        if (!ownerAdmin) {
          console.log('🔧 No owner found, creating default owner admin...');
          // Create a default owner admin
          ownerAdmin = new Admin({
            name: 'System',
            surname: 'Owner',
            email: 'owner@system.local',
            role: 'owner',
            organizationId: null,
            enabled: true
          });
          await ownerAdmin.save();
          
          // Create password for the owner
          const ownerSalt = await bcrypt.genSalt(10);
          const ownerHashedPassword = await bcrypt.hash(ownerSalt + 'defaultowner123', 10);
          
          const ownerPassword = new AdminPassword({
            user: ownerAdmin._id,
            password: ownerHashedPassword,
            salt: ownerSalt,
          });
          await ownerPassword.save();
          
          console.log(`✅ Created default owner: ${ownerAdmin.email}`);
        }
        
        adminContext = ownerAdmin;
        organizationId = ownerAdmin._id;
      }
      
      console.log(`📋 Registration context - Admin: ${adminContext?.name} (${adminContext?.role}), Organization ID: ${organizationId}`);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(salt + password, 10);
      const newUser = new Admin({
        name,
        surname,
        email,
        role,
        organizationId: role === 'owner' ? null : organizationId, // Owners don't have organizationId
        hospitalName: role === 'doctor' ? hospitalName : undefined, // Only for doctors
      });
    
      await newUser.save();
    
      const userPassword = new AdminPassword({
        user: newUser._id,
        password: hashedPassword,
        salt,
      });
    
      await userPassword.save();      let clientRecord = null;
      
      // Auto-create client record for hospital and doctor roles
      if (role === 'hospital' || role === 'doctor') {
        console.log(`🏥 Creating client record for ${role}: ${name}`);
        
        // Make sure we have an organizationId for the client
        if (!organizationId) {
          throw new Error('Cannot create client record: No organization ID available');
        }
          clientRecord = new Client({
          name: `${name} ${surname || ''}`.trim(),
          email: email,
          phone: phone || null,
          address: address || null,
          country: country || null,
          linkedUserId: newUser._id,
          userRole: role,
          organizationId: organizationId,
          hospitalName: role === 'doctor' ? hospitalName : undefined, // Only for doctors
          createdBy: adminContext?._id,
          enabled: true,
          removed: false
        });
        
        await clientRecord.save();
        console.log(`✅ Client record created with ID: ${clientRecord._id}`);
      }
    
      res.status(201).json({
        success: true,
        message: `User registered successfully${clientRecord ? ' with client record' : ''}.`,
        result: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          client: clientRecord ? {
            id: clientRecord._id,
            name: clientRecord.name,
            email: clientRecord.email
          } : null
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  };

  module.exports = register;