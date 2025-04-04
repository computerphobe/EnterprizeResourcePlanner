import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import SupplierList from './SupplierList';
import { request } from '@/request';

export default function SupplierModule() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddClick = () => {
    console.log('Add button clicked');
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);

      const response = await request.create({
        entity: 'suppliers',
        jsonData: values
      });

      console.log('Create response:', response);

      if (response && response.data) {
        message.success('Supplier created successfully');
        setIsModalOpen(false);
        form.resetFields();
        // The SupplierList component will handle its own data loading
      } else {
        message.error('Error creating supplier');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to create supplier');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Suppliers</h1>
      
      <SupplierList onAddClick={handleAddClick} />

      <Modal
        title="Add New Supplier"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
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
    </div>
  );
} 
