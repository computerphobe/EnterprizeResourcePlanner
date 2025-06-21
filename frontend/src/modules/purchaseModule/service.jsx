import { request } from '@/request';
import axios from 'axios';
import { API_BASE_URL, BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import { message } from 'antd';

const entity = 'purchases';

// Get Authorization Header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch Purchases List
export const getPurchases = async () => {
  try {
    console.log('Fetching purchases');
    const response = await request.list({ entity });
    return response;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

// Create Purchase
export const createPurchase = async (data) => {
  try {
    console.log('Creating purchase with data:', data);
    const response = await request.create({
      entity,
      jsonData: data
    });
    return response;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

export const updatePurchase = async (id, data) => {
  try {
    console.log('Updating purchase:', id, data);
    const response = await request.update({
      entity,
      id,
      jsonData: data
    });
    return response;
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
};

export const deletePurchase = async (id) => {
  try {
    console.log('Deleting purchase:', id);
    const response = await request.delete({
      entity,
      id
    });
    return response;
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
};

export const generatePurchasePDF = async (id) => {
  try {
    message.loading({ content: 'Generating PDF...', key: 'pdfGeneration' });
    console.log('Starting PDF generation for purchase:', id);
    
    // Get the auth token
    const auth = JSON.parse(localStorage.getItem('auth'));
    const token = auth?.current?.token;
    
    // Make direct axios call with responseType blob to download the PDF
    const response = await axios({
      url: `${API_BASE_URL}purchases/generatePurchaseBill/${id}`,
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Create a blob URL for the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `purchase_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    message.success({ content: 'PDF downloaded successfully', key: 'pdfGeneration' });
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    message.error({ content: 'Failed to generate PDF', key: 'pdfGeneration' });
    throw error;
  }
};