const mongoose = require('mongoose');

// Simple ProductInventory model that uses the same 'inventory' collection
// This ensures backward compatibility while using a single data source
const productInventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['medicines', 'equipment', 'supplies', 'consumables', 'instruments', 'reagents', 'disposables', 'other']
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  productCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  nameAlias: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  gstRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  manufacturer: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: 0
  },
  maximumStock: {
    type: Number,
    default: 1000,
    min: 0
  },
  unit: {
    type: String,
    default: 'pieces',
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false // Allow legacy users without organization
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false // Allow legacy users
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'inventory' // Use the same collection as Inventory model
});

// Pre-save middleware for legacy compatibility
productInventorySchema.pre('save', function(next) {
  // Auto-generate product code if not provided
  if (!this.productCode && this.isNew) {
    this.productCode = `INV-${Date.now()}`;
  }
  
  // Set nameAlias to itemName if not provided
  if (!this.nameAlias) {
    this.nameAlias = this.itemName;
  }
  
  // Validate maximum stock is greater than minimum stock
  if (this.maximumStock <= this.minimumStock) {
    this.maximumStock = this.minimumStock * 10;
  }
  
  next();
});

// Export with explicit collection name to avoid conflicts
module.exports = mongoose.models.ProductInventory || mongoose.model('ProductInventory', productInventorySchema);
