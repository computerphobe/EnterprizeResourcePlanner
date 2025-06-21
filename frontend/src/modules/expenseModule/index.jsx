import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Card,
  Row,
  Col,
  Typography,
} from 'antd';

const { Option } = Select;
const { Title } = Typography;

const getExpenses = async () => {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/expenses/list`, {
    headers: {
      'Authorization' : `Bearer ${token}`
    }
  });
  const result = await res.json();
  if(!res.ok) {
    throw new Error(result.message || 'Failed to get expenses')
  }
  return result
};

const createExpense = async (data) => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/expenses/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Failed to create expense');
  }

  return result;
};

const deleteExpense = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/expenses/delete/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Failed to delete expense');
  }

  return result;
};


const getNetProfit = async () => {
  const res = await fetch(`/api/expenses/net-profit`);
  return await res.json();
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
    } catch {
      message.error('Failed to load expenses');
    }
    setLoading(false);
  };

  const fetchNetProfit = async () => {
    try {
      const data = await getNetProfit();
      setNetProfitData(data);
    } catch {
      message.error('Failed to fetch net profit');
    }
  };

  const onFinish = async (values) => {
    try {
      await createExpense(values);
      message.success('Expense created');
      form.resetFields();
      fetchExpenses();
      fetchNetProfit();
    } catch (err) {
      message.error(err.message || 'Error creating expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      message.success('Expense deleted');
      fetchExpenses();
      fetchNetProfit();
    } catch {
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
                  <Option value="General">General</Option>
                  <Option value="marketing">Transport</Option>
                  <Option value="office">Office</Option>
                  <Option value="salary">Maintenance</Option>
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
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Expense
            </Button>
          </Form.Item>
        </Form>
      </Card>

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
