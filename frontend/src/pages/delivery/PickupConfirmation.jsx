import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const PickupConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) return setLoading(false);

    fetch('/api/deliveries/pickup', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch pickup orders', err);
        setLoading(false);
      });
  }, [token]);

  const confirmPickup = (id) => {
    fetch(`/api/deliveries/${id}/pickup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) {
          alert('Pickup confirmed!');
          setOrders(prev => prev.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm pickup.');
        }
      })
      .catch(err => console.error('Error confirming pickup:', err));
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: 'id',
    },
    {
      title: 'Client',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (_, record) => record.client?.name || record.client || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => confirmPickup(record._id)}>
          Confirm Pickup
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Pickup Confirmation</Title>
      {loading ? (
        <Alert message="Loading pickup orders..." type="info" />
      ) : orders.length === 0 ? (
        <Alert message="Nothing to display" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={record => record._id}
          pagination={false}
        />
      )}
    </div>
  );
};

export default PickupConfirmation;
