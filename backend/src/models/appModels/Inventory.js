const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { 
    type: String, 
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['medicines', 'equipment', 'supplies', 'consumables', 'instruments', 'reagents', 'disposables', 'other'],
      message: 'Please select a valid category'
    }
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  productCode: { 
    type: String, 
    required: false, 
    default: '',
    trim: true,
    uppercase: true,
    maxlength: [20, 'Product code cannot exceed 20 characters']
  },
  nameAlias: { 
    type: String, 
    required: false, 
    default: '',
    trim: true,
    maxlength: [100, 'Name alias cannot exceed 100 characters']
  },
  material: { 
    type: String, 
    required: false, 
    default: 'N/A',
    trim: true,
    maxlength: [50, 'Material description cannot exceed 50 characters']
  },
  gstRate: { 
    type: Number, 
    required: false, 
    default: 5,
    enum: {
      values: [0, 5, 12, 18, 28],
      message: 'GST rate must be 0%, 5%, 12%, 18%, or 28%'
    }
  },
  manufacturer: { 
    type: String, 
    required: false,
    trim: true,
    maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: false,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  expiryDate: { 
    type: Date, 
    required: false,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  batchNumber: { 
    type: String, 
    required: false,
    trim: true,
    uppercase: true,
    maxlength: [30, 'Batch number cannot exceed 30 characters']
  },
  minimumStock: {
    type: Number,
    required: false,
    default: 10,
    min: [0, 'Minimum stock cannot be negative']
  },
  maximumStock: {
    type: Number,
    required: false,
    default: 1000,
    min: [1, 'Maximum stock must be at least 1']
  },
  unit: {
    type: String,
    required: false,
    default: 'pieces',
    enum: ['pieces', 'boxes', 'bottles', 'vials', 'packs', 'kg', 'grams', 'liters', 'ml', 'meters', 'other']
  },
  location: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  supplier: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false, // Will be validated in pre-save middleware
    validate: {
      validator: function(value) {
        return value != null;
      },
      message: 'Organization ID is required'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false, // Will be validated in pre-save middleware
    validate: {
      validator: function(value) {
        return value != null;
      },
      message: 'Created by user ID is required'
    }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  collection: 'inventory'
});

// Indexes for better performance
inventorySchema.index({ itemName: 1, organizationId: 1 });
inventorySchema.index({ productCode: 1, organizationId: 1 });
inventorySchema.index({ category: 1, organizationId: 1 });
inventorySchema.index({ isActive: 1, organizationId: 1 });
inventorySchema.index({ quantity: 1, minimumStock: 1 });

// Virtual for low stock indication
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minimumStock;
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.minimumStock) return 'low_stock';
  if (this.quantity >= this.maximumStock) return 'overstock';
  return 'in_stock';
});

// Ensure virtuals are included in JSON
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Handle legacy users without organizationId
  if (!this.organizationId && this.createdBy) {
    this.organizationId = this.createdBy;
    console.log('🔄 Setting organizationId fallback to createdBy:', this.organizationId);
  }
  
  // Handle legacy users without createdBy
  if (!this.createdBy && this.organizationId) {
    this.createdBy = this.organizationId;
    console.log('🔄 Setting createdBy fallback to organizationId:', this.createdBy);
  }
  
  // Final validation - both must be set
  if (!this.organizationId) {
    return next(new Error('Organization ID is required'));
  }
  
  if (!this.createdBy) {
    return next(new Error('Created by user ID is required'));
  }
  
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

// Static methods
inventorySchema.statics.findByOrganization = function(organizationId, options = {}) {
  const query = { organizationId, isActive: true };
  if (options.category) query.category = options.category;
  if (options.lowStock) query.$expr = { $lte: ['$quantity', '$minimumStock'] };
  
  return this.find(query).sort({ itemName: 1 });
};

inventorySchema.statics.findLowStockItems = function(organizationId) {
  return this.find({
    organizationId,
    isActive: true,
    $expr: { $lte: ['$quantity', '$minimumStock'] }
  }).sort({ quantity: 1 });
};

inventorySchema.statics.updateStock = function(itemId, quantityChange, userId) {
  return this.findByIdAndUpdate(
    itemId,
    { 
      $inc: { quantity: quantityChange },
      $set: { lastUpdatedBy: userId }
    },
    { new: true }
  );
};

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
