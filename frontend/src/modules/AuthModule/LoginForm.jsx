import React from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '@/redux/auth/actions';

const LoginForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      const result = await dispatch(login(values));
      if (result.success) {
        message.success('Login successful!');
        // Navigate based on role
        switch (values.role) {
          case 'owner':
            navigate('/');
            break;
          case 'doctor':
            navigate('/doctor');
            break;
          case 'distributor':
            navigate('/distributor');
            break;
          case 'deliverer':
            navigate('/deliverer');
            break;
          default:
            navigate('/');
        }
      } else {
        message.error(result.message || 'Login failed');
      }
    } catch (error) {
      message.error('Login failed. Please try again.');
    }
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Please input your email!' }]}
      >
        <Input placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>      <Form.Item
        name="role"
        rules={[{ required: true, message: 'Please select your role!' }]}
        initialValue="owner"
      >
        <Select placeholder="Select Role">
          <Select.Option value="owner">Admin</Select.Option>
          <Select.Option value="doctor">Doctor</Select.Option>
          <Select.Option value="distributor">Distributor</Select.Option>
          <Select.Option value="deliverer">Deliverer</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm; 