import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const entity = 'productinventory';

// 🔐 Get token from localStorage or Redux-persisted auth
const getToken = () => {
  const tokenFromStorage = localStorage.getItem('token');
  const tokenFromPersist = storePersist.get('auth')?.current?.token;
  return tokenFromStorage || tokenFromPersist || null;
};

// 📦 Standard headers
const getHeaders = (isJson = true) => {
  const token = getToken();
  const headers = {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return headers;
};

// 🚨 Enhanced error handling
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ✅ GET inventory list with advanced filtering
export const listInventory = async (options = {}) => {
  try {
    const {
      category,
      lowStock,
      active = true,
      page = 1,
      limit = 50,
      search,
      stockStatus,
      minPrice,
      maxPrice,
      supplier,
      location,
      unit,
      gstRate
    } = options;

    const params = new URLSearchParams();
    
    if (category && category !== 'all') params.append('category', category);
    if (lowStock) params.append('lowStock', lowStock);
    if (active !== undefined) params.append('active', active);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (stockStatus) params.append('stockStatus', stockStatus);
    if (minPrice !== undefined) params.append('minPrice', minPrice);
    if (maxPrice !== undefined) params.append('maxPrice', maxPrice);
    if (supplier) params.append('supplier', supplier);
    if (location) params.append('location', location);
    if (unit) params.append('unit', unit);
    if (gstRate !== undefined) params.append('gstRate', gstRate);

    const url = `${API_BASE_URL}${entity}/list${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error listing inventory:', error);
    return { 
      success: false, 
      result: [], 
      message: error.message || 'Failed to fetch inventory items'
    };
  }
};

// ✅ GET inventory list (legacy support)
export const getinventory = async () => {
  try {
    const result = await listInventory();
    
    if (result.success && Array.isArray(result.result)) {
      return result.result.map(item => ({ ...item, key: item._id }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

// ✅ GET inventory item by ID
export const getInventoryById = async (id) => {
  try {
    if (!id) {
      throw new Error('Inventory item ID is required');
    }

    const response = await fetch(`${API_BASE_URL}${entity}/read/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching inventory by ID:', error);
    return { 
      success: false, 
      result: null, 
      message: error.message || 'Failed to fetch inventory item'
    };
  }
};

// ✅ POST new inventory item
export const createInventory = async (data) => {
  try {
    if (!data.itemName || data.quantity === undefined || !data.category || data.price === undefined) {
      throw new Error('Item name, quantity, category, and price are required');
    }

    const processedData = {
      ...data,
      quantity: Number(data.quantity) || 0,
      price: Number(data.price) || 0,
      gstRate: data.gstRate ? Number(data.gstRate) : 5,
      minimumStock: data.minimumStock ? Number(data.minimumStock) : 10,
      maximumStock: data.maximumStock ? Number(data.maximumStock) : 1000,
      // Clean string fields
      itemName: data.itemName?.trim(),
      productCode: data.productCode?.trim(),
      nameAlias: data.nameAlias?.trim(),
      material: data.material?.trim(),
      manufacturer: data.manufacturer?.trim(),
      description: data.description?.trim(),
      batchNumber: data.batchNumber?.trim(),
      location: data.location?.trim(),
      supplier: data.supplier?.trim()
    };

    console.log('🔍 Sending create request:', processedData);

    const response = await fetch(`${API_BASE_URL}${entity}/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(processedData),
    });

    console.log('🔍 Create response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 Create error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      } catch (parseError) {
        throw new Error(errorText || `HTTP ${response.status}`);
      }
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw new Error(error.message || 'Failed to create inventory item');
  }
};

// Temporary simple create function for debugging
export const createInventorySimple = async (data) => {
  try {
    const simpleData = {
      itemName: data.itemName,
      quantity: Number(data.quantity) || 0,
      category: data.category,
      price: Number(data.price) || 0
    };

    console.log('🔍 Creating simple inventory:', simpleData);
    console.log('🔍 Token check:', getToken());

    const response = await fetch(`${API_BASE_URL}${entity}/createSimple`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(simpleData),
    });

    console.log('🔍 Simple response status:', response.status);
    const text = await response.text();
    console.log('🔍 Simple response text:', text);
    
    const result = JSON.parse(text);
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
    
    return result.result;
  } catch (error) {
    console.error('Error creating simple inventory:', error);
    throw new Error(error.message || 'Failed to create inventory item');
  }
};

// ✅ PATCH update inventory item
export const updateinventory = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Inventory item ID is required');
    }

    const processedData = {
      ...data,
      // Convert numeric fields
      ...(data.quantity !== undefined && { quantity: Number(data.quantity) }),
      ...(data.price !== undefined && { price: Number(data.price) }),
      ...(data.gstRate !== undefined && { gstRate: Number(data.gstRate) }),
      ...(data.minimumStock !== undefined && { minimumStock: Number(data.minimumStock) }),
      ...(data.maximumStock !== undefined && { maximumStock: Number(data.maximumStock) }),
      // Clean string fields
      ...(data.itemName && { itemName: data.itemName.trim() }),
      ...(data.productCode && { productCode: data.productCode.trim() }),
      ...(data.nameAlias && { nameAlias: data.nameAlias.trim() }),
      ...(data.material && { material: data.material.trim() }),
      ...(data.manufacturer && { manufacturer: data.manufacturer.trim() }),
      ...(data.description && { description: data.description.trim() }),
      ...(data.batchNumber && { batchNumber: data.batchNumber.trim() }),
      ...(data.location && { location: data.location.trim() }),
      ...(data.supplier && { supplier: data.supplier.trim() })
    };

    const response = await fetch(`${API_BASE_URL}${entity}/update/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(processedData),
    });

    const result = await handleResponse(response);
    return result.result;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw new Error(error.message || 'Failed to update inventory item');
  }
};

// ✅ DELETE inventory item (soft delete)
export const deleteinventory = async (id) => {
  try {
    if (!id) {
      throw new Error('Inventory item ID is required');
    }

    const response = await fetch(`${API_BASE_URL}${entity}/delete/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting inventory:', error);
    throw new Error(error.message || 'Failed to delete inventory item');
  }
};

// ✅ Search inventory items
export const searchInventory = async (searchTerm, options = {}) => {
  try {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const params = new URLSearchParams({
      q: searchTerm,
      ...(options.category && { category: options.category }),
      ...(options.limit && { limit: options.limit })
    });

    const url = `${API_BASE_URL}${entity}/search?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error searching inventory:', error);
    return { 
      success: false, 
      result: [], 
      message: error.message || 'Failed to search inventory items'
    };
  }
};

// ✅ Filter inventory items
export const filterInventory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const url = `${API_BASE_URL}${entity}/filter${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error filtering inventory:', error);
    return { 
      success: false, 
      result: [], 
      message: error.message || 'Failed to filter inventory items'
    };
  }
};

// ✅ Get inventory summary/dashboard
export const getInventorySummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${entity}/summary`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await handleResponse(response);
    return result.result || result; // Handle both wrapped and unwrapped responses
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    // Return a default summary structure instead of throwing
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      inStockItems: 0,
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
  }
};

// ✅ Update stock quantity
export const updateStock = async (id, quantityChange, reason = 'Manual adjustment') => {
  try {
    if (!id) {
      throw new Error('Inventory item ID is required');
    }

    if (!quantityChange || quantityChange === 0) {
      throw new Error('Quantity change is required and must not be zero');
    }

    const response = await fetch(`${API_BASE_URL}${entity}/updateStock/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ quantityChange, reason }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating stock:', error);
    throw new Error(error.message || 'Failed to update stock');
  }
};

// ✅ Get low stock items
export const getLowStockItems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${entity}/lowStock`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting low stock items:', error);
    return { 
      success: false, 
      result: [], 
      message: error.message || 'Failed to get low stock items'
    };
  }
};

// 🔄 Bulk operations
export const bulkUpdateInventory = async (updates) => {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }

    const results = await Promise.allSettled(
      updates.map(({ id, data }) => updateinventory(id, data))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: failed === 0,
      successful,
      failed,
      results,
      message: `Bulk update completed: ${successful} successful, ${failed} failed`
    };
  } catch (error) {
    console.error('Error in bulk update:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to perform bulk update'
    };
  }
};

export const bulkDeleteInventory = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs array is required');
    }

    const results = await Promise.allSettled(
      ids.map(id => deleteinventory(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: failed === 0,
      successful,
      failed,
      results,
      message: `Bulk delete completed: ${successful} successful, ${failed} failed`
    };
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to perform bulk delete'
    };
  }
};

// 📊 Analytics functions
export const getInventoryAnalytics = async (timeRange = '30d') => {
  try {
    // This would typically be a separate endpoint, but for now we'll use summary
    const summary = await getInventorySummary();
    
    if (!summary.success) {
      throw new Error(summary.message);
    }

    return {
      success: true,
      result: {
        ...summary.result,
        timeRange,
        trends: {
          // Placeholder for trend data
          stockMovement: [],
          categoryGrowth: [],
          lowStockHistory: []
        }
      },
      message: 'Analytics data retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting inventory analytics:', error);
    return { 
      success: false, 
      result: null, 
      message: error.message || 'Failed to get inventory analytics'
    };
  }
};

// Legacy exports for backward compatibility
export const createinventory = createInventory;
export const getInventory = getinventory;
export const updateInventory = updateinventory;
export const deleteInventory = deleteinventory;
export const getinventorysummary = getInventorySummary;
