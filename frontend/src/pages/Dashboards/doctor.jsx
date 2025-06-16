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

const DoctorDashboard = () => {
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
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/doctor/metrics', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setMetrics(data.metrics);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <DashboardContainer>
            <DashboardTitle level={2}>Doctor Dashboard</DashboardTitle>
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
                                onClick={() => navigate('/doctor/orders')}
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
                                onClick={() => navigate('/doctor/salesbill')}
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
                                onClick={() => navigate('/doctor/delivery')}
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
                                onClick={() => navigate('/doctor/history')}
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
                                onClick={() => navigate('/doctor/returns')}
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

export default DoctorDashboard;