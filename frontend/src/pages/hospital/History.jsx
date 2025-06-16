import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, message } from 'antd';
import { EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const History = () => {
  const [history, setHistory] = useState({
    orders: [],
    deliveries: [],
    salesBills: []
  });
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    if (!token) return setLoading(false);

    try {
      const [ordersRes, deliveriesRes, salesBillsRes] = await Promise.all([
        fetch('/api/hospital/orders/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/hospital/deliveries/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/hospital/sales-bills/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!ordersRes.ok || !deliveriesRes.ok || !salesBillsRes.ok) {
        throw new Error('Failed to fetch history data');
      }

      const [ordersData, deliveriesData, salesBillsData] = await Promise.all([
        ordersRes.json(),
        deliveriesRes.json(),
        salesBillsRes.json()
      ]);

      if (ordersData.success && deliveriesData.success && salesBillsData.success) {
        setHistory({
          orders: ordersData.result || [],
          deliveries: deliveriesData.result || [],
          salesBills: salesBillsData.result || []
        });
      } else {
        throw new Error('Failed to fetch history data');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch history data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record, type) => {
    // TODO: Implement view details
    console.log('View details:', record, type);
  };

  const handleGeneratePDF = (record, type) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF:', record, type);
  };

  const orderColumns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'completed') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'order')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'order')}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const deliveryColumns = [
    {
      title: 'Delivery ID',
      dataIndex: 'deliveryId',
      key: 'deliveryId',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'delivered') color = 'green';
        else if (status === 'in_transit') color = 'blue';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'delivery')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'delivery')}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const salesBillColumns = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'paid') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'salesBill')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'salesBill')}
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
      key: '1',
      label: 'Order History',
      children: (
        <Table
          dataSource={history.orders}
          columns={orderColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Delivery History',
      children: (
        <Table
          dataSource={history.deliveries}
          columns={deliveryColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Sales Bill History',
      children: (
        <Table
          dataSource={history.salesBills}
          columns={salesBillColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>History</Title>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </div>
  );
};

export default History; 