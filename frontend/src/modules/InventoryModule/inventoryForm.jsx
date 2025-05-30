import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { createinventory, updateinventory } from './service';

export default function InventoryForm({ open, onClose, initialValues, refresh }) {
  const [form] = Form.useForm();

  // Reset form on modal open
  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || { itemName: '', quantity: 0, price: 0, category: '' });
    }
  }, [open, initialValues]);

  // Submit handler
  const onFinish = async (values) => {
    try {
      if (initialValues?._id) {
        await updateinventory(initialValues._id, values);
        message.success('Inventory updated');
      } else {
        await createinventory(values);
        message.success('Inventory created');
      }
      form.resetFields();
      onClose();
      refresh(); // ✅ Refresh inventory table
    } catch (err) {
      message.error('Failed to save inventory');
    }
  };

  // Cancel handler
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={initialValues ? 'Edit Inventory' : 'Add Inventory'}
      open={open} // ✅ updated to `open`
      onCancel={handleCancel}
      onOk={() => form.submit()} // ✅ makes 'Create' button submit
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item name="itemName" label="Item Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="price" label="Price" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
