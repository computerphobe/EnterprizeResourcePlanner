import { request } from '@/request';

const entity = 'inventory';

// Get Authorization Header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// List Inventory (GET with headers)
export const getinventory = async (params = {}) => {
  try {
    const response = await request.list({
      entity,
      options: {
        params,
        headers: getAuthHeaders(),
      },
    });

    console.log('Fetched Inventory:', response);
    if (response.success && Array.isArray(response.result)) {
      return response.result.map(item => ({
        ...item,
        key: item._id,
        status: item.quantity > 0 ? 'In Stock' : 'Out of Stock'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

// Get Inventory by ID
export const getinventoryById = async (id) => {
  try {
    return await request.get({
      entity,
      id,
      options: { headers: getAuthHeaders() },
    });
  } catch (error) {
    console.error('Error fetching inventory by ID:', error);
    return null;
  }
};

// Create Inventory (POST with headers)
export const createinventory = async (data) => {
  try {
    console.log('Creating inventory:', data);
    return await request.create({
      entity,
      jsonData: data,
      options: { headers: getAuthHeaders() },
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

// Update Inventory (PATCH with headers)
export const updateinventory = async (id, data) => {
  try {
    return await request.update({
      entity,
      id,
      jsonData: data,
      options: { headers: getAuthHeaders() },
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

// Delete Inventory (DELETE with headers)
export const deleteinventory = async (id) => {
  try {
    return await request.delete({
      entity,
      id,
      options: { headers: getAuthHeaders() },
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    throw error;
  }
};
