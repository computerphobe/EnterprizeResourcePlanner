import { request } from '@/request';

const entity = 'returns';

// Get Authorization Header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch Returns List
export const getReturns = async () => {
  console.log("fetching returns list");
  try {
    const response = await request.list({
      entity: 'returns',
      options: { headers: getAuthHeaders() }
    });
    console.log('Returns API Response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }
};

// Create a Return Entry
export const createReturn = async (data) => {
  console.log('Creating return with data:', data);
  return await request.create({
    entity,
    jsonData: data,
    options: { headers: getAuthHeaders() },
  });
};

// Mark Returned Item as Used
export const markReturnAsUsed = async (returnId, recipient) => {
  console.log('Marking return as used:', returnId, 'Recipient:', recipient);
  try {
    // Ensure recipient has required fields
    if (!recipient.name || !recipient.department) {
      throw new Error('Recipient name and department are required');
    }

    const response = await request.post({
      entity: 'returns/markAsUsed',
      jsonData: {
        returnId,
        recipient: {
          name: recipient.name,
          department: recipient.department,
          notes: recipient.notes || ''
        }
      }
    });
    console.log('Mark as used response:', response);
    return response;
  } catch (error) {
    console.error('Error marking return as used:', error);
    throw error;
  }
};
