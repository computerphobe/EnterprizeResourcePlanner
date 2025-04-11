import * as actionTypes from './types';
import * as authService from '@/auth';
import { request } from '@/request';

export const login = ({ loginData, navigate }) => async (dispatch) => {
  dispatch({ type: actionTypes.REQUEST_LOADING });
  console.log('Login process started');

  try {
    const data = await authService.login({ loginData });
    console.log("Login response data:", data);

    if (data && data.success === true && data.result) {
      const authPayload = data.result;
      console.log("Auth payload for reducer:", authPayload);

      // Save to localStorage for persistence
      const authState = {
        current: authPayload,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      localStorage.setItem('auth', JSON.stringify(authState));
      localStorage.removeItem('isLogout');

      // Important: Store token for API calls
      if (authPayload.token) {
        localStorage.setItem('token', authPayload.token);
      }

      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: authPayload,
      });
      
      // Handle navigation based on role after state is updated
      const role = authPayload.role;
      console.log('Role-based navigation:', role);
      if (role && navigate) {
        // Properly handle navigation through React Router
        switch (role) {
          case 'doctor':
            navigate('/doctor');
            break;
          case 'hospital':
            navigate('/hospital');
            break;
          case 'distributor':
            navigate('/distributor');
            break;
          case 'deliverer':
            navigate('/deliverer');
            break;
          case 'owner':
          case 'admin':
            navigate('/'); // Default admin dashboard
            break;
          default:
            navigate('/');
        }
      }
    } else {
      console.error('Login failed - invalid/missing data:', data);
      dispatch({ type: actionTypes.REQUEST_FAILED });
    }
  } catch (error) {
    console.error('Login error:', error);
    dispatch({ type: actionTypes.REQUEST_FAILED });
  }
};
export const register =
  ({ registerData }) =>
  async (dispatch) => {
    dispatch({ type: actionTypes.REQUEST_LOADING });

    const data = await authService.register({ registerData });

    if (data.success === true) {
      dispatch({ type: actionTypes.REGISTER_SUCCESS });
    } else {
      dispatch({ type: actionTypes.REQUEST_FAILED });
    }
  };

export const verify =
  ({ userId, emailToken }) =>
  async (dispatch) => {
    dispatch({ type: actionTypes.REQUEST_LOADING });

    const data = await authService.verify({ userId, emailToken });

    if (data.success === true && data.result) {
      const authPayload = data.result;

      const authState = {
        current: authPayload,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      localStorage.setItem('auth', JSON.stringify(authState));
      localStorage.removeItem('isLogout');

      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: authPayload,
      });
    } else {
      dispatch({ type: actionTypes.REQUEST_FAILED });
    }
  };

export const resetPassword =
  ({ resetPasswordData }) =>
  async (dispatch) => {
    dispatch({ type: actionTypes.REQUEST_LOADING });

    const data = await authService.resetPassword({ resetPasswordData });

    if (data.success === true && data.result) {
      const authPayload = data.result;

      const authState = {
        current: authPayload,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      localStorage.setItem('auth', JSON.stringify(authState));
      localStorage.removeItem('isLogout');

      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: authPayload,
      });
    } else {
      dispatch({ type: actionTypes.REQUEST_FAILED });
    }
  };

export const logout = () => async (dispatch) => {
  dispatch({ type: actionTypes.LOGOUT_SUCCESS });

  const result = localStorage.getItem('auth');
  const tmpAuth = JSON.parse(result);
  const settings = localStorage.getItem('settings');
  const tmpSettings = JSON.parse(settings);

  localStorage.removeItem('auth');
  localStorage.removeItem('settings');
  localStorage.setItem('isLogout', JSON.stringify({ isLogout: true }));

  const data = await authService.logout();

  if (data.success === false) {
    const authState = {
      current: tmpAuth,
      isLoggedIn: true,
      isLoading: false,
      isSuccess: true,
    };
    localStorage.setItem('auth', JSON.stringify(authState));
    localStorage.setItem('settings', JSON.stringify(tmpSettings));
    localStorage.removeItem('isLogout');

    dispatch({
      type: actionTypes.LOGOUT_FAILED,
      payload: data.result,
    });
  }
};

export const updateProfile =
  ({ entity, jsonData }) =>
  async (dispatch) => {
    const data = await request.updateAndUpload({ entity, id: '', jsonData });

    if (data.success === true && data.result) {
      dispatch({
        type: actionTypes.REQUEST_SUCCESS,
        payload: data.result,
      });

      const authState = {
        current: data.result,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      localStorage.setItem('auth', JSON.stringify(authState));
    }
  };
