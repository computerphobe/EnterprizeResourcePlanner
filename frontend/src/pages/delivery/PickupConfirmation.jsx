import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert, message } from 'antd';

const { Title } = Typography;

const PickupConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    fetch('/api/deliveries/pickup', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch pickup orders');
        }
        return res.json();
      })
      .then(data => {
        console.log('Pickup orders fetched:', data);
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to fetch pickup orders:', err);
        message.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const confirmPickup = (id) => {
    setConfirmingId(id);
    fetch(`/api/deliveries/${id}/pickup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        setConfirmingId(null);
        if (res.ok) {
          message.success('Pickup confirmed!');
          setOrders(prev => prev.filter(order => order._id !== id));
        } else {
          message.error(data.error || 'Failed to confirm pickup.');
        }
      })
      .catch(err => {
        setConfirmingId(null);
        console.error('Error confirming pickup:', err);
        message.error('Error confirming pickup.');
      });
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',  // changed here from orderId to _id
      key: '_id',
      render: text => text || '-',
    },
    {
      title: 'Client',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text, record) => record.client?.name || record.client || '-',
    },
    {
      title: 'Address',
      dataIndex: ['pickupDetails', 'address'],
      key: 'address',
      render: (text, record) => record.pickupDetails?.address || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          loading={confirmingId === record._id}
          onClick={() => confirmPickup(record._id)}
        >
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
