import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Card, Row, Col, Statistic } from 'antd';
import { FilePdfOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, ShoppingOutlined, CarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const History = () => {
  const [history, setHistory] = useState({
    salesbill: [],
    deliveries: [],
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Fetch all history data
      const [salesbillRes, deliveriesRes, ordersRes] = await Promise.all([
        fetch('/api/hospital/sales-bills', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/hospital/deliveries-history', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/hospital/orders-history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [salesbillData, deliveriesData, ordersData] = await Promise.all([
        salesbillRes.json(),
        deliveriesRes.json(),
        ordersRes.json()
      ]);

      setHistory({
        salesbill: salesbillData.success ? salesbillData.bills : [],
        deliveries: deliveriesData.success ? deliveriesData.deliveries : [],
        orders: ordersData.success ? ordersData.orders : []
      });
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (type, record) => {
    // TODO: Implement view details functionality
    console.log(`View ${type} details:`, record);
  };

  const handleDownloadPDF = (type, record) => {
    // TODO: Implement PDF download functionality
    console.log(`Download ${type} PDF:`, record);
  };

  const salesbillColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          paid: 'green',
          pending: 'orange',
          cancelled: 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails('salesbill', record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPDF('salesbill', record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const deliveriesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          delivered: 'green',
          in_transit: 'blue',
          pending: 'orange',
          cancelled: 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails('delivery', record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPDF('delivery', record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const ordersColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          completed: 'green',
          processing: 'blue',
          pending: 'orange',
          cancelled: 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails('order', record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPDF('order', record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: 'salesbill',
      label: 'Sales Bill History',
      children: (
        <Table
          dataSource={history.salesbill}
          columns={salesbillColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'deliveries',
      label: 'Deliveries History',
      children: (
        <Table
          dataSource={history.deliveries}
          columns={deliveriesColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'orders',
      label: 'Orders History',
      children: (
        <Table
          dataSource={history.orders}
          columns={ordersColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <Title level={2}>Hospital History Dashboard</Title>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Sales Bills"
              value={history.salesbill.length}
              prefix={<FilePdfOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Deliveries"
              value={history.deliveries.length}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Orders"
              value={history.orders.length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="salesbill" items={items} />
      </div>
    </div>
  );
};

export default History; 