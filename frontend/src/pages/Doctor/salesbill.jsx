import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Typography, Card, Row, Col, Statistic, message } from 'antd';
import { FilePdfOutlined, EyeOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const SalesBill = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    paidBills: 0,
    paidAmount: 0,
    pendingBills: 0,
    pendingAmount: 0
  });
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/doctor/sales-bills', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBills(data.bills);
        calculateSummary(data.bills);
      }
    } catch (error) {
      console.error('Error fetching sales bills:', error);
      message.error('Failed to fetch sales bills');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (bills) => {
    const summary = {
      totalBills: bills.length,
      totalAmount: 0,
      paidBills: 0,
      paidAmount: 0,
      pendingBills: 0,
      pendingAmount: 0
    };

    bills.forEach(bill => {
      summary.totalAmount += bill.totalAmount;
      if (bill.status === 'paid') {
        summary.paidBills++;
        summary.paidAmount += bill.totalAmount;
      } else {
        summary.pendingBills++;
        summary.pendingAmount += bill.totalAmount;
      }
    });

    setSummary(summary);
  };

  const handleViewBill = (bill) => {
    // Implement view bill details
    console.log('View bill:', bill);
  };

  const handleDownloadInvoice = (bill) => {
    // Implement download invoice
    console.log('Download invoice:', bill);
  };

  const columns = [
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
            onClick={() => handleViewBill(record)}
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-4">
      <Title level={2}>Sales Bills</Title>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Bills"
              value={summary.totalBills}
              prefix={<ShoppingOutlined />}
            />
            <div className="mt-2 text-gray-500">
              Total Amount: {formatCurrency(summary.totalAmount)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Paid Bills"
              value={summary.paidBills}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
            <div className="mt-2 text-gray-500">
              Paid Amount: {formatCurrency(summary.paidAmount)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Bills"
              value={summary.pendingBills}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
            <div className="mt-2 text-gray-500">
              Pending Amount: {formatCurrency(summary.pendingAmount)}
            </div>
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          dataSource={bills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default SalesBill; 