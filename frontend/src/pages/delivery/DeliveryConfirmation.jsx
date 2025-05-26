import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const DeliveryConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) return setLoading(false);

    fetch('/api/deliveries/pending-delivery', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery orders', err);
        setLoading(false);
      });
  }, [token]);

  const confirmDelivery = (id) => {
    fetch(`/api/deliveries/${id}/deliver`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) {
          alert('Delivery confirmed!');
          setOrders(prev => prev.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm delivery.');
        }
      })
      .catch(err => console.error('Error confirming delivery:', err));
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
        <Button type="primary" onClick={() => confirmDelivery(record._id)}>
          Confirm Delivery
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Delivery Confirmation</Title>
      {loading ? (
        <Alert message="Loading delivery confirmations..." type="info" />
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

export default DeliveryConfirmation;
