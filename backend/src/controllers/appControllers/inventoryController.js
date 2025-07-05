const Inventory = require('@/models/appModels/Inventory');
const mongoose = require('mongoose');

// Helper function to get user organization with fallback
const getUserOrganization = (user) => {
  // If user has organizationId, use it
  if (user.organizationId) {
    return user.organizationId;
  }
  
  // If user is owner or admin without organizationId, use their own ID
  if (user.role === 'owner' || user.role === 'admin') {
    return user._id;
  }
  
  // Fallback: use user's own ID as organization
  return user._id;
};

// ✅ List Inventory Items
exports.list = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        const { category, lowStock, active = true, page = 1, limit = 50, search } = req.query;
        
        // Build query
        const query = { 
            organizationId,
            isActive: active === 'true'
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

        // Add computed fields
        const mappedItems = items.map(item => ({
            ...item,
            isLowStock: item.quantity <= item.minimumStock,
            stockStatus: item.quantity === 0 ? 'out_of_stock' : 
                        item.quantity <= item.minimumStock ? 'low_stock' :
                        item.quantity >= item.maximumStock ? 'overstock' : 'in_stock',
            stockValue: item.quantity * item.price,
            key: item._id
        }));

        // Calculate summary stats
        const summary = {
            totalItems: totalItems,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / parseInt(limit)),
            itemsPerPage: parseInt(limit),
            lowStockCount: await Inventory.countDocuments({
                organizationId,
                isActive: true,
                $expr: { $lte: ['$quantity', '$minimumStock'] }
            }),
            outOfStockCount: await Inventory.countDocuments({
                organizationId,
                isActive: true,
                quantity: 0
            }),
            totalValue: mappedItems.reduce((sum, item) => sum + item.stockValue, 0)
        };

        res.json({
            success: true,
            result: mappedItems,
            summary,
            message: mappedItems.length === 0 ? "No inventory items found" : `${mappedItems.length} items retrieved`,
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
        // Debug logging
        console.log('🔍 Create request user:', JSON.stringify(req.user, null, 2));
        console.log('🔍 Create request body:', JSON.stringify(req.body, null, 2));
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        
        if (!req.user._id) {
            return res.status(400).json({
                success: false,
                message: "User ID is missing"
            });
        }
        
        const organizationId = getUserOrganization(req.user);
        console.log('🔍 Organization ID:', organizationId);
        
        // Enhanced validation with fallbacks
        let finalOrganizationId = organizationId;
        let finalCreatedBy = req.user._id;
        
        // Fallback for organizationId
        if (!finalOrganizationId) {
            finalOrganizationId = req.user._id;
            console.log('🔍 Using user ID as organization fallback:', finalOrganizationId);
        }
        
        // Fallback for createdBy
        if (!finalCreatedBy) {
            finalCreatedBy = finalOrganizationId;
            console.log('🔍 Using organization ID as createdBy fallback:', finalCreatedBy);
        }
        
        // Ensure they are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(finalOrganizationId)) {
            console.log('❌ Invalid organizationId format:', finalOrganizationId);
            return res.status(400).json({
                success: false,
                message: "Invalid organization ID format"
            });
        }
        
        if (!mongoose.Types.ObjectId.isValid(finalCreatedBy)) {
            console.log('❌ Invalid createdBy format:', finalCreatedBy);
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        
        if (!finalOrganizationId) {
            return res.status(400).json({
                success: false,
                message: "Unable to determine organization - please contact administrator"
            });
        }
        
        const { 
            itemName, quantity, category, price, productCode, nameAlias, 
            material, gstRate, manufacturer, description, expiryDate, 
            batchNumber, minimumStock, maximumStock, unit, location, supplier 
        } = req.body;
        
        console.log('🔍 Creating inventory item:', { itemName, quantity, category, price, organizationId });
        
        // Validate required fields
        if (!itemName || quantity === undefined || !category || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: "Item name, quantity, category, and price are required" 
            });
        }

        // Check for duplicate product code within organization
        if (productCode) {
            const existingItem = await Inventory.findOne({ 
                productCode: productCode.toUpperCase(), 
                organizationId: finalOrganizationId,
                isActive: true 
            });
            if (existingItem) {
                return res.status(400).json({
                    success: false,
                    message: "Product code already exists in your organization"
                });
            }
        }

        // Prepare item data with fallback values
        const itemData = {
            itemName: itemName.trim(),
            quantity: Number(quantity),
            category,
            price: Number(price),
            productCode: productCode ? productCode.trim().toUpperCase() : `INV-${Date.now()}`,
            nameAlias: nameAlias ? nameAlias.trim() : itemName.trim(),
            material: material ? material.trim() : 'N/A',
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
            organizationId: finalOrganizationId,
            createdBy: finalCreatedBy,
            lastUpdatedBy: finalCreatedBy
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

        console.log('✅ About to create inventory item with data:', JSON.stringify(itemData, null, 2));
        
        try {
            const item = await Inventory.create(itemData);
            console.log('✅ Successfully created item:', item._id);
            
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
        } catch (createError) {
            console.error('❌ Database create error:', createError);
            
            if (createError.name === 'ValidationError') {
                const validationErrors = Object.values(createError.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: `Validation failed: ${validationErrors.join(', ')}`,
                    errors: validationErrors
                });
            }
            
            throw createError; // Re-throw for outer catch
        }
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
        const organizationId = getUserOrganization(req.user);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        const item = await Inventory.findOne({ 
            _id: id, 
            organizationId,
            isActive: true 
        })
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        res.json({ 
            success: true, 
            result: item,
            message: 'Inventory item retrieved successfully'
        });
    } catch (error) {
        console.error('Read inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to fetch inventory item'
        });
    }
};

// ✅ Update Inventory Item
exports.update = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        const { id } = req.params;
        const updateData = req.body;
        
        console.log('🔍 Updating inventory item:', id, updateData);
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        // Check if item exists and belongs to organization
        const existingItem = await Inventory.findOne({ 
            _id: id, 
            organizationId,
            isActive: true 
        });
        
        if (!existingItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        // Check for duplicate product code if being updated
        if (updateData.productCode && updateData.productCode !== existingItem.productCode) {
            const duplicateItem = await Inventory.findOne({ 
                productCode: updateData.productCode.toUpperCase(), 
                organizationId,
                isActive: true,
                _id: { $ne: id }
            });
            if (duplicateItem) {
                return res.status(400).json({
                    success: false,
                    message: "Product code already exists in your organization"
                });
            }
        }

        // Prepare update data
        const processedUpdateData = {
            ...updateData,
            lastUpdatedBy: req.user._id
        };

        // Clean up the data
        if (processedUpdateData.productCode) {
            processedUpdateData.productCode = processedUpdateData.productCode.trim().toUpperCase();
        }
        if (processedUpdateData.itemName) {
            processedUpdateData.itemName = processedUpdateData.itemName.trim();
        }
        if (processedUpdateData.nameAlias) {
            processedUpdateData.nameAlias = processedUpdateData.nameAlias.trim();
        }
        if (processedUpdateData.batchNumber) {
            processedUpdateData.batchNumber = processedUpdateData.batchNumber.trim().toUpperCase();
        }

        // Validate business rules
        if (processedUpdateData.maximumStock && processedUpdateData.minimumStock) {
            if (processedUpdateData.maximumStock <= processedUpdateData.minimumStock) {
                processedUpdateData.maximumStock = processedUpdateData.minimumStock * 10;
            }
        }

        if (processedUpdateData.expiryDate && new Date(processedUpdateData.expiryDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiry date must be in the future"
            });
        }

        // Remove undefined values
        Object.keys(processedUpdateData).forEach(key => {
            if (processedUpdateData[key] === undefined || processedUpdateData[key] === '') {
                delete processedUpdateData[key];
            }
        });

        console.log('✅ Updating inventory item with data:', processedUpdateData);
        
        const item = await Inventory.findByIdAndUpdate(
            id, 
            processedUpdateData, 
            { 
                new: true, 
                runValidators: true 
            }
        )
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');

        res.json({ 
            success: true, 
            result: item,
            message: `Inventory item "${item.itemName}" updated successfully`
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

// ✅ Delete Inventory Item (Soft delete)
exports.delete = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        const { id } = req.params;
        
        console.log('Soft deleting inventory item:', id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid inventory item ID' 
            });
        }

        const item = await Inventory.findOneAndUpdate(
            { _id: id, organizationId, isActive: true },
            { 
                isActive: false, 
                lastUpdatedBy: req.user._id 
            },
            { new: true }
        )
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }

        console.log('✅ Soft deleted inventory item:', item.itemName);
        res.json({ 
            success: true, 
            result: item,
            message: `Inventory item "${item.itemName}" deleted successfully`
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
        const organizationId = getUserOrganization(req.user);
        const { q: searchTerm, category, limit = 20 } = req.query;
        
        if (!searchTerm) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search term is required' 
            });
        }

        const query = {
            organizationId,
            isActive: true,
            $or: [
                { itemName: { $regex: searchTerm, $options: 'i' } },
                { productCode: { $regex: searchTerm, $options: 'i' } },
                { nameAlias: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        const items = await Inventory.find(query)
            .limit(parseInt(limit))
            .sort({ itemName: 1 })
            .lean();

        res.json({
            success: true,
            result: items,
            message: `Found ${items.length} items matching "${searchTerm}"`
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

// ✅ Filter inventory items
exports.filter = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        const { 
            category, 
            stockStatus, 
            minPrice, 
            maxPrice, 
            supplier,
            location,
            unit,
            gstRate 
        } = req.query;
        
        const query = { organizationId, isActive: true };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (supplier) {
            query.supplier = { $regex: supplier, $options: 'i' };
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (unit && unit !== 'all') {
            query.unit = unit;
        }
        
        if (gstRate !== undefined) {
            query.gstRate = Number(gstRate);
        }
        
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
        }
        
        if (stockStatus) {
            switch (stockStatus) {
                case 'out_of_stock':
                    query.quantity = 0;
                    break;
                case 'low_stock':
                    query.$expr = { $lte: ['$quantity', '$minimumStock'] };
                    break;
                case 'overstock':
                    query.$expr = { $gte: ['$quantity', '$maximumStock'] };
                    break;
                case 'in_stock':
                    query.$expr = { 
                        $and: [
                            { $gt: ['$quantity', '$minimumStock'] },
                            { $lt: ['$quantity', '$maximumStock'] }
                        ]
                    };
                    break;
            }
        }

        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .sort({ itemName: 1 })
            .lean();

        res.json({
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

// ✅ Get inventory summary/dashboard
exports.summary = async (req, res) => {
    try {
        // Validate user authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const organizationId = getUserOrganization(req.user);
        
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Use simple queries instead of complex aggregation
        const totalItems = await Inventory.countDocuments({ 
            organizationId, 
            isActive: true 
        });

        const outOfStockItems = await Inventory.countDocuments({ 
            organizationId, 
            isActive: true, 
            quantity: 0 
        });

        // Get low stock items using simple query
        const lowStockCount = await Inventory.countDocuments({
            organizationId,
            isActive: true,
            quantity: { $gt: 0, $lte: 10 } // Simplified low stock check
        });

        // Get all items to calculate total value
        const allItems = await Inventory.find({ 
            organizationId, 
            isActive: true 
        }, 'quantity price category').lean();

        const totalValue = allItems.reduce((sum, item) => 
            sum + ((item.quantity || 0) * (item.price || 0)), 0
        );

        // Get category summary
        const categoryMap = {};
        allItems.forEach(item => {
            const cat = item.category || 'other';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { count: 0, totalQuantity: 0, totalValue: 0 };
            }
            categoryMap[cat].count++;
            categoryMap[cat].totalQuantity += item.quantity || 0;
            categoryMap[cat].totalValue += (item.quantity || 0) * (item.price || 0);
        });

        const categorySummary = Object.keys(categoryMap).map(category => ({
            _id: category,
            count: categoryMap[category].count,
            totalQuantity: categoryMap[category].totalQuantity,
            totalValue: categoryMap[category].totalValue
        })).sort((a, b) => b.count - a.count);

        // Get recent items
        const recentItems = await Inventory.find({ 
            organizationId, 
            isActive: true 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        const summary = {
            totalItems: totalItems || 0,
            lowStockItems: lowStockCount || 0,
            outOfStockItems: outOfStockItems || 0,
            inStockItems: (totalItems || 0) - (outOfStockItems || 0),
            totalValue: totalValue || 0,
            categorySummary: categorySummary || [],
            recentItems: recentItems || [],
            alerts: {
                lowStock: (lowStockCount || 0) > 0,
                outOfStock: (outOfStockItems || 0) > 0,
                lowStockCount: lowStockCount || 0,
                outOfStockCount: outOfStockItems || 0
            }
        };

        res.json({
            success: true,
            result: summary,
            message: 'Inventory summary retrieved successfully'
        });
    } catch (error) {
        console.error('Inventory summary error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to get inventory summary'
        });
    }
};

// ✅ Simple summary endpoint for debugging
exports.summarySimple = async (req, res) => {
    try {
        // Validate user authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const organizationId = getUserOrganization(req.user);
        
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Simple count operations only
        const totalItems = await Inventory.countDocuments({ 
            organizationId, 
            isActive: true 
        });

        const summary = {
            totalItems: totalItems || 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            inStockItems: totalItems || 0,
            totalValue: 0,
            categorySummary: [],
            recentItems: [],
            alerts: {
                lowStock: false,
                outOfStock: false,
                lowStockCount: 0,
                outOfStockCount: 0
            }
        };

        res.json({
            success: true,
            result: summary,
            message: 'Simple inventory summary retrieved successfully'
        });
    } catch (error) {
        console.error('Simple summary error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to get simple inventory summary'
        });
    }
};

// ✅ Update stock quantity (for order processing)
exports.updateStock = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        const { id } = req.params;
        const { quantityChange, reason = 'Manual adjustment' } = req.body;
        
        if (!quantityChange || quantityChange === 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity change is required and must not be zero'
            });
        }

        const item = await Inventory.findOne({ 
            _id: id, 
            organizationId, 
            isActive: true 
        });
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        const newQuantity = item.quantity + quantityChange;
        
        if (newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${item.quantity}, Requested: ${Math.abs(quantityChange)}`
            });
        }

        const updatedItem = await Inventory.findByIdAndUpdate(
            id,
            { 
                quantity: newQuantity,
                lastUpdatedBy: req.user._id
            },
            { new: true }
        ).populate('createdBy', 'name email');

        res.json({
            success: true,
            result: updatedItem,
            message: `Stock updated successfully. ${reason}`
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to update stock'
        });
    }
};

// ✅ Get low stock items
exports.getLowStock = async (req, res) => {
    try {
        const organizationId = getUserOrganization(req.user);
        
        const lowStockItems = await Inventory.find({
            organizationId,
            isActive: true,
            $expr: { $lte: ['$quantity', '$minimumStock'] }
        })
        .populate('createdBy', 'name email')
        .sort({ quantity: 1 })
        .lean();

        res.json({
            success: true,
            result: lowStockItems,
            message: `Found ${lowStockItems.length} low stock items`
        });
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to get low stock items'
        });
    }
};

// Test endpoint to verify inventory system is working
exports.test = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Inventory controller is working!',
            user: req.user ? { id: req.user._id, role: req.user.role } : 'No user',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Test endpoint failed'
        });
    }
};

// Simple create endpoint for debugging
exports.createSimple = async (req, res) => {
    try {
        console.log('🔍 Simple create - user:', req.user);
        console.log('🔍 Simple create - body:', req.body);
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: "No user authenticated" });
        }
        
        // Enhanced organization ID resolution with fallbacks
        let organizationId = getUserOrganization(req.user);
        let createdByUserId = req.user._id;
        
        console.log('🔍 Simple create - organizationId:', organizationId);
        console.log('🔍 Simple create - createdByUserId:', createdByUserId);
        
        // Fallback: if no organizationId, use user's ID
        if (!organizationId) {
            organizationId = req.user._id;
            console.log('🔍 Using user ID as organization fallback:', organizationId);
        }
        
        // Fallback: if no createdBy user ID, use a default or generate one
        if (!createdByUserId) {
            createdByUserId = organizationId; // Use organization ID as fallback
            console.log('🔍 Using organization ID as createdBy fallback:', createdByUserId);
        }
        
        const { itemName, quantity, category, price } = req.body;
        
        if (!itemName || quantity === undefined || !category || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: itemName, quantity, category, price" 
            });
        }
        
        const simpleItem = {
            itemName,
            quantity: Number(quantity),
            category,
            price: Number(price),
            productCode: `INV-${Date.now()}`,
            organizationId,
            createdBy: createdByUserId,
            lastUpdatedBy: createdByUserId
        };
        
        console.log('🔍 Creating simple item:', simpleItem);
        const item = await Inventory.create(simpleItem);
        
        res.status(201).json({ 
            success: true, 
            result: item,
            message: 'Simple inventory item created successfully'
        });
    } catch (error) {
        console.error('Simple create error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to create simple inventory item'
        });
    }
};

// Legacy aliases for backward compatibility
exports.listAll = exports.list;
exports.searchByCode = exports.search;
exports.filterByCategory = exports.filter;
