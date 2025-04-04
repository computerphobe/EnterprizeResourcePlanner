import { request } from '@/request';

const entity = 'suppliers';

// Get Authorization Header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch Suppliers List
export const getSuppliers = async () => {
  try {
    console.log('Fetching suppliers');
    const response = await request.list({ entity });
    return response;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

// Create Supplier
export const createSupplier = async (data) => {
  try {
    console.log('Creating supplier with data:', data);
    const response = await request.create({
      entity,
      jsonData: data
    });
    return response;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

// Add update supplier function
export const updateSupplier = async (id, data) => {
  try {
    console.log('Updating supplier:', id, data);
    const response = await request.update({
      entity,
      id,
      jsonData: data
    });
    return response;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

// Add delete supplier function
export const deleteSupplier = async (id) => {
  try {
    console.log('Deleting supplier:', id);
    const response = await request.delete({
      entity,
      id
    });
    return response;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
}; 