const ProductInventory = require('@/models/appModels/ProductInventory');

// Create inventory item
exports.create = async (req, res) => {
  try {
    const { gstRate } = req.body;

    // Validate gstRate manually
    if (![5, 12].includes(gstRate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST rate. Only 5% or 12% allowed.',
      });
    }    const newItem = new ProductInventory(req.body);
    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      result: savedItem,
      message: 'Product added successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Creation failed.',
      error: error.message
    });
  }
};

// Read inventory item by ID
exports.read = async (req, res) => {
  try {
    const item = await ProductInventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    res.status(200).json({ success: true, result: item });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fetch failed.',
      error: error.message
    });
  }
};

// Update inventory item
exports.update = async (req, res) => {
  try {
    const { gstRate } = req.body;

    if (gstRate !== undefined && ![5, 12].includes(gstRate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST rate. Only 5% or 12% allowed.',
      });
    }

    const updated = await ProductInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Item not found.' });

    res.status(200).json({
      success: true,
      result: updated,
      message: 'Product updated successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Update failed.',
      error: error.message
    });
  }
};

// Delete inventory item
exports.delete = async (req, res) => {
  try {
    const deleted = await ProductInventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Item not found.' });

    res.status(200).json({
      success: true,
      message: 'Product deleted.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Delete failed.',
      error: error.message
    });
  }
};

// List all items
exports.list = async (req, res) => {
  try {
    console.log('🟢 ProductInventory list endpoint hit by user:', req.user?.role);
    console.log('📦 MongoDB collection for Inventory:', ProductInventory.collection.name);

    const items = await ProductInventory.find();
    console.log('🟢 Found items count:', items.length);
    console.log('🟢 Sample item:', items[0]);
    
    res.status(200).json({ success: true, result: items });
  } catch (error) {
    console.error('🔴 ProductInventory list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items.',
      error: error.message
    });
  }
};

// Search by product code
exports.searchByCode = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Product code is required.' });
    }

    const item = await ProductInventory.findOne({ productCode: code });
    if (!item) {
      return res.status(404).json({ success: false, message: 'No product found with that code.' });
    }

    res.status(200).json({ success: true, result: item });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching by code.',
      error: error.message
    });
  }
};

// Filter by nameAlias or material
exports.filterByCategory = async (req, res) => {
  try {
    const { material, nameAlias } = req.query;

    const filter = {};
    if (material) filter.material = material;
    if (nameAlias) filter.nameAlias = nameAlias;

    const items = await ProductInventory.find(filter);
    res.status(200).json({ success: true, result: items });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error filtering.',
      error: error.message
    });
  }
};
