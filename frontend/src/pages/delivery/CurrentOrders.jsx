import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert, message, Tag } from 'antd';

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
        const response = await fetch('/api/order/current', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch current orders');
        }

        const data = await response.json();

        if (data.success) {
          setOrders(data.result || []);
        } else {
          throw new Error(data.message || 'Failed to fetch current orders');
        }
      } catch (err) {
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Marked as picked up!');
        setOrders((prev) =>
          prev.map((order) => (order._id === id ? { ...order, status: 'picked_up' } : order))
        );
      } else {
        throw new Error(data.message || 'Failed to confirm pickup.');
      }
    } catch (err) {
      message.error(err.message || 'Error marking as picked up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Marked as delivered!');
        setOrders((prev) => prev.filter((order) => order._id !== id));
      } else {
        throw new Error(data.message || 'Failed to confirm delivery.');
      }
    } catch (err) {
      message.error(err.message || 'Error marking as delivered');
    } finally {
      setActionLoading(null);
    }
  };

  // Status tag colors for better UX
  const statusColors = {
    pending: 'gold',
    picked_up: 'blue',
    completed: 'green',
    cancelled: 'red',
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 180,
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => record.doctorId?.name || '-',
    },
    {
      title: 'Hospital',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={statusColors[text] || 'default'}>
          {text.charAt(0).toUpperCase() + text.slice(1).replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) =>
        record.items?.map((item) => item.inventoryId?.name || 'Unnamed Item').join(', ') || '-',
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
              disabled={actionLoading !== null && actionLoading !== record._id}
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
              disabled={actionLoading !== null && actionLoading !== record._id}
            >
              Mark as Delivered
            </Button>
          );
        }
        return '-';
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
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
