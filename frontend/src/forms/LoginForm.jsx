import React from 'react';
import { Form, Input, Checkbox, Select } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';

export default function LoginForm() {
  const translate = useLanguage();
  return (
    <div>
      <Form.Item
        label={translate('email')}
        name="email"
        rules={[
          { required: true },
          { type: 'email' },
        ]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder="admin@demo.com"
          type="email"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={translate('password')}
        name="password"
        rules={[{ required: true }]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder="admin123"
          size="large"
        />
      </Form.Item>      {/* 🔽 Role Selector */}
      <Form.Item
        label="Role"
        name="role"
        rules={[{ required: true, message: 'Please select your role!' }]}
        initialValue="owner"
      >        <Select placeholder="Select Role" size="large">
          <Select.Option value="owner">Admin</Select.Option>
          <Select.Option value="doctor">Doctor</Select.Option>
          <Select.Option value="hospital">Hospital</Select.Option>
          <Select.Option value="deliverer">Deliverer</Select.Option>
          <Select.Option value="distributor">Distributor</Select.Option>
          <Select.Option value="accountant">Accountant</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>{translate('Remember me')}</Checkbox>
        </Form.Item>
        <a className="login-form-forgot" href="/forgetpassword" style={{ marginLeft: '0px' }}>
          {translate('Forgot password')}
        </a>
      </Form.Item>
    </div>
  );
}
