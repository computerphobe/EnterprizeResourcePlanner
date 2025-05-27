import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert, message } from 'antd';

const { Title } = Typography;

const CurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/deliveries/current', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch current orders');
        }

        const data = await response.json();
        console.log('Fetched current orders:', data);

        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to fetch current orders:', err);
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handlePickup = async (id) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Marked as picked up!');
        setOrders((prev) =>
          prev.map((order) =>
            order._id === id ? { ...order, status: 'picked_up' } : order
          )
        );
      } else {
        message.error(data.error || 'Failed to confirm pickup.');
      }
    } catch (err) {
      console.error('Pickup error:', err);
      message.error('Error marking as picked up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/deliver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Marked as delivered!');
        setOrders((prev) => prev.filter((order) => order._id !== id));
      } else {
        message.error(data.error || 'Failed to confirm delivery.');
      }
    } catch (err) {
      console.error('Delivery error:', err);
      message.error('Error marking as delivered');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => record.client?.name || record.client || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1), // Capitalize
    },
    {
      title: 'Pickup Address',
      key: 'pickup',
      render: (_, record) => record.pickupDetails?.address || '-',
    },
    {
      title: 'Delivery Address',
      key: 'delivery',
      render: (_, record) => record.deliveryDetails?.address || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'pending') {
          return (
            <Button
              type="default"
              onClick={() => handlePickup(record._id)}
              loading={actionLoading === record._id}
            >
              Mark as Picked Up
            </Button>
          );
        } else if (record.status === 'picked_up') {
          return (
            <Button
              type="primary"
              onClick={() => handleDeliver(record._id)}
              loading={actionLoading === record._id}
            >
              Mark as Delivered
            </Button>
          );
        } else {
          return '-';
        }
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Current Orders</Title>
      {loading ? (
        <Alert message="Loading current orders..." type="info" />
      ) : orders.length === 0 ? (
        <Alert message="No current orders to display" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
};

export default CurrentOrders;
