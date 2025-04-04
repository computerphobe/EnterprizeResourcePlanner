import React, { useEffect, useState } from 'react';
import { Badge } from 'antd';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchOrders, fetchReturns } from '../../actions/dashboardActions';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { orders, returns } = useSelector((state) => state.dashboard);
  const [orderColumns, setOrderColumns] = useState([]);
  const [returnColumns, setReturnColumns] = useState([]);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchReturns());
  }, [dispatch]);

  useEffect(() => {
    const orderColumns = [
      {
        title: 'Order Number',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
      },
      {
        title: 'Type',
        dataIndex: 'orderType',
        key: 'orderType',
        render: (type) => (
          <Badge 
            status={type === 'doctor' ? 'processing' : 'default'} 
            text={type.charAt(0).toUpperCase() + type.slice(1)}
          />
        ),
      },
      {
        title: 'Source',
        dataIndex: 'doctorName',
        key: 'source',
        render: (doctorName, record) => (
          record.orderType === 'doctor' ? 
          <span>
            Dr. {doctorName}
            <br />
            <small>{record.hospitalName}</small>
          </span> : 
          'Admin'
        ),
      },
    ];

    const returnColumns = [
      {
        title: 'Return Number',
        dataIndex: 'returnNumber',
        key: 'returnNumber',
      },
      {
        title: 'Type',
        dataIndex: 'returnType',
        key: 'returnType',
        render: (type) => (
          <Badge 
            status={type === 'doctor' ? 'processing' : 'default'} 
            text={type.charAt(0).toUpperCase() + type.slice(1)}
          />
        ),
      },
      {
        title: 'Source',
        dataIndex: 'doctorName',
        key: 'source',
        render: (doctorName, record) => (
          record.returnType === 'doctor' ? 
          <span>
            Dr. {doctorName}
            <br />
            <small>{record.hospitalName}</small>
          </span> : 
          'Admin'
        ),
      },
    ];

    setOrderColumns(orderColumns);
    setReturnColumns(returnColumns);
  }, []);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default AdminDashboard; 