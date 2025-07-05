const mongoose = require('mongoose');
const Inventory = require('./src/models/appModels/Inventory');

// Sample inventory data
const sampleInventoryData = [
  {
    itemName: 'Paracetamol Tablets',
    quantity: 150,
    category: 'medicines',
    price: 45.50,
    productCode: 'MED001',
    nameAlias: 'Acetaminophen',
    material: 'Pharmaceutical',
    gstRate: 5,
    manufacturer: 'PharmaCorp Ltd',
    description: 'Pain relief and fever reducer tablets - 500mg',
    batchNumber: 'PC2024001',
    minimumStock: 20,
    maximumStock: 500,
    unit: 'boxes',
    location: 'Pharmacy Shelf A1',
    supplier: 'MediSupply Co.'
  },
  {
    itemName: 'Digital Blood Pressure Monitor',
    quantity: 8,
    category: 'equipment',
    price: 2850.00,
    productCode: 'EQP002',
    nameAlias: 'BP Monitor',
    material: 'Electronic',
    gstRate: 18,
    manufacturer: 'HealthTech Solutions',
    description: 'Automatic digital blood pressure measurement device',
    batchNumber: 'HT2024015',
    minimumStock: 2,
    maximumStock: 25,
    unit: 'pieces',
    location: 'Equipment Room B2',
    supplier: 'MedEquip International'
  },
  {
    itemName: 'Surgical Gloves (Latex)',
    quantity: 500,
    category: 'supplies',
    price: 12.75,
    productCode: 'SUP003',
    nameAlias: 'Latex Gloves',
    material: 'Latex Rubber',
    gstRate: 12,
    manufacturer: 'SafeHands Manufacturing',
    description: 'Sterile surgical gloves - Size Medium',
    batchNumber: 'SH2024087',
    minimumStock: 100,
    maximumStock: 2000,
    unit: 'boxes',
    location: 'Supply Storage C1',
    supplier: 'Global Medical Supplies'
  },
  {
    itemName: 'Disposable Syringes 5ml',
    quantity: 800,
    category: 'consumables',
    price: 3.25,
    productCode: 'CON004',
    nameAlias: '5ml Syringes',
    material: 'Medical Grade Plastic',
    gstRate: 5,
    manufacturer: 'MediPlast Industries',
    description: 'Single-use sterile syringes with safety lock',
    batchNumber: 'MP2024234',
    minimumStock: 200,
    maximumStock: 3000,
    unit: 'pieces',
    location: 'Supply Storage C2',
    supplier: 'SyringeTech Ltd'
  },
  {
    itemName: 'Stethoscope Professional',
    quantity: 12,
    category: 'instruments',
    price: 1250.00,
    productCode: 'INS005',
    nameAlias: 'Cardiac Stethoscope',
    material: 'Aluminum & Rubber',
    gstRate: 18,
    manufacturer: 'CardioSound Medical',
    description: 'High-quality professional stethoscope for cardiac examination',
    batchNumber: 'CS2024089',
    minimumStock: 3,
    maximumStock: 30,
    unit: 'pieces',
    location: 'Instrument Cabinet D1',
    supplier: 'Professional Medical Tools'
  },
  {
    itemName: 'COVID-19 Rapid Test Kit',
    quantity: 75,
    category: 'reagents',
    price: 125.00,
    productCode: 'REA006',
    nameAlias: 'Antigen Test Kit',
    material: 'Biological Reagents',
    gstRate: 5,
    manufacturer: 'QuickTest Diagnostics',
    description: 'Rapid antigen test for COVID-19 detection',
    batchNumber: 'QT2024156',
    minimumStock: 20,
    maximumStock: 300,
    unit: 'pieces',
    location: 'Lab Storage E1',
    supplier: 'Diagnostic Solutions Inc'
  },
  {
    itemName: 'Surgical Face Masks',
    quantity: 1200,
    category: 'disposables',
    price: 8.50,
    productCode: 'DIS007',
    nameAlias: 'Medical Masks',
    material: 'Non-woven Fabric',
    gstRate: 5,
    manufacturer: 'ProtectWell Industries',
    description: '3-layer surgical face masks with ear loops',
    batchNumber: 'PW2024298',
    minimumStock: 300,
    maximumStock: 5000,
    unit: 'boxes',
    location: 'PPE Storage F1',
    supplier: 'Safety First Medical'
  },
  {
    itemName: 'Insulin Vials (Human)',
    quantity: 45,
    category: 'medicines',
    price: 780.00,
    productCode: 'MED008',
    nameAlias: 'Human Insulin',
    material: 'Pharmaceutical',
    gstRate: 5,
    manufacturer: 'DiabetesCare Pharma',
    description: 'Human insulin injection for diabetes management - 10ml vials',
    expiryDate: new Date('2025-12-31'),
    batchNumber: 'DC2024445',
    minimumStock: 10,
    maximumStock: 200,
    unit: 'vials',
    location: 'Pharmacy Refrigerator A2',
    supplier: 'Specialized Pharma Solutions'
  },
  {
    itemName: 'Wheelchair Standard',
    quantity: 4,
    category: 'equipment',
    price: 4500.00,
    productCode: 'EQP009',
    nameAlias: 'Manual Wheelchair',
    material: 'Steel Frame',
    gstRate: 18,
    manufacturer: 'MobilityPlus Equipment',
    description: 'Standard manual wheelchair with adjustable footrests',
    batchNumber: 'MP2024067',
    minimumStock: 1,
    maximumStock: 15,
    unit: 'pieces',
    location: 'Equipment Bay G1',
    supplier: 'Mobility Solutions Ltd'
  },
  {
    itemName: 'Bandage Gauze Rolls',
    quantity: 200,
    category: 'supplies',
    price: 15.75,
    productCode: 'SUP010',
    nameAlias: 'Gauze Bandages',
    material: 'Cotton Gauze',
    gstRate: 5,
    manufacturer: 'WoundCare Textiles',
    description: 'Sterile gauze bandage rolls for wound dressing - 4 inches',
    batchNumber: 'WC2024178',
    minimumStock: 50,
    maximumStock: 800,
    unit: 'pieces',
    location: 'Supply Storage C3',
    supplier: 'Medical Textiles Inc'
  }
];

async function seedInventory() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarcrm';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Get a sample user/admin to use as organizationId and createdBy
    // First, let's try to find any existing admin user
    const AdminModel = mongoose.models.Admin || require('./src/models/coreModels/Admin');
    const sampleAdmin = await AdminModel.findOne().select('_id name email');
    
    if (!sampleAdmin) {
      console.log('❌ No admin user found. Creating a sample admin user first...');
      
      // Create a sample admin user
      const newAdmin = new AdminModel({
        name: 'Sample Admin',
        email: 'admin@sample.com',
        password: 'samplepassword', // This should be hashed in real implementation
        role: 'admin',
        isActive: true
      });
      
      const createdAdmin = await newAdmin.save();
      console.log('✅ Created sample admin user:', createdAdmin.name);
      
      // Use the newly created admin
      var adminId = createdAdmin._id;
    } else {
      console.log('✅ Found existing admin user:', sampleAdmin.name);
      var adminId = sampleAdmin._id;
    }
    
    // Clear existing inventory (optional - comment out if you want to keep existing data)
    // await Inventory.deleteMany({});
    // console.log('🗑️ Cleared existing inventory data');
    
    // Add organizationId and createdBy to each inventory item
    const inventoryItemsWithIds = sampleInventoryData.map(item => ({
      ...item,
      organizationId: adminId,
      createdBy: adminId,
      lastUpdatedBy: adminId,
      isActive: true
    }));
    
    // Insert the sample data
    const result = await Inventory.insertMany(inventoryItemsWithIds);
    
    console.log(`✅ Successfully added ${result.length} inventory items to the database:`);
    result.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.itemName} (${item.productCode}) - Qty: ${item.quantity}`);
    });
    
    // Display summary
    const totalItems = await Inventory.countDocuments({});
    const lowStockItems = await Inventory.countDocuments({
      $expr: { $lte: ['$quantity', '$minimumStock'] }
    });
    
    console.log('\n📊 Database Summary:');
    console.log(`   Total Items: ${totalItems}`);
    console.log(`   Low Stock Items: ${lowStockItems}`);
    console.log(`   Organization ID used: ${adminId}`);
    
  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

// Run the seeding function
seedInventory();
