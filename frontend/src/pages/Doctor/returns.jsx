import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message } from 'antd';
import { RollbackOutlined, EyeOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [form] = Form.useForm();
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchReturns();
    fetchOrders();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/doctor/returns', {
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
      message.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/doctor/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
    }
  };

  const handleCreateReturn = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const returnData = {
        orderId: values.orderId,
        items: values.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          reason: item.reason
        })),
        reason: values.reason,
        status: 'pending',
        doctorId: current?.id,
        doctorName: current?.name,
        hospitalName: current?.hospitalName
      };

      const response = await fetch('/api/doctor/returns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(returnData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create return');
      }
      
      const data = await response.json();
      
      if (data.success) {
        message.success('Return request created successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchReturns();
      } else {
        throw new Error(data.message || 'Failed to create return request');
      }
    } catch (error) {
      console.error('Error creating return:', error);
      message.error(error.message || 'Failed to create return request');
    }
  };

  const handleViewReturn = (returnItem) => {
    // Implement view return details
    console.log('View return:', returnItem);
  };

  const columns = [
    {
      title: 'Return ID',
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
          {items.map(item => `${item.name} (${item.quantity})`).join(', ')}
        </span>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'warning',
          approved: 'processing',
          completed: 'success',
          rejected: 'error'
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
            onClick={() => handleViewReturn(record)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const pendingReturns = returns.filter(item => item.status === 'pending');
  const approvedReturns = returns.filter(item => item.status === 'approved');
  const completedReturns = returns.filter(item => item.status === 'completed');

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
        <Title level={2}>Doctor Returns</Title>
        <Button 
          type="primary" 
          icon={<RollbackOutlined />}
          onClick={handleCreateReturn}
          size="large"
        >
          Create Return
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>

      <Modal
        title="Create Return Request"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="orderId"
            label="Select Order"
            rules={[{ required: true, message: 'Please select an order' }]}
          >
            <Select
              placeholder="Select an order"
              options={orders.map(order => ({
                value: order._id,
                label: `Order #${order._id.slice(-6)} - ${new Date(order.createdAt).toLocaleDateString()}`
              }))}
            />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      rules={[{ required: true, message: 'Missing item' }]}
                    >
                      <Select
                        placeholder="Select item"
                        style={{ width: 200 }}
                        options={orders
                          .find(order => order._id === form.getFieldValue('orderId'))?.items
                          .map(item => ({
                            value: item._id,
                            label: item.name
                          }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Missing quantity' }]}
                    >
                      <InputNumber min={1} placeholder="Quantity" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'reason']}
                      rules={[{ required: true, message: 'Missing reason' }]}
                    >
                      <Select
                        placeholder="Select reason"
                        style={{ width: 200 }}
                        options={[
                          { value: 'damaged', label: 'Damaged Item' },
                          { value: 'wrong_item', label: 'Wrong Item' },
                          { value: 'quality_issue', label: 'Quality Issue' },
                          { value: 'other', label: 'Other' }
                        ]}
                      />
                    </Form.Item>
                    <Button type="link" onClick={() => remove(name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="reason"
            label="General Reason"
            rules={[{ required: true, message: 'Please provide a general reason' }]}
          >
            <Select
              placeholder="Select general reason"
              options={[
                { value: 'quality_issues', label: 'Quality Issues' },
                { value: 'wrong_items', label: 'Wrong Items Received' },
                { value: 'damaged_items', label: 'Damaged Items' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Returns; 