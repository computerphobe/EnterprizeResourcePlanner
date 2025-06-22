import { request } from '@/request';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const entity = 'inventory';

// Get Authorization Header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Include token for direct axios calls
const includeTokenManually = () => {
  const auth = storePersist.get('auth');
  if (auth && auth.current && auth.current.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
  }
};

// List Inventory (GET with headers)
export const getinventory = async (params = {}) => {
  try {
    includeTokenManually();
    const response = await axios.get(`${API_BASE_URL}/inventory/list`);
    
    console.log('Fetched Inventory Direct:', response.data);
    if (response.data.success && Array.isArray(response.data.result)) {
      return response.data.result.map(item => ({
        ...item,
        key: item._id, // Ensure each item has a unique key
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

// Alternative using request pattern
export const listInventory = async () => {
  try {
    const response = await request.list({ entity });
    console.log('Fetched Inventory with request:', response);
    return response;
  } catch (error) {
    console.error('Error fetching inventory (request):', error);
    return { success: false, result: [] };
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
    // Ensure GST rate is properly passed as a number
    const processedData = {
      ...data,
      gstRate: data.gstRate ? Number(data.gstRate) : 5
    };
    
    console.log('Creating inventory with GST rate:', processedData.gstRate, 'Type:', typeof processedData.gstRate);
    console.log('Full data being sent:', processedData);
    
    const response = await request.create({
      entity,
      jsonData: processedData,
      options: { headers: getAuthHeaders() },
    });
    console.log('Response after creation:', response);
    return response.result;
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

// Update Inventory (PATCH with headers)
export const updateinventory = async (id, data) => {
  try {
    // Ensure GST rate is properly passed as a number
    const processedData = {
      ...data,
      gstRate: data.gstRate ? Number(data.gstRate) : undefined
    };
    
    console.log('Updating inventory with GST rate:', processedData.gstRate, 'Type:', typeof processedData.gstRate);
    console.log('Full update data being sent:', processedData);
    
    const response = await request.update({
      entity,
      id,
      jsonData: processedData,
      options: { headers: getAuthHeaders() },
    });
    console.log('Response after update:', response);
    return response.result;
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
