import { API_BASE_URL } from '@/config/serverApiConfig';
import axios from 'axios';
import errorHandler from '@/request/errorHandler';
import successHandler from '@/request/successHandler';

export const login = async ({ loginData }) => {
  try {
    console.log('Making login request with:', loginData);
    const response = await axios.post(
      API_BASE_URL + `login?timestamp=${new Date().getTime()}`,
      loginData
    );

    const { status, data } = response;
    console.log('Auth response:', data);
    
    // Notify success/failure
    successHandler(
      { data, status },
      {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      }
    );
    
    if (data?.success === true && data?.result) {
      // Log the data structure to understand where role is stored
      console.log('Auth success - checking role location:', {
        directRole: data?.result?.role,
        nestedRole: data?.result?.user?.role
      });
        // Figure out where the role is stored in the response
      const role = data?.result?.role || data?.result?.user?.role;
      console.log('Determined user role:', role);
      
      // We'll let the Redux actions handle routing
      // No more direct window.location redirects here
      // This prevents race conditions and infinite loops
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return errorHandler(error);
  }
};

export const register = async ({ registerData }) => {
  console.log('auth.service.js registerData', registerData);
  try {
    const response = await axios.post(API_BASE_URL + `register`, registerData);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const verify = async ({ userId, emailToken }) => {
  try {
    const response = await axios.get(API_BASE_URL + `verify/${userId}/${emailToken}`);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const resetPassword = async ({ resetPasswordData }) => {
  try {
    const response = await axios.post(API_BASE_URL + `resetpassword`, resetPasswordData);

    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const logout = async () => {
  axios.defaults.withCredentials = true;
  try {
    const response = await axios.post(API_BASE_URL + `logout?timestamp=${new Date().getTime()}`);
    const { status, data } = response;

    successHandler(
      { data, status },
      {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      }
    );
    return data;
  } catch (error) {
    return errorHandler(error);
  }
};
