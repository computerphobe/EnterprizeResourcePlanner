import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Typography, Card, Steps, message } from 'antd';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const Delivery = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/doctor/deliveries', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeliveries(data.deliveries);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      message.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDelivery = (delivery) => {
    // Implement view delivery details
    console.log('View delivery:', delivery);
  };

  const columns = [
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
          pending: 'warning',
          processing: 'processing',
          in_transit: 'processing',
          delivered: 'success',
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
            onClick={() => handleViewDelivery(record)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const getDeliverySteps = (status) => {
    const steps = [
      {
        title: 'Order Placed',
        status: 'finish',
        icon: <CheckCircleOutlined />
      },
      {
        title: 'Processing',
        status: status === 'pending' ? 'wait' : 'finish',
        icon: <ClockCircleOutlined />
      },
      {
        title: 'In Transit',
        status: status === 'in_transit' ? 'process' : 
                status === 'delivered' ? 'finish' : 'wait',
        icon: <CarOutlined />
      },
      {
        title: 'Delivered',
        status: status === 'delivered' ? 'finish' : 'wait',
        icon: <CheckCircleOutlined />
      }
    ];
    return steps;
  };

  return (
    <div className="p-4">
      <Title level={2}>Delivery Tracking</Title>
      <div className="bg-white rounded-lg shadow p-6">
        <Table
          dataSource={deliveries}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card className="mt-4">
                <Steps
                  items={getDeliverySteps(record.status)}
                  current={record.status === 'pending' ? 1 :
                          record.status === 'processing' ? 1 :
                          record.status === 'in_transit' ? 2 :
                          record.status === 'delivered' ? 3 : 0}
                />
              </Card>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default Delivery; 