import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Typography, Card, Row, Col, Statistic } from 'antd';
import { ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const Delivery = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  const statusColors = {
    pending: 'gold',
    picked_up: 'blue',
    in_transit: 'processing',
    delivered: 'success',
    cancelled: 'error'
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/hospital/deliveries', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeliveries(data.deliveries);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 180,
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) =>
        record.items?.map((item) => item.name).join(', ') || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={statusColors[text] || 'default'}>
          {text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Tag>
      ),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Deliverer',
      dataIndex: 'delivererName',
      key: 'delivererName',
    },
    {
      title: 'Contact',
      dataIndex: 'delivererContact',
      key: 'delivererContact',
    },
  ];

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'picked_up');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit');

  return (
    <div className="p-4">
      <Title level={2}>Delivery Tracking</Title>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Deliveries"
              value={pendingDeliveries.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="In Transit"
              value={inTransitDeliveries.length}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={completedDeliveries.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={deliveries.length}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          dataSource={deliveries}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default Delivery; 