import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, Spin, message, Divider } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, CarOutlined, HistoryOutlined, FileTextOutlined, RollbackOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { getHospitalDashboardData } from '@/services/dashboardService';
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
    border-radius: 2px;  }
`;

const SummaryCard = styled(Card)`
  background: linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary});
  border-radius: 15px;
  margin-bottom: 2rem;
  .ant-card-body {
    text-align: center;
    color: white;
  }
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  .ant-statistic-content {
    color: white !important;
    font-size: 2.5rem !important;
    font-weight: bold;
  }
`;

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const { current } = useSelector(selectAuth);
    const [loading, setLoading] = useState(true);    const [dashboardData, setDashboardData] = useState({
        orders: { total: 0, completed: 0, pending: 0, completedAmount: 0, pendingAmount: 0, totalValue: 0 },
        invoices: { total: 0, paid: 0, unpaid: 0, paidAmount: 0, unpaidAmount: 0, totalValue: 0 },
        returns: { total: 0, value: 0 },
        summary: { totalRevenue: 0, pendingRevenue: 0, totalOrderValue: 0, averageOrderValue: 0 }
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const result = await getHospitalDashboardData();
                
                if (result.success) {
                    setDashboardData(result.data);
                } else {
                    message.error('Failed to load dashboard data');
                    console.error('Dashboard data fetch error:', result.error);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                message.error('Error loading dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardContainer>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: '20px', color: COLORS.lightText }}>Loading dashboard data...</p>
                </div>
            </DashboardContainer>
        );
    }return (
        <DashboardContainer>
            <DashboardTitle level={2}>Hospital Dashboard</DashboardTitle>
            
            <Spin spinning={loading}>
                <Row gutter={[24, 24]}>
                    {/* Total Orders */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Total Orders"
                                value={dashboardData.orders.total}
                                prefix={<ShoppingCartOutlined style={{ color: COLORS.primary }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/orders')}
                                style={{ marginTop: '15px' }}
                            >
                                View Orders
                            </Button>
                        </StyledCard>
                    </Col>
                      {/* Completed Orders */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Completed Orders"
                                value={dashboardData.orders.completed}
                                prefix={<CheckCircleOutlined style={{ color: COLORS.success }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/orders')}
                                style={{ marginTop: '15px' }}
                            >
                                View Completed
                            </Button>
                        </StyledCard>
                    </Col>                    {/* Pending Orders */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Pending Orders"
                                value={dashboardData.orders.pending}
                                prefix={<ClockCircleOutlined style={{ color: COLORS.warning }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/orders')}
                                style={{ marginTop: '15px' }}
                            >
                                Track Pending
                            </Button>
                        </StyledCard>
                    </Col>                    {/* Total Invoices */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Total Invoices"
                                value={dashboardData.invoices.total}
                                prefix={<FileTextOutlined style={{ color: COLORS.accent }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/salesbill')}
                                style={{ marginTop: '15px' }}
                            >
                                View Invoices
                            </Button>
                        </StyledCard>
                    </Col>                    {/* Paid Invoices */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Paid Invoices"
                                value={dashboardData.invoices.paid}
                                prefix={<DollarOutlined style={{ color: COLORS.success }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Divider />
                            <Statistic
                                title="Total Revenue"
                                value={formatCurrency(dashboardData.summary.totalRevenue)}
                                valueStyle={{ color: COLORS.success, fontSize: '1.2rem' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/salesbill')}
                                style={{ marginTop: '15px' }}
                            >
                                View Revenue
                            </Button>
                        </StyledCard>
                    </Col>                    {/* Returns */}
                    <Col xs={24} sm={12} lg={8}>
                        <StyledCard>
                            <Statistic
                                title="Total Returns"
                                value={dashboardData.returns.total}
                                prefix={<RollbackOutlined style={{ color: COLORS.secondary }} />}
                                valueStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                            />
                            <Button 
                                type="primary" 
                                onClick={() => navigate('/hospital/returns')}
                                style={{ marginTop: '15px' }}
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