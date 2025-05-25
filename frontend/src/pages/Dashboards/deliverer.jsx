import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, message } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

const sampleData = [
  { day: 'Mon', delivered: 10, confirmed: 7 },
  { day: 'Tue', delivered: 12, confirmed: 9 },
  { day: 'Wed', delivered: 14, confirmed: 11 },
  { day: 'Thu', delivered: 11, confirmed: 9 },
  { day: 'Fri', delivered: 18, confirmed: 14 },
  { day: 'Sat', delivered: 8, confirmed: 5 },
  { day: 'Sun', delivered: 6, confirmed: 4 },
];

const DelivererDashboard = () => {
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    pendingPickups: 0,
    confirmedPickups: 0,
    totalDelivered: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/current-orders'); // Change this to your API
      if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch current orders:', error.message);
      message.error('Unable to load order stats. Please check your permissions or login.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <Title level={2} style={{ marginBottom: 16 }}>Deliverer Dashboard</Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Today’s Deliveries</p>
            <Title level={4} style={{ color: '#1890ff' }}>{stats.todayDeliveries || 14}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Pending Pickups</p>
            <Title level={4} style={{ color: '#1890ff' }}>{stats.pendingPickups || 3}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Confirmed Pickups</p>
            <Title level={4} style={{ color: '#1890ff' }}>{stats.confirmedPickups || 11}</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Total Delivered</p>
            <Title level={4} style={{ color: '#1890ff' }}>{stats.totalDelivered || 87}</Title>
          </Card>
        </Col>
      </Row>

      {/* Weekly Chart */}
      <Card title="Weekly Delivery Overview" variant="outlined">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sampleData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area type="monotone" dataKey="delivered" stroke="#1890ff" fillOpacity={1} fill="url(#colorDelivered)" />
            <Area type="monotone" dataKey="confirmed" stroke="#52c41a" fillOpacity={1} fill="url(#colorConfirmed)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DelivererDashboard;
