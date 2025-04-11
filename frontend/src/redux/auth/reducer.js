import * as actionTypes from './types';

const INITIAL_STATE = {
  current: null,
  isLoggedIn: false,
  isLoading: false,
  isSuccess: false,
};

const authReducer = (state = INITIAL_STATE, action) => {
  console.log('authReducer action:', action);

  switch (action.type) {
    case actionTypes.REQUEST_LOADING:
      return {
        ...state,
        isLoggedIn: false,
        isLoading: true,
        isSuccess: false,
      };

    case actionTypes.REQUEST_SUCCESS:
      console.log("payload received by reducer:", action.payload);
      return {
        current: action.payload,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };

    case actionTypes.REQUEST_FAILED:
      return {
        ...INITIAL_STATE,
        isLoading: false,
      };

    case actionTypes.REGISTER_SUCCESS:
      return {
        current: null,
        isLoggedIn: false,
        isLoading: false,
        isSuccess: true,
      };

    case actionTypes.LOGOUT_SUCCESS:
      return INITIAL_STATE;

    case actionTypes.LOGOUT_FAILED:
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
};

export default authReducer;