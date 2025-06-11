import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, message } from 'antd';
import { EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const SalesBill = () => {
  const [salesBills, setSalesBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchSalesBills();
  }, [token]);

  const fetchSalesBills = async () => {
    if (!token) return setLoading(false);

    try {
      const response = await fetch('/api/hospital/sales-bills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales bills');
      }
      
      const data = await response.json();
      if (data.success) {
        setSalesBills(data.result || []);
      } else {
        throw new Error(data.message || 'Failed to fetch sales bills');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch sales bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bill) => {
    // TODO: Implement view bill details
    console.log('View bill:', bill);
  };

  const handleGeneratePDF = (bill) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF for bill:', bill);
  };

  const columns = [
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
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const paidBills = salesBills.filter(bill => bill.status === 'paid');
  const pendingBills = salesBills.filter(bill => bill.status === 'pending');

  const items = [
    {
      key: '1',
      label: 'All Bills',
      children: (
        <Table
          dataSource={salesBills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Paid Bills',
      children: (
        <Table
          dataSource={paidBills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Pending Bills',
      children: (
        <Table
          dataSource={pendingBills}
          columns={columns}
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
        <Title level={2}>Sales Bills</Title>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </div>
  );
};

export default SalesBill; 