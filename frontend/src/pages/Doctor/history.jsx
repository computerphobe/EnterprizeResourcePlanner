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
        fetch('/api/doctor/sales-bills', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/doctor/deliveries-history', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/doctor/orders-history', {
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

  const handleViewDetails = (record, type) => {
    // Implement view details functionality
    console.log('View details:', record, type);
  };

  const handleDownloadInvoice = (record) => {
    // Implement download invoice functionality
    console.log('Download invoice:', record);
  };

  const salesbillColumns = [
    {
      title: 'Bill ID',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
        </span>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          paid: 'success',
          pending: 'warning',
          cancelled: 'error'
        };
        return (
          <Tag color={statusColors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'salesbill')}
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadInvoice(record)}
          >
            Invoice
          </Button>
        </Space>
      )
    }
  ];

  const deliveriesColumns = [
    {
      title: 'Delivery ID',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          delivered: 'success',
          in_transit: 'processing',
          pending: 'warning',
          cancelled: 'error'
        };
        return (
          <Tag color={statusColors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'delivery')}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const ordersColumns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
        </span>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          completed: 'success',
          processing: 'processing',
          pending: 'warning',
          cancelled: 'error'
        };
        return (
          <Tag color={statusColors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'order')}
          >
            View
          </Button>
        </Space>
      )
    }
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
      <Title level={2}>History</Title>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="salesbill" items={items} />
      </div>
    </div>
  );
};

export default History; 