import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const entity = 'inventory';

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

// ✅ GET inventory list
export const getinventory = async () => {
  try {
    const url = `${API_BASE_URL}${entity}/list`;
    console.log('🔍 Fetching inventory from URL:', url);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Entity:', entity);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });    const result = await response.json();
    console.log('🔍 API Response:', result);
    
    if (result.success && Array.isArray(result.result)) {
      console.log('✅ Successfully fetched', result.result.length, 'inventory items');
      return result.result.map(item => ({ ...item, key: item._id }));
    }
    
    console.warn('⚠️ API returned success:false or invalid data:', result);
    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

// ✅ GET inventory item by ID
export const getInventoryById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}${entity}/read/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory by ID:', error);
    return null;
  }
};

// ✅ POST new inventory item
export const createinventory = async (data) => {
  try {
    const processedData = {
      ...data,
      gstRate: data.gstRate ? Number(data.gstRate) : 5
    };

    const response = await fetch(`${API_BASE_URL}${entity}/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(processedData),
    });

    const result = await response.json();
    console.log('Inventory created:', result);
    return result.result;
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

// ✅ PATCH update inventory item
export const updateinventory = async (id, data) => {
  try {
    const processedData = {
      ...data,
      gstRate: data.gstRate ? Number(data.gstRate) : undefined
    };    const response = await fetch(`${API_BASE_URL}${entity}/update/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(processedData),
    });

    const result = await response.json();
    console.log('Inventory updated:', result);
    return result.result;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

// ✅ DELETE inventory item
export const deleteinventory = async (id) => {
  try {    const response = await fetch(`${API_BASE_URL}${entity}/delete/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return await response.json();
  } catch (error) {
    console.error('Error deleting inventory:', error);
    throw error;
  }
};
