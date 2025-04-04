const Inventory = require('@/models/appModels/Inventory'); // Adjust path if needed
console.log('loaded inventory controller')
// ✅ List Inventory Items
exports.list = async (req, res) => {
    try {
        // console.log('Fetching inventory list...');
        // console.log('Model Name:', Inventory.modelName);
        // console.log('Collection Name:', Inventory.collection.name);

        const items = await Inventory.find({}).lean();
        // console.log('Found items:', items);

        // Map the items to ensure consistent field names
        const mappedItems = items.map(item => ({
            _id: item._id,
            itemName: item.itemName || item.name, // Handle both field names
            quantity: item.quantity,
            category: item.category || item.description, // Handle both field names
            price: item.price,
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
        const { itemName, quantity, category, price } = req.body;
        
        // Ensure required fields are present
        if (!itemName || quantity === undefined || !category || price === undefined) {
            console.log('❌ Missing required fields:', req.body);
            return res.status(400).json({ success: false, message: "Required fields are missing" });
        }

        const item = await Inventory.create({ 
            itemName, 
            quantity, 
            category, 
            price 
        });
        console.log('✅ Created Item:', item);

        res.status(201).json({ success: true, result: item });
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Update Inventory Item
exports.update = async (req, res) => {

    try {
        const item = await Inventory.findByIdAndUpdate(
            req.params.id, 
            {
                itemName: req.body.itemName,
                quantity: req.body.quantity,
                category: req.body.category,
                price: req.body.price
            }, 
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
