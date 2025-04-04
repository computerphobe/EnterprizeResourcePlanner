import React from 'react';
import { Form, Input, Button, Select } from 'antd';

const LoginForm = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    // Your existing login logic
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
      </Form.Item>

      <Form.Item
        name="role"
        rules={[{ required: true, message: 'Please select your role!' }]}
      >
        <Select placeholder="Select Role">
          <Select.Option value="admin">Admin</Select.Option>
          <Select.Option value="doctor">Doctor</Select.Option>
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