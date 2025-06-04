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

const DelivererDashboard = () => {
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    pendingPickups: 0,
    confirmedPickups: 0,
    totalDelivered: 0,
  });

  // State for weekly chart data
  const [weeklyData, setWeeklyData] = useState([]);

  const fetchStats = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('auth'))?.current?.token;
      const res = await fetch('/api/deliveries/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);

      const data = await res.json();

      setStats({
        todayDeliveries: data.pickedUp + data.delivered,
        pendingPickups: data.pending || 0,
        confirmedPickups: data.pickedUp || 0,
        totalDelivered: data.delivered || 0,
      });

      // You need to get or build weekly data here.
      // For demo, let’s simulate some weekly data from fetched stats
      // You should replace this with real data from backend!

      const generatedWeeklyData = [
        { day: 'Mon', delivered: 5, confirmed: 3 },
        { day: 'Tue', delivered: 7, confirmed: 4 },
        { day: 'Wed', delivered: 6, confirmed: 5 },
        { day: 'Thu', delivered: 8, confirmed: 7 },
        { day: 'Fri', delivered: 9, confirmed: 8 },
        { day: 'Sat', delivered: 4, confirmed: 2 },
        { day: 'Sun', delivered: 3, confirmed: 1 },
      ];

      setWeeklyData(generatedWeeklyData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error.message);
      message.error('Unable to load dashboard stats.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        Deliverer Dashboard
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Today’s Deliveries</p>
            <Title level={4} style={{ color: '#1890ff' }}>
              {stats.todayDeliveries}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Pending Pickups</p>
            <Title level={4} style={{ color: '#1890ff' }}>
              {stats.pendingPickups}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Confirmed Pickups</p>
            <Title level={4} style={{ color: '#1890ff' }}>
              {stats.confirmedPickups}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined">
            <p>Total Delivered</p>
            <Title level={4} style={{ color: '#1890ff' }}>
              {stats.totalDelivered}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* Weekly Chart */}
      <Card title="Weekly Delivery Overview" variant="outlined">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={weeklyData.length ? weeklyData : []} // use weeklyData state here
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="colorDelivered"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="colorConfirmed"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#1890ff"
              fillOpacity={1}
              fill="url(#colorDelivered)"
            />
            <Area
              type="monotone"
              dataKey="confirmed"
              stroke="#52c41a"
              fillOpacity={1}
              fill="url(#colorConfirmed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DelivererDashboard;
