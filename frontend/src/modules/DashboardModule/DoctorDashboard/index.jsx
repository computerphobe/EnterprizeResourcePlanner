import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartOutlined, RollbackOutlined } from '@ant-design/icons';
import { request } from '@/request';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalReturns: 0,
    pendingReturns: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await request.list({ entity: 'dashboard/doctor/stats' });
      if (response.success) {
        setStats(response.result);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="doctor-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
            <Button 
              type="primary" 
              onClick={() => navigate('/orders/new')}
              style={{ marginTop: 16 }}
            >
              New Order
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Returns"
              value={stats.totalReturns}
              prefix={<RollbackOutlined />}
            />
            <Button 
              type="primary" 
              onClick={() => navigate('/returns/new')}
              style={{ marginTop: 16 }}
            >
              New Return
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard; 