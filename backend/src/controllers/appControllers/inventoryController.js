const Inventory = require('@/models/appModels/Inventory'); // Use the updated Inventory model
console.log('loaded inventory controller')
// ✅ List Inventory Items
exports.list = async (req, res) => {
    try {
        console.log('🟢 Inventory list endpoint hit by user:', req.user?.role);
        console.log('🟢 Model Name:', Inventory.modelName);
        console.log('🟢 Collection Name:', Inventory.collection.name);

        const items = await Inventory.find({}).lean();
        console.log('🟢 Found items count:', items.length);
        console.log('🟢 Sample item:', items[0]);        // Return the complete item data - all fields from Inventory
        const mappedItems = items.map(item => ({
            _id: item._id,
            itemName: item.itemName,
            quantity: item.quantity,
            category: item.category,
            price: item.price,
            productCode: item.productCode,
            nameAlias: item.nameAlias,
            material: item.material,
            gstRate: item.gstRate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        res.json({
            success: true,
            result: mappedItems,
            message: mappedItems.length === 0 ? "Collection is Empty" : "Items retrieved",
        });
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Create Inventory Item
exports.create = async (req, res) => {

    try {
        const { itemName, quantity, category, price, productCode, nameAlias, material, gstRate } = req.body;
        
        console.log('🔍 RAW REQUEST BODY:', req.body);
        console.log('🔍 GST RATE FROM REQUEST:', gstRate, 'TYPE:', typeof gstRate);
        
        // Ensure required fields are present
        if (!itemName || quantity === undefined || !category || price === undefined) {
            console.log('❌ Missing required fields:', req.body);
            return res.status(400).json({ success: false, message: "Required fields are missing" });
        }

        // Validate GST rate
        if (gstRate !== undefined && ![5, 12].includes(Number(gstRate))) {
            console.log('❌ Invalid GST rate:', gstRate);
            return res.status(400).json({ success: false, message: "GST rate must be either 5% or 12%" });
        }

        // Provide default values for fields not present in the simple inventory form
        const itemData = {
            itemName,
            quantity: Number(quantity),
            category,
            price: Number(price),
            productCode: productCode || `PROD-${Date.now()}`,
            nameAlias: nameAlias || itemName,
            material: material || 'N/A',
            gstRate: gstRate ? Number(gstRate) : 5, // Use provided GST rate or default to 5
        };

        console.log('✅ Creating inventory item with data:', itemData);
        console.log('✅ FINAL GST RATE TO SAVE:', itemData.gstRate);
        const item = await Inventory.create(itemData);
        console.log('✅ Created Item with GST Rate:', item.gstRate);

        res.status(201).json({ success: true, result: item });
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Update Inventory Item
exports.update = async (req, res) => {
    try {
        const { itemName, quantity, category, price, productCode, nameAlias, material, gstRate } = req.body;
        
        console.log('🔍 UPDATE - RAW REQUEST BODY:', req.body);
        console.log('🔍 UPDATE - GST RATE FROM REQUEST:', gstRate, 'TYPE:', typeof gstRate);
        
        // Validate GST rate if provided
        if (gstRate !== undefined && ![5, 12].includes(Number(gstRate))) {
            console.log('❌ Invalid GST rate:', gstRate);
            return res.status(400).json({ success: false, message: "GST rate must be either 5% or 12%" });
        }

        // Prepare update data
        const updateData = {
            itemName,
            quantity: Number(quantity),
            category,
            price: Number(price),
            productCode,
            nameAlias,
            material,
            gstRate: gstRate !== undefined ? Number(gstRate) : undefined
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        console.log('✅ Updating inventory item with data:', updateData);
        const item = await Inventory.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({ success: true, result: item });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Delete Inventory Item
exports.delete = async (req, res) => {
    console.log('Deleting inventory item...', req.params.id);

    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) {
            console.log('❌ Item not found:', req.params.id);
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        console.log('✅ Deleted Item:', item);
        res.json({ success: true, result: item });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Alias listAll to list
exports.listAll = exports.list;
