import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const CurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    const fetchCurrentOrders = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/deliveries/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch current orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentOrders();
  }, [token]);

  const handlePickup = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/deliveries/${id}/pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Pickup failed');
      }

      setOrders(prev =>
        prev.map(order =>
          order._id === id ? { ...order, status: 'picked_up' } : order
        )
      );
    } catch (err) {
      console.error('Pickup error:', err);
      alert('Failed to mark order as picked up.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/deliveries/${id}/deliver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delivery failed');
      }

      setOrders(prev => prev.filter(order => order._id !== id));
    } catch (err) {
      console.error('Delivery error:', err);
      alert('Failed to mark order as delivered.');
    } finally {
      setActionLoading(null);
    }
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Pickup Address',
      dataIndex: ['pickupDetails', 'address'],
      key: 'pickupAddress',
      render: (address) => address || '-',
    },
    {
      title: 'Delivery Address',
      dataIndex: ['deliveryDetails', 'address'],
      key: 'deliveryAddress',
      render: (address) => address || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button
            type="default"
            onClick={() => alert(`View order ${record._id}`)}
            disabled={actionLoading === record._id}
            style={{ marginRight: 8 }}
          >
            View
          </Button>
          {record.status === 'assigned' && (
            <Button
              type="warning"
              onClick={() => handlePickup(record._id)}
              loading={actionLoading === record._id}
            >
              Mark as Picked Up
            </Button>
          )}
          {record.status === 'picked_up' && (
            <Button
              type="primary"
              onClick={() => handleDeliver(record._id)}
              loading={actionLoading === record._id}
            >
              Mark as Delivered
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Current Orders</Title>
      {loading ? (
        <Alert message="Loading current orders..." type="info" />
      ) : !Array.isArray(orders) || orders.length === 0 ? (
        <Alert message="Nothing to display" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={record => record._id}
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
};

export default CurrentOrders;
