import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createSupplier } from './service';

export default function SupplierForm({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  console.log('SupplierForm rendered, open:', open);
  
  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log('Form values:', values);
      
      const response = await createSupplier(values);
      console.log('Create response:', response);
      
      if (response.success) {
        message.success('Supplier created successfully');
        form.resetFields();
        onClose();
      } else {
        message.error(response.message || 'Error creating supplier');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Supplier"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Supplier Name"
          rules={[{ required: true, message: 'Please enter supplier name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="contactPerson"
          label="Contact Person"
          rules={[{ required: true, message: 'Please enter contact person' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: 'Please enter phone number' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="gstin"
          label="GSTIN"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="paymentTerms"
          label="Payment Terms"
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
} 