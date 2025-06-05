import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Card,
  Row,
  Col,
  Typography,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const API_BASE = '';

// Inline API functions
const getExpenses = async () => {
  const res = await axios.get(`${API_BASE}/expenses/list`);
  return res.data;
};

const createExpense = async (formData) => {
  const res = await axios.post(`${API_BASE}/expenses/create`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

const deleteExpense = async (id) => {
  const res = await axios.delete(`${API_BASE}/expenses/delete/${id}`);
  return res.data;
};

const getNetProfit = async () => {
  const res = await axios.get(`${API_BASE}/expenses/net-profit`);
  return res.data;
};

const ExpensesPage = () => {
  const [form] = Form.useForm();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [netProfitData, setNetProfitData] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchNetProfit();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data.expenses || []);
    } catch (err) {
      message.error('Failed to load expenses');
    }
    setLoading(false);
  };

  const fetchNetProfit = async () => {
    try {
      const data = await getNetProfit();
      setNetProfitData(data);
    } catch (err) {
      message.error('Failed to fetch net profit');
    }
  };

  const onFinish = async (values) => {
    try {
      const formData = new FormData();
      formData.append('amount', values.amount);
      formData.append('category', values.category);
      formData.append('description', values.description);
      if (values.bill && values.bill.file) {
        formData.append('bill', values.bill.file.originFileObj);
      }

      await createExpense(formData);
      message.success('Expense created');
      form.resetFields();
      fetchExpenses();
      fetchNetProfit();
    } catch (err) {
      message.error('Error creating expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      message.success('Expense deleted');
      fetchExpenses();
      fetchNetProfit();
    } catch (err) {
      message.error('Error deleting expense');
    }
  };

  const columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => `₹${value}`,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Uploaded By',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
    },
    {
      title: 'Bill',
      dataIndex: 'billUrl',
      key: 'billUrl',
      render: (url) =>
        url ? (
          <a href={`/${url}`} target="_blank" rel="noopener noreferrer">
            View Bill
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record._id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '30px' }}>
      <Title level={2}>Business Expenses</Title>

      <Card style={{ marginBottom: '20px' }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{ category: 'general' }}
        >
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="amount"
                label="Amount (₹)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="general">General</Option>
                  <Option value="transport">Transport</Option>
                  <Option value="office">Office</Option>
                  <Option value="maintenance">Maintenance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="bill" label="Upload Bill">
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Expense
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {netProfitData && (
        <Card style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <strong>Total Revenue:</strong> ₹{netProfitData.revenue}
            </Col>
            <Col span={8}>
              <strong>Total Expenses:</strong> ₹{netProfitData.totalExpenses}
            </Col>
            <Col span={8}>
              <strong>Net Profit:</strong> ₹{netProfitData.netProfit}
            </Col>
          </Row>
        </Card>
      )}

      <Table
        dataSource={expenses}
        columns={columns}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default ExpensesPage;
