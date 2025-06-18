import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, Spin } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, CarOutlined, HistoryOutlined, FileTextOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import styled from 'styled-components';

const { Title } = Typography;

// Color constants
const COLORS = {
    primary: '#2c3e50',
    secondary: '#34495e',
    accent: '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    text: '#2c3e50',
    lightText: '#7f8c8d',
    background: '#ecf0f1',
    cardBg: '#ffffff'
};

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${COLORS.background};
  padding: 2rem;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  background: ${COLORS.cardBg};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .ant-statistic-title {
    font-size: 1.1rem;
    color: ${COLORS.lightText};
    margin-bottom: 1rem;
  }

  .ant-statistic-content {
    font-size: 1.8rem;
    color: ${COLORS.text};
  }

  .ant-btn {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    background: ${COLORS.accent};
    border-color: ${COLORS.accent};
    
    &:hover {
      transform: translateY(-2px);
      background: ${COLORS.secondary};
      border-color: ${COLORS.secondary};
    }
  }
`;

const DashboardTitle = styled(Title)`
  color: ${COLORS.primary} !important;
  margin-bottom: 2rem !important;
  font-weight: 600 !important;
  text-align: center;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background: ${COLORS.accent};
    border-radius: 2px;
  }
`;

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const { current } = useSelector(selectAuth);
    const token = current?.token || '';
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        paidOrders: 0,
        paidAmount: 0,
        pendingOrders: 0,
        pendingAmount: 0,
        returns: 0
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const [ordersRes, returnsRes] = await Promise.all([
                    fetch('/api/hospital/orders', {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch('/api/hospital/returns', {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);
                
                if (!ordersRes.ok || !returnsRes.ok) {
                    throw new Error('Failed to fetch metrics');
                }
                
                const [ordersData, returnsData] = await Promise.all([
                    ordersRes.json(),
                    returnsRes.json()
                ]);
                
                if (ordersData.success) {
                    const orders = ordersData.result || [];
                    const paidOrders = orders.filter(order => order.status === 'completed');
                    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing');
                    
                    const paidAmount = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                    const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                    
                    setMetrics(prev => ({
                        ...prev,
                        paidOrders: paidOrders.length,
                        paidAmount,
                        pendingOrders: pendingOrders.length,
                        pendingAmount
                    }));
                }

                if (returnsData.success) {
                    const returns = returnsData.returns || [];
                    setMetrics(prev => ({
                        ...prev,
                        returns: returns.length
                    }));
                }
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchMetrics();
        }
    }, [token]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <DashboardContainer>
            <DashboardTitle level={2}>Hospital Dashboard</DashboardTitle>
            
            <Spin spinning={loading} size="large">
                <Row gutter={[24, 24]} className="mb-6">
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Paid Orders"
                                value={metrics.paidOrders}
                                prefix={<ShoppingCartOutlined style={{ color: COLORS.success }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/orders')}
                            >
                                View Orders
                            </Button>
                        </StyledCard>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Paid Amount"
                                value={formatCurrency(metrics.paidAmount)}
                                prefix={<DollarOutlined style={{ color: COLORS.accent }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/salesbill')}
                            >
                                View Sales Bills
                            </Button>
                        </StyledCard>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Pending Orders"
                                value={metrics.pendingOrders}
                                prefix={<ShoppingCartOutlined style={{ color: COLORS.warning }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/delivery')}
                            >
                                Track Delivery
                            </Button>
                        </StyledCard>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Pending Amount"
                                value={formatCurrency(metrics.pendingAmount)}
                                prefix={<DollarOutlined style={{ color: COLORS.warning }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/history')}
                            >
                                View History
                            </Button>
                        </StyledCard>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Total Returns"
                                value={metrics.returns}
                                prefix={<RollbackOutlined style={{ color: COLORS.secondary }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/returns')}
                            >
                                Manage Returns
                            </Button>
                        </StyledCard>
                    </Col>
                </Row>
            </Spin>
        </DashboardContainer>
    );
};

export default HospitalDashboard;