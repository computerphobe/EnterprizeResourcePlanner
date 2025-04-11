import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Typography, message } from 'antd';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { register } from '@/auth/auth.service';

const { Title } = Typography;
const { Option } = Select;

const RegisterUser = () => {
  const { user } = useSelector(selectAuth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);



  const onFinish = async (values) => {
    setLoading(true);
    try {
      const registerData = {
        ...values,
        name: values.name,
        surname: values.surname,
        role: values.role,
        email: values.email,
        password: values.password,
      };
      console.log('registerData.. RegisterUsers.jsx', registerData);
      await register({ registerData });
      message.success('User registered successfully!');
      form.resetFields();
    } catch (error) {
      message.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto' }}>
      <Title level={3}>Register New User</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="First Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="surname" label="Last Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select placeholder="Select a role">
            <Option value="owner">Admin</Option>
            <Option value="doctor">Doctor</Option>
            <Option value="hospital">Hospital</Option>
            <Option value="deliverer">Deliverer</Option>
            <Option value="distributor">Small Distributor</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Register User
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RegisterUser;
