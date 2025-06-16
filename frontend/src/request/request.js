import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

import errorHandler from './errorHandler';
import successHandler from './successHandler';
import storePersist from '@/redux/storePersist';

function findKeyByPrefix(object, prefix) {
  for (var property in object) {
    if (object.hasOwnProperty(property) && property.toString().startsWith(prefix)) {
      return property;
    }
  }
}

function includeToken() {
  axios.defaults.baseURL = API_BASE_URL;

  axios.defaults.withCredentials = true;
  const auth = storePersist.get('auth');

  if (auth) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
  }
}

const request = {
  create: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/create', jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  createAndUpload: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/create', jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  read: async ({ entity, id }) => {
    try {
      includeToken();
      const response = await axios.get(entity + '/read/' + id);
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  update: async ({ entity, id, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity + '/update/' + id, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  updateAndUpload: async ({ entity, id, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity + '/update/' + id, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  delete: async ({ entity, id }) => {
    try {
      includeToken();
      const response = await axios.delete(entity + '/delete/' + id);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  filter: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let filter = options.filter ? 'filter=' + options.filter : '';
      let equal = options.equal ? '&equal=' + options.equal : '';
      let query = `?${filter}${equal}`;

      const response = await axios.get(entity + '/filter' + query);
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  search: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);
      // headersInstance.cancelToken = source.token;
      const response = await axios.get(entity + '/search' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  list: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);

      const response = await axios.get(entity + '/list' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  listAll: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);

      const response = await axios.get(entity + '/listAll' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  post: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity, jsonData);

      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  get: async ({ entity }) => {
    try {
      includeToken();
      const response = await axios.get(entity);
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  patch: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  upload: async ({ entity, id, jsonData }) => {
    try {
      includeToken();
      const response = await axios.patch(entity + '/upload/' + id, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  // Dashboard/financial data methods
  getDashboard: async () => {
    try {
      includeToken();
      const response = await axios.get('/dashboard');
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  getDashboardStats: async () => {
    try {
      includeToken();
      const response = await axios.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  getRecentActivities: async () => {
    try {
      includeToken();
      const response = await axios.get('/dashboard/recent-activities');
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  getFinancialData: async () => {
    try {
      includeToken();
      const response = await axios.get('/dashboard/financial-data');
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  // Ledger entry methods
  getLedgerEntries: async (params = {}) => {
    try {
      includeToken();
      console.log('Getting ledger entries with params:', params);
      
      try {
        const response = await axios.get('/dashboard/ledger', { params });
        console.log('getLedgerEntries success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: false,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        // Fallback to alternative path
        console.log('Trying alternative path for getLedgerEntries');
        console.error('Primary path error:', error.message);
        const response = await axios.get('/ledger', { params });
        console.log('getLedgerEntries fallback success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: false,
          notifyOnFailed: true,
        });
        return response.data;
      }
    } catch (error) {
      console.error('Final getLedgerEntries error:', error);
      return errorHandler(error);
    }
  },
  
  createLedgerEntry: async (data) => {
    try {
      includeToken();
      console.log('Creating ledger entry with data:', data);
      
      try {
        const response = await axios.post('/dashboard/ledger', data);
        console.log('createLedgerEntry success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        // Fallback to alternative path
        console.log('Trying alternative path for createLedgerEntry');
        console.error('Primary path error:', error.message);
        const response = await axios.post('/ledger', data);
        console.log('createLedgerEntry fallback success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: true,
        });
        return response.data;
      }
    } catch (error) {
      console.error('Final createLedgerEntry error:', error);
      return errorHandler(error);
    }
  },
  
  updateLedgerEntry: async (id, data) => {
    try {
      includeToken();
      console.log('Updating ledger entry with id:', id, 'and data:', data);
      
      if (!id) {
        console.error('Update failed: ID is undefined or null');
        return {
          success: false,
          result: null,
          message: 'Cannot update: Entry ID is missing'
        };
      }
      
      try {
        const response = await axios.put(`/dashboard/ledger/${id}`, data);
        console.log('updateLedgerEntry success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        // Fallback to alternative path
        console.log('Trying alternative path for updateLedgerEntry');
        console.error('Primary path error:', error.message);
        
        try {
          const response = await axios.put(`/ledger/${id}`, data);
          console.log('updateLedgerEntry fallback success response:', response.data);
          successHandler(response, {
            notifyOnSuccess: true,
            notifyOnFailed: true,
          });
          return response.data;
        } catch (fallbackError) {
          console.error('Fallback path failed:', fallbackError.message);
          
          // As a last resort, try with /api prefix
          console.log('Trying last resort path with /api prefix');
          const response = await axios.put(`/api/ledger/${id}`, data);
          console.log('updateLedgerEntry last resort response:', response.data);
          successHandler(response, {
            notifyOnSuccess: true,
            notifyOnFailed: true,
          });
          return response.data;
        }
      }
    } catch (error) {
      console.error('Final updateLedgerEntry error:', error);
      return errorHandler(error);
    }
  },
  
  deleteLedgerEntry: async (id) => {
    try {
      includeToken();
      console.log('Deleting ledger entry with id:', id);
      
      if (!id) {
        console.error('Delete failed: ID is undefined or null');
        return {
          success: false,
          result: null,
          message: 'Cannot delete: Entry ID is missing'
        };
      }
      
      try {
        const response = await axios.delete(`/dashboard/ledger/${id}`);
        console.log('deleteLedgerEntry success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        // Fallback to alternative path
        console.log('Trying alternative path for deleteLedgerEntry');
        console.error('Primary path error:', error.message);
        
        try {
          const response = await axios.delete(`/ledger/${id}`);
          console.log('deleteLedgerEntry fallback success response:', response.data);
          successHandler(response, {
            notifyOnSuccess: true,
            notifyOnFailed: true,
          });
          return response.data;
        } catch (fallbackError) {
          console.error('Fallback path failed:', fallbackError.message);
          
          // As a last resort, try with /api prefix
          console.log('Trying last resort path with /api prefix');
          const response = await axios.delete(`/api/ledger/${id}`);
          console.log('deleteLedgerEntry last resort response:', response.data);
          successHandler(response, {
            notifyOnSuccess: true,
            notifyOnFailed: true,
          });
          return response.data;
        }
      }
    } catch (error) {
      console.error('Final deleteLedgerEntry error:', error);
      return errorHandler(error);
    }
  },

  source: () => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    return source;
  },

  summary: async ({ entity, options = {} }) => {
    try {
      includeToken();
      let query = '?';
      for (var key in options) {
        query += key + '=' + options[key] + '&';
      }
      query = query.slice(0, -1);
      const response = await axios.get(entity + '/summary' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });

      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  mail: async ({ entity, jsonData }) => {
    try {
      includeToken();
      const response = await axios.post(entity + '/mail/', jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  convert: async ({ entity, id }) => {
    try {
      includeToken();
      const response = await axios.get(`${entity}/convert/${id}`);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  // Enhanced methods with params and option handling
  get: async (endpoint, options = {}) => {
    try {
      includeToken();
      const response = await axios.get(endpoint, options);
      successHandler(response, {
        notifyOnSuccess: options.notifyOnSuccess || false,
        notifyOnFailed: options.notifyOnFailed || false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  post: async (endpoint, data = {}, options = {}) => {
    try {
      includeToken();
      const response = await axios.post(endpoint, data, options);
      successHandler(response, {
        notifyOnSuccess: options.notifyOnSuccess || true,
        notifyOnFailed: options.notifyOnFailed || true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  put: async (endpoint, data = {}, options = {}) => {
    try {
      includeToken();
      const response = await axios.put(endpoint, data, options);
      successHandler(response, {
        notifyOnSuccess: options.notifyOnSuccess || true,
        notifyOnFailed: options.notifyOnFailed || true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  
  delete: async (endpoint, options = {}) => {
    try {
      includeToken();
      const response = await axios.delete(endpoint, options);
      successHandler(response, {
        notifyOnSuccess: options.notifyOnSuccess || true,
        notifyOnFailed: options.notifyOnFailed || true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  // Test methods for debugging
  testCreateLedgerEntry: async (data) => {
    try {
      includeToken();
      console.log('Testing ledger entry creation with data:', data);
      
      try {
        const response = await axios.post('/test/ledger', data);
        console.log('testCreateLedgerEntry success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        console.error('Test ledger entry creation error:', error.message);
        // Mock a successful response for client-side testing
        const mockResponse = {
          success: true,
          result: {
            _id: 'mock_' + Date.now(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          message: 'Mock ledger entry created successfully'
        };
        successHandler({ data: mockResponse }, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return mockResponse;
      }
    } catch (error) {
      console.error('Final testCreateLedgerEntry error:', error);
      return errorHandler(error);
    }
  },
  
  testUpdateLedgerEntry: async (id, data) => {
    try {
      includeToken();
      console.log('Testing ledger entry update with id:', id, 'and data:', data);
      
      if (!id) {
        console.error('Test update failed: ID is undefined or null');
        return {
          success: false,
          result: null,
          message: 'Cannot update: Entry ID is missing'
        };
      }
      
      try {
        const response = await axios.put(`/test/ledger/${id}`, data);
        console.log('testUpdateLedgerEntry success response:', response.data);
        successHandler(response, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return response.data;
      } catch (error) {
        console.error('Test ledger entry update error:', error.message);
        // Mock a successful response for client-side testing
        const mockResponse = {
          success: true,
          result: {
            _id: id,
            ...data,
            updatedAt: new Date()
          },
          message: 'Mock ledger entry updated successfully'
        };
        successHandler({ data: mockResponse }, {
          notifyOnSuccess: true,
          notifyOnFailed: false,
        });
        return mockResponse;
      }
    } catch (error) {
      console.error('Final testUpdateLedgerEntry error:', error);
      return errorHandler(error);
    }
  },
};
export default request;
