const Inventory = require('@/models/appModels/Inventory');
const mongoose = require('mongoose');

// Simple, clean inventory controller for unified inventory system

// ✅ List Inventory Items
exports.list = async (req, res) => {
    try {
        const { category, lowStock, active = true, page = 1, limit = 50, search } = req.query;
        
        // Build query - show all active items for all users
        const query = {
            isActive: active === 'true' ? true : { $ne: false }
        };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$quantity', '$minimumStock'] };
        }
        
        if (search) {
            query.$or = [
                { itemName: { $regex: search, $options: 'i' } },
                { productCode: { $regex: search, $options: 'i' } },
                { nameAlias: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get total count
        const totalItems = await Inventory.countDocuments(query);
        
        // Fetch items with pagination
        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .sort({ itemName: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;
        
        console.log(`✅ Listed ${items.length} inventory items (page ${page}/${totalPages})`);
        
        res.status(200).json({
            success: true,
            result: items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('List inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to fetch inventory items'
        });
    }
};

// ✅ Create Inventory Item
exports.create = async (req, res) => {
    try {
        console.log('🔍 Create request user:', req.user);
        console.log('🔍 Create request body:', req.body);
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        
        // Handle legacy users gracefully
        const organizationId = req.user.organizationId || req.user._id || null;
        const createdBy = req.user._id || null;
        
        const { 
            itemName, quantity, category, price, productCode, nameAlias, 
            material, gstRate, manufacturer, description, expiryDate, 
            batchNumber, minimumStock, maximumStock, unit, location, supplier 
        } = req.body;
        
        // Validate required fields
        if (!itemName || quantity === undefined || !category || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: "Item name, quantity, category, and price are required" 
            });
        }

        // Prepare item data
        const itemData = {
            itemName: itemName.trim(),
            quantity: Number(quantity),
            category,
            price: Number(price),
            productCode: productCode ? productCode.trim().toUpperCase() : `INV-${Date.now()}`,
            nameAlias: nameAlias ? nameAlias.trim() : itemName.trim(),
            material: material ? material.trim() : undefined,
            gstRate: gstRate ? Number(gstRate) : 5,
            manufacturer: manufacturer ? manufacturer.trim() : undefined,
            description: description ? description.trim() : undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            batchNumber: batchNumber ? batchNumber.trim().toUpperCase() : undefined,
            minimumStock: minimumStock ? Number(minimumStock) : 10,
            maximumStock: maximumStock ? Number(maximumStock) : 1000,
            unit: unit || 'pieces',
            location: location ? location.trim() : undefined,
            supplier: supplier ? supplier.trim() : undefined,
            organizationId,
            createdBy,
            lastUpdatedBy: createdBy
        };

        // Validate business rules
        if (itemData.maximumStock <= itemData.minimumStock) {
            itemData.maximumStock = itemData.minimumStock * 10;
        }

        if (itemData.expiryDate && itemData.expiryDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiry date must be in the future"
            });
        }

        console.log('✅ Creating inventory item:', itemData.itemName);
        
        const item = await Inventory.create(itemData);
        
        // Populate created item
        const populatedItem = await Inventory.findById(item._id)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email');

        console.log('✅ Created inventory item:', populatedItem.itemName);

        res.status(201).json({ 
            success: true, 
            result: populatedItem,
            message: `Inventory item "${itemData.itemName}" created successfully`
        });
    } catch (error) {
        console.error('Create inventory error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: "Validation error",
                errors 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to create inventory item'
        });
    }
};

// ✅ Read single inventory item
exports.read = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        const item = await Inventory.findOne({ 
            _id: id,
            isActive: { $ne: false }
        })
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            result: item 
        });
    } catch (error) {
        console.error('Read inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to read inventory item'
        });
    }
};

// ✅ Update inventory item
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        const updateData = { ...req.body };
        updateData.lastUpdatedBy = req.user._id;
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        )
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');

        if (!updatedItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        console.log('✅ Updated inventory item:', updatedItem.itemName);

        res.status(200).json({ 
            success: true, 
            result: updatedItem,
            message: 'Inventory item updated successfully'
        });
    } catch (error) {
        console.error('Update inventory error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: "Validation error",
                errors 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to update inventory item'
        });
    }
};

// ✅ Delete inventory item (soft delete)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        const deletedItem = await Inventory.findByIdAndUpdate(
            id, 
            { 
                isActive: false,
                lastUpdatedBy: req.user._id
            }, 
            { new: true }
        );

        if (!deletedItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        console.log('✅ Deleted inventory item:', deletedItem.itemName);

        res.status(200).json({ 
            success: true, 
            result: deletedItem,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to delete inventory item'
        });
    }
};

// ✅ Search inventory items
exports.search = async (req, res) => {
    try {
        const { q, category, limit = 20 } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            });
        }

        const query = {
            isActive: { $ne: false },
            $or: [
                { itemName: { $regex: q, $options: 'i' } },
                { productCode: { $regex: q, $options: 'i' } },
                { nameAlias: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .sort({ itemName: 1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({ 
            success: true, 
            result: items,
            message: `Found ${items.length} items matching "${q}"`
        });
    } catch (error) {
        console.error('Search inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to search inventory items'
        });
    }
};

// ✅ Get inventory summary
exports.summary = async (req, res) => {
    try {
        const totalItems = await Inventory.countDocuments({ isActive: { $ne: false } });
        const lowStockItems = await Inventory.countDocuments({ 
            isActive: { $ne: false },
            $expr: { $lte: ['$quantity', '$minimumStock'] }
        });
        const outOfStockItems = await Inventory.countDocuments({ 
            isActive: { $ne: false },
            quantity: 0
        });

        const categories = await Inventory.aggregate([
            { $match: { isActive: { $ne: false } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({ 
            success: true, 
            result: {
                totalItems,
                lowStockItems,
                outOfStockItems,
                categories
            }
        });
    } catch (error) {
        console.error('Summary inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to get inventory summary'
        });
    }
};

// ✅ Filter inventory items
exports.filter = async (req, res) => {
    try {
        const { category, minQuantity, maxQuantity, minPrice, maxPrice } = req.query;
        
        const query = { isActive: { $ne: false } };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (minQuantity !== undefined) {
            query.quantity = { ...query.quantity, $gte: Number(minQuantity) };
        }
        
        if (maxQuantity !== undefined) {
            query.quantity = { ...query.quantity, $lte: Number(maxQuantity) };
        }
        
        if (minPrice !== undefined) {
            query.price = { ...query.price, $gte: Number(minPrice) };
        }
        
        if (maxPrice !== undefined) {
            query.price = { ...query.price, $lte: Number(maxPrice) };
        }

        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .sort({ itemName: 1 })
            .lean();

        res.status(200).json({ 
            success: true, 
            result: items,
            message: `Found ${items.length} items matching filters`
        });
    } catch (error) {
        console.error('Filter inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to filter inventory items'
        });
    }
};

// ✅ List all inventory items (without pagination)
exports.listAll = async (req, res) => {
    try {
        const items = await Inventory.find({ isActive: { $ne: false } })
            .populate('createdBy', 'name email')
            .sort({ itemName: 1 })
            .lean();

        res.status(200).json({ 
            success: true, 
            result: items
        });
    } catch (error) {
        console.error('ListAll inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to fetch all inventory items'
        });
    }
};
