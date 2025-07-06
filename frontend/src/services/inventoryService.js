import request from '@/request/request';

const API_BASE_URL = '/api';
const entity = 'productinventory'; // ✅ Fixed: Use the correct endpoint that matches backend routes

// 🌟 SHARED INVENTORY SERVICE
// This service can be imported by any module that needs inventory access

/**
 * Get all inventory items with optional filtering
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Array>} Array of inventory items
 */
export const getInventoryList = async (params = {}) => {
  try {
    console.log('🔍 [SharedInventoryService] Fetching inventory list...');
    
    const queryParams = new URLSearchParams({
      active: 'true',
      limit: '1000', // Get all items by default
      ...params
    }).toString();
    
    const response = await request.list({
      entity,
      options: {
        params: queryParams
      }
    });

    if (!response || !response.success) {
      throw new Error(response?.message || 'Failed to fetch inventory');
    }

    console.log(`✅ [SharedInventoryService] Fetched ${response.result?.length || 0} inventory items`);
    return response.result || [];
  } catch (error) {
    console.error('❌ [SharedInventoryService] Error fetching inventory:', error);
    throw error;
  }
};

/**
 * Get inventory items by category
 * @param {string} category - Category to filter by
 * @returns {Promise<Array>} Array of inventory items
 */
export const getInventoryByCategory = async (category) => {
  return getInventoryList({ category });
};

/**
 * Get single inventory item by ID
 * @param {string} id - Inventory item ID
 * @returns {Promise<Object>} Inventory item
 */
export const getInventoryById = async (id) => {
  try {
    console.log(`🔍 [SharedInventoryService] Fetching inventory item: ${id}`);
    
    const response = await request.read({
      entity,
      id
    });

    if (!response || !response.success) {
      throw new Error(response?.message || 'Failed to fetch inventory item');
    }

    console.log(`✅ [SharedInventoryService] Fetched inventory item: ${response.result?.itemName}`);
    return response.result;
  } catch (error) {
    console.error('❌ [SharedInventoryService] Error fetching inventory item:', error);
    throw error;
  }
};

/**
 * Search inventory items by name, code, or description
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching inventory items
 */
export const searchInventory = async (searchTerm) => {
  return getInventoryList({ search: searchTerm });
};

/**
 * Get low stock inventory items
 * @returns {Promise<Array>} Array of low stock items
 */
export const getLowStockItems = async () => {
  return getInventoryList({ lowStock: 'true' });
};

/**
 * Get inventory items available for orders (active items with stock > 0)
 * @returns {Promise<Array>} Array of available inventory items
 */
export const getAvailableInventoryForOrders = async () => {
  try {
    const items = await getInventoryList({ active: 'true' });
    
    // Filter items that have stock available
    const availableItems = items.filter(item => 
      item.quantity > 0 && item.isActive !== false
    );
    
    console.log(`✅ [SharedInventoryService] Found ${availableItems.length} available items for orders`);
    return availableItems;
  } catch (error) {
    console.error('❌ [SharedInventoryService] Error fetching available inventory:', error);
    throw error;
  }
};

/**
 * Get inventory summary/statistics
 * @returns {Promise<Object>} Inventory summary
 */
export const getInventorySummary = async () => {
  try {
    console.log('🔍 [SharedInventoryService] Fetching inventory summary...');
    
    const response = await request.summary({ entity });

    if (!response || !response.success) {
      throw new Error(response?.message || 'Failed to fetch inventory summary');
    }

    console.log('✅ [SharedInventoryService] Fetched inventory summary');
    return response.result;
  } catch (error) {
    console.error('❌ [SharedInventoryService] Error fetching inventory summary:', error);
    throw error;
  }
};

/**
 * Update inventory stock (for order processing)
 * @param {string} id - Inventory item ID
 * @param {number} quantityChange - Change in quantity (positive or negative)
 * @returns {Promise<Object>} Updated inventory item
 */
export const updateInventoryStock = async (id, quantityChange) => {
  try {
    console.log(`🔍 [SharedInventoryService] Updating stock for item ${id} by ${quantityChange}`);
    
    // First get current item
    const currentItem = await getInventoryById(id);
    const newQuantity = Math.max(0, currentItem.quantity + quantityChange);
    
    const response = await request.update({
      entity,
      id,
      jsonData: { quantity: newQuantity }
    });

    if (!response || !response.success) {
      throw new Error(response?.message || 'Failed to update inventory stock');
    }

    console.log(`✅ [SharedInventoryService] Updated stock: ${currentItem.quantity} → ${newQuantity}`);
    return response.result;
  } catch (error) {
    console.error('❌ [SharedInventoryService] Error updating inventory stock:', error);
    throw error;
  }
};

// Export commonly used functions with shorter names for convenience
export const getInventory = getInventoryList;
export const getInventoryItems = getInventoryList;

// Export for backward compatibility
export const getinventory = getInventoryList;

export default {
  getInventoryList,
  getInventoryByCategory,
  getInventoryById,
  searchInventory,
  getLowStockItems,
  getAvailableInventoryForOrders,
  getInventorySummary,
  updateInventoryStock,
  // Convenience exports
  getInventory: getInventoryList,
  getInventoryItems: getInventoryList,
  getinventory: getInventoryList
};
