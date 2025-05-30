import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Typography, message, Select } from 'antd';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;
const { Option } = Select;

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/order/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data.result || []);
    } catch (error) {
      message.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch deliverers
  const fetchDeliverers = async () => {
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const delivererUsers = data.result.filter((user) => user.role === 'deliverer');
      setDeliverers(delivererUsers);
    } catch (error) {
      message.error(error.message || 'Failed to load deliverers');
    }
  };

  // Assign a deliverer to an order
  const assignDelivererToOrder = async (orderId, delivererId) => {
    try {
      const res = await fetch(`/api/order/${orderId}/assignDelivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delivererId }),
      });
      console.log(res);
      const data = await res.json();
      console.log(data);
      if (!data.success) throw new Error(data.message);
      message.success('Deliverer assigned successfully');
      fetchOrders(); // Refresh orders
    } catch (error) {
      message.error(error.message || 'Failed to assign deliverer');
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchDeliverers();
    }
  }, [token]);

  const columns = [
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
        <Tag color={type === 'doctor' ? 'volcano' : 'geekblue'}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Doctor Name',
      dataIndex: ['doctorId', 'name'],
      key: 'doctorName',
      render: (_, record) => record.doctorName || '—',
    },
    {
      title: 'Hospital Name',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      render: (text) => text || '—',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'pending') color = 'gold';
        else if (status === 'processing') color = 'blue';
        else if (status === 'completed') color = 'green';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Assign Deliverer',
      key: 'assignDeliverer',
      render: (text, record) => (
        <Select
          style={{ width: 180 }}
          placeholder="Select Deliverer"
          onChange={(value) => assignDelivererToOrder(record._id, value)}
          disabled={!!record.delivererId} // Disable if already assigned
          defaultValue={record.delivererId ? record.delivererId._id : undefined}
        >
          {deliverers.map((d) => (
            <Option key={d._id} value={d._id}>
              {d.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Orders Management</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default OrderList;
