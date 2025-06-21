import React, { useEffect, useState } from 'react';
import { Badge } from 'antd';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchOrders, fetchReturns } from '@/modules/actions/dashboardActions';

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
    <div className="admin-dashboard">
      <h2 className="dashboard-title">Admin Dashboard</h2>
      
      <div className="dashboard-card">
        <h3>Recent Orders</h3>
        {orders && orders.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                {orderColumns.map(column => (
                  <th key={column.key}>{column.title}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <Badge 
                      status={order.orderType === 'doctor' ? 'processing' : 'default'} 
                      text={order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                    />
                  </td>
                  <td>
                    {order.orderType === 'doctor' ? (
                      <span>
                        Dr. {order.doctorName}
                        <br />
                        <small>{order.hospitalName}</small>
                      </span>
                    ) : 'Admin'}
                  </td>
                  <td>
                    <button className="view-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No orders found</p>
        )}
      </div>

      <div className="dashboard-card">
        <h3>Recent Returns</h3>
        {returns && returns.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                {returnColumns.map(column => (
                  <th key={column.key}>{column.title}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(returnItem => (
                <tr key={returnItem._id}>
                  <td>{returnItem.returnNumber}</td>
                  <td>
                    <Badge 
                      status={returnItem.returnType === 'doctor' ? 'processing' : 'default'} 
                      text={returnItem.returnType.charAt(0).toUpperCase() + returnItem.returnType.slice(1)}
                    />
                  </td>
                  <td>
                    {returnItem.returnType === 'doctor' ? (
                      <span>
                        Dr. {returnItem.doctorName}
                        <br />
                        <small>{returnItem.hospitalName}</small>
                      </span>
                    ) : 'Admin'}
                  </td>
                  <td>
                    <button className="view-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No returns found</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 