import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message, Input, Card, Row, Col, Statistic } from 'antd';
import { RollbackOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bills, setBills] = useState([]);
  const [selectedBillItems, setSelectedBillItems] = useState([]);
  const [form] = Form.useForm();
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchReturns();
    fetchBills();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/hospital/returns', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReturns(data.returns);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/hospital/bills', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBills(data.bills);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      message.error('Failed to load bills');
    }
  };

  const fetchBillItems = async (billId) => {
    try {
      const response = await fetch(`/api/hospital/bills/${billId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedBillItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching bill items:', error);
    }
  };

  const handleCreateReturn = () => {
    setIsModalVisible(true);
  };

  const handleBillChange = (billId) => {
    if (billId) {
      fetchBillItems(billId);
    } else {
      setSelectedBillItems([]);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await fetch('/api/hospital/returns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (data.success) {
        message.success('Return request created successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchReturns();
      } else {
        message.error(data.message || 'Failed to create return request');
      }
    } catch (error) {
      console.error('Error creating return:', error);
      message.error('Failed to create return request');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedBillItems([]);
  };

  const columns = [
    {
      title: 'Return ID',
      dataIndex: 'returnId',
      key: 'returnId',
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'gold',
          approved: 'green',
          rejected: 'red',
          completed: 'blue'
        };
        return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<RollbackOutlined />}
            onClick={() => handleViewReturn(record)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ];

  const handleViewReturn = (record) => {
    // Implement view return details functionality
    console.log('View return:', record);
  };

  const pendingReturns = returns.filter(ret => ret.status === 'pending');
  const approvedReturns = returns.filter(ret => ret.status === 'approved');
  const completedReturns = returns.filter(ret => ret.status === 'completed');

  const items = [
    {
      key: '1',
      label: 'All Returns',
      children: (
        <Table
          dataSource={returns}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Pending Returns',
      children: (
        <Table
          dataSource={pendingReturns}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Approved Returns',
      children: (
        <Table
          dataSource={approvedReturns}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '4',
      label: 'Completed Returns',
      children: (
        <Table
          dataSource={completedReturns}
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
        <Title level={2}>Hospital Returns</Title>
        <Button 
          type="primary" 
          icon={<RollbackOutlined />}
          onClick={handleCreateReturn}
          size="large"
        >
          Create Return
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Returns"
              value={returns.length}
              prefix={<RollbackOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Returns"
              value={pendingReturns.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Approved Returns"
              value={approvedReturns.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>

      <Modal
        title="Create Return Request"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="billId"
            label="Bill ID"
            rules={[{ required: true, message: 'Please select a bill' }]}
          >
            <Select 
              placeholder="Select a bill"
              onChange={handleBillChange}
            >
              {bills.map(bill => (
                <Select.Option key={bill._id} value={bill._id}>
                  {bill.billNumber} - ₹{bill.totalAmount}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="items"
            label="Select Items to Return (Max 2)"
            rules={[
              { required: true, message: 'Please select items to return' },
              { type: 'array', max: 2, message: 'You can select maximum 2 items' }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select items to return"
              maxTagCount={2}
              disabled={!selectedBillItems.length}
            >
              {selectedBillItems.map(item => (
                <Select.Option key={item._id} value={item._id}>
                  {item.name} - ₹{item.price}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="Return Reason"
            rules={[{ required: true, message: 'Please enter return reason' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter return reason" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Return Amount"
            rules={[{ required: true, message: 'Please enter return amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="₹"
              placeholder="Enter return amount"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Returns; 