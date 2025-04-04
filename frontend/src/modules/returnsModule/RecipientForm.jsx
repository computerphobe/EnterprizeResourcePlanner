import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { markReturnAsUsed } from './service';

export default function RecipientForm({ open, onClose, returnId }) {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      console.log('Submitting recipient form with values:', values);
      const recipient = {
        name: values.recipientName,
        department: values.department,
        notes: values.notes
      };
      
      const response = await markReturnAsUsed(returnId, recipient);
      console.log('Mark as used response:', response);
      
      if (response.success) {
        message.success('Item marked as used successfully');
        form.resetFields();
        onClose(true); // Pass true to indicate successful update
      } else {
        message.error(response.message || 'Failed to mark return as used');
      }
    } catch (err) {
      console.error('Error marking return as used:', err);
      message.error('Failed to mark return as used');
    }
  };

  return (
    <Modal
      title="Recipient Information"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="recipientName"
          label="Recipient Name"
          rules={[{ required: true, message: 'Please enter recipient name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="department"
          label="Department"
          rules={[{ required: true, message: 'Please enter department' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Additional Notes"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
} 