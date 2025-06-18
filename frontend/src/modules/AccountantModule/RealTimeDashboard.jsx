import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Tabs, Spin, message, Statistic, Space, Typography, Alert } from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useMoney } from '@/settings';
import { request } from '@/request';
import moment from 'moment';

const { Title, Text } = Typography;

function RealTimeDashboard() {
  const { moneyFormatter } = useMoney();
  
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    revenue: { total: 0, pending: 0, collected: 0 },
    expenses: { total: 0 },
    invoices: { total: 0, paid: 0, pending: 0, draft: 0 },
    payments: { total: 0, totalAmount: 0 },
    orders: { total: 0, completed: 0, pending: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Try to get comprehensive financial summary first
      let summaryData = null;
      try {
        const summaryResponse = await request.getFinancialSummary();
        if (summaryResponse && summaryResponse.success) {
          summaryData = summaryResponse.result;
          console.log('✅ Financial summary loaded:', summaryData);
        }
      } catch (error) {
        console.log('⚠️ Financial summary not available, using fallback method');
      }

      if (summaryData) {
        setDashboardStats({
          revenue: summaryData.revenue || { total: 0, pending: 0, collected: 0 },
          expenses: summaryData.expenses || { total: 0 },
          invoices: summaryData.invoices || { total: 0, paid: 0, pending: 0, draft: 0 },
          payments: summaryData.payments || { total: 0, totalAmount: 0 },
          orders: summaryData.orders || { total: 0, completed: 0, pending: 0 },
          profit: summaryData.profit || { net: 0 }
        });
      } else {
        // Fallback to individual endpoint calls
        console.log('🔄 Falling back to individual API calls...');
        const [invoicesRes, ordersRes, paymentsRes] = await Promise.all([
          request.summary({ entity: 'invoice' }),
          request.summary({ entity: 'order' }),
          request.summary({ entity: 'payment' })
        ]);

        const invoiceStats = invoicesRes?.result || {};
        const orderStats = ordersRes?.result || {};
        const paymentStats = paymentsRes?.result || {};

        setDashboardStats({
          revenue: {
            total: (invoiceStats.totalPaid || 0) + (orderStats.totalValue || 0),
            pending: invoiceStats.totalPending || 0,
            collected: invoiceStats.totalPaid || 0
          },
          expenses: { total: 0 },
          invoices: {
            total: invoiceStats.total || 0,
            paid: invoiceStats.paid || 0,
            pending: invoiceStats.pending || 0,
            draft: invoiceStats.draft || 0
          },
          payments: {
            total: paymentStats.total || 0,
            totalAmount: paymentStats.totalAmount || 0
          },
          orders: {
            total: orderStats.total || 0,
            completed: orderStats.completed || 0,
            pending: orderStats.pending || 0
          }
        });
      }

      setLastRefresh(new Date());
      console.log('✅ Dashboard stats updated successfully');    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      message.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activities (transactions)
  const fetchRecentActivities = async () => {
    try {
      console.log('🔄 Fetching recent activities...');
      
      const [recentInvoices, recentPayments, recentOrders] = await Promise.all([
        request.list({ entity: 'invoice', options: { limit: 3, sort: '-updatedAt' } }),
        request.list({ entity: 'payment', options: { limit: 3, sort: '-updatedAt' } }),
        request.list({ entity: 'order', options: { limit: 3, sort: '-updatedAt' } })
      ]);

      const activities = [];

      // Add invoices
      if (recentInvoices?.result?.items) {
        recentInvoices.result.items.forEach(invoice => {
          activities.push({
            id: `invoice-${invoice._id}`,
            type: 'Invoice',
            action: invoice.status === 'paid' ? 'Invoice Paid' : 'Invoice Created',
            description: `Invoice #${invoice.number || invoice._id?.slice(-6)}`,
            amount: invoice.total || 0,
            status: invoice.status,
            date: invoice.updatedAt || invoice.createdAt,
            client: invoice.client?.company || invoice.client?.name || 'Unknown Client',
            icon: <FileTextOutlined />,
            color: invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'orange' : 'blue'
          });
        });
      }

      // Add payments
      if (recentPayments?.result?.items) {
        recentPayments.result.items.forEach(payment => {
          activities.push({
            id: `payment-${payment._id}`,
            type: 'Payment',
            action: 'Payment Recorded',
            description: `Payment of ${moneyFormatter({ amount: payment.amount })}`,
            amount: payment.amount || 0,
            status: 'completed',
            date: payment.updatedAt || payment.createdAt,
            client: payment.client?.company || payment.client?.name || 'Unknown Client',
            icon: <BankOutlined />,
            color: 'green'
          });
        });
      }

      // Add orders
      if (recentOrders?.result?.items) {
        recentOrders.result.items.forEach(order => {
          activities.push({
            id: `order-${order._id}`,
            type: 'Order',
            action: order.status === 'completed' ? 'Order Completed' : 'Order Updated',
            description: `Order #${order.number || order._id?.slice(-6)}`,
            amount: order.totalAmount || 0,
            status: order.status,
            date: order.updatedAt || order.createdAt,
            client: order.client?.company || order.client?.name || 'Unknown Client',
            icon: <ShoppingOutlined />,
            color: order.status === 'completed' ? 'green' : order.status === 'pending' ? 'orange' : 'blue'
          });
        });
      }

      // Sort by date (most recent first) and take top 10
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 10));
        console.log('✅ Recent activities loaded:', activities.length, 'items');

    } catch (error) {
      console.error('❌ Error fetching recent activities:', error);
      message.error('Failed to load recent activities');
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered...');
    message.loading('Refreshing dashboard...', 0.5);
    
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivities()
    ]);
    
    message.success('Dashboard refreshed successfully!');
  };
  // Initial data load
  useEffect(() => {
    console.log('🚀 Dashboard initializing...');
    
    const initDashboard = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivities()
      ]);
    };
    
    initDashboard();
  }, []); // Empty dependency array to run only once

  // Activity table columns
  const activityColumns = [
    {
      title: 'Activity',
      dataIndex: 'action',
      key: 'action',
      render: (action, record) => (
        <Space>
          {record.icon}
          <Text strong>{action}</Text>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          {moneyFormatter({ amount: amount || 0 })}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.color}>
          {status?.toUpperCase() || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Time',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <Text type="secondary">
          {moment(date).format('MMM DD, HH:mm')}
        </Text>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Accountant Dashboard
          </Title>
          <Text type="secondary">
            Last updated: {moment(lastRefresh).format('MMM DD, YYYY HH:mm:ss')}
          </Text>
        </Col>
        <Col>
          <Button 
            type="primary"
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh Data
          </Button>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={dashboardStats.revenue?.total || 0}
              formatter={value => moneyFormatter({ amount: value })}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Revenue"
              value={dashboardStats.revenue?.pending || 0}
              formatter={value => moneyFormatter({ amount: value })}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={dashboardStats.invoices?.total || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Net Profit"
              value={dashboardStats.profit?.net || (dashboardStats.revenue?.total - dashboardStats.expenses?.total) || 0}
              formatter={value => moneyFormatter({ amount: value })}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card title="Invoice Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Paid" value={dashboardStats.invoices?.paid || 0} />
              </Col>
              <Col span={12}>
                <Statistic title="Pending" value={dashboardStats.invoices?.pending || 0} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Order Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Completed" value={dashboardStats.orders?.completed || 0} />
              </Col>
              <Col span={12}>
                <Statistic title="Pending" value={dashboardStats.orders?.pending || 0} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Payment Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Count" value={dashboardStats.payments?.total || 0} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Amount" 
                  value={dashboardStats.payments?.totalAmount || 0}
                  formatter={value => moneyFormatter({ amount: value })}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Recent Activities
          </Space>
        }
        extra={
          <Tag color="blue">Live Updates</Tag>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={recentActivities}
            columns={activityColumns}
            rowKey="id"
            pagination={false}
            size="middle"
            locale={{
              emptyText: 'No recent activities. Create an invoice or record a payment to see updates here.'
            }}
          />
        </Spin>
      </Card>

      {/* Instructions Alert */}
      <Alert
        message="Real-Time Dashboard"
        description="This dashboard updates immediately when you create invoices, record payments, or update orders. Use the 'Refresh Data' button to manually update if needed."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
}

export default RealTimeDashboard;
