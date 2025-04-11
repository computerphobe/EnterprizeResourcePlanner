import { request } from '@/request';

// Action types
export const FETCH_ORDERS_REQUEST = 'FETCH_ORDERS_REQUEST';
export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
export const FETCH_ORDERS_FAILURE = 'FETCH_ORDERS_FAILURE';
export const FETCH_RETURNS_REQUEST = 'FETCH_RETURNS_REQUEST';
export const FETCH_RETURNS_SUCCESS = 'FETCH_RETURNS_SUCCESS';
export const FETCH_RETURNS_FAILURE = 'FETCH_RETURNS_FAILURE';

// Action creators for orders
export const fetchOrdersRequest = () => ({
  type: FETCH_ORDERS_REQUEST
});

export const fetchOrdersSuccess = (orders) => ({
  type: FETCH_ORDERS_SUCCESS,
  payload: orders
});

export const fetchOrdersFailure = (error) => ({
  type: FETCH_ORDERS_FAILURE,
  payload: error
});

// Action creators for returns
export const fetchReturnsRequest = () => ({
  type: FETCH_RETURNS_REQUEST
});

export const fetchReturnsSuccess = (returns) => ({
  type: FETCH_RETURNS_SUCCESS,
  payload: returns
});

export const fetchReturnsFailure = (error) => ({
  type: FETCH_RETURNS_FAILURE,
  payload: error
});

// Async action creator for fetching orders
export const fetchOrders = () => {
  return async (dispatch) => {
    dispatch(fetchOrdersRequest());
    try {
      const response = await request.list({ entity: 'orders' });
      dispatch(fetchOrdersSuccess(response.result));
    } catch (error) {
      dispatch(fetchOrdersFailure(error.message));
    }
  };
};

// Async action creator for fetching returns
export const fetchReturns = () => {
  return async (dispatch) => {
    dispatch(fetchReturnsRequest());
    try {
      const response = await request.list({ entity: 'returns' });
      dispatch(fetchReturnsSuccess(response.result));
    } catch (error) {
      dispatch(fetchReturnsFailure(error.message));
    }  };
};