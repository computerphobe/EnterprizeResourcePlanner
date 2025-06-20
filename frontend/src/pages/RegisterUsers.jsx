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
      // No need to explicitly add fields that are already in values
      // Just send the form values directly
      const registerData = values;
      
      console.log('registerData.. RegisterUsers.jsx', registerData);
      const response = await register({ registerData });
      
      // Show different messages based on whether client was created
      if (response.result?.client) {
        message.success(`User and client record created successfully for ${values.role}!`);
      } else {
        message.success('User registered successfully!');
      }
      
      form.resetFields();
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Registration failed: ' + (error.message || 'Unknown error'));
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
        </Form.Item>        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select placeholder="Select a role">
            <Option value="owner">Admin</Option>
            <Option value="doctor">Doctor</Option>
            <Option value="hospital">Hospital</Option>
            <Option value="deliverer">Deliverer</Option>
            <Option value="distributor">Small Distributor</Option>
            <Option value="accountant">Accountant</Option>
          </Select>
        </Form.Item>
        
        {/* Additional fields for hospital/doctor roles */}
        <Form.Item name="phone" label="Phone Number">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={2} placeholder="Optional" />
        </Form.Item>
        <Form.Item name="country" label="Country">
          <Input placeholder="Optional" />
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
