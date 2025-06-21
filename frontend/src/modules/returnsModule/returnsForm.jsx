import React from 'react';
import { Modal, Form, Input, InputNumber, message, Select } from 'antd';
import { createReturn } from './service';
import { getinventory } from '../InventoryModule/service';

export default function ReturnsForm({ open, onClose }) {
  const [form] = Form.useForm();
  const [inventoryItems, setInventoryItems] = React.useState([]);

  // Load inventory items when modal opens
  React.useEffect(() => {
    if (open) {
      loadInventoryItems();
    }
  }, [open]);

  const loadInventoryItems = async () => {
    try {
      const items = await getinventory();
      setInventoryItems(items);
    } catch (err) {
      message.error('Failed to load inventory items');
    }
  };

  const onFinish = async (values) => {
    try {
      console.log('Submitting return with values:', values);
      await createReturn(values);
      message.success('Return recorded successfully');
      form.resetFields();
      onClose();
    } catch (err) {
      console.error('Error creating return:', err);
      message.error(err.message || 'Failed to record return');
    }
  };

  return (
    <Modal
      title="Record a Return"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item 
          name="originalItemId" 
          label="Select Inventory Item" 
          rules={[{ required: true, message: 'Please select an inventory item' }]}
        >
          <Select
            showSearch
            placeholder="Select an item"
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children || '';
              const searchString = typeof label === 'string' ? label : String(label || '');
              const inputString = typeof input === 'string' ? input : String(input || '');
              return searchString.toLowerCase().includes(inputString.toLowerCase());
            }}
          >
            {inventoryItems.map(item => (
              <Select.Option key={item._id} value={item._id} label={item.itemName}>
                {item.itemName} - Quantity: {item.quantity}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="returnedQuantity" 
          label="Returned Quantity" 
          rules={[
            { required: true, message: 'Please enter the returned quantity' },
            { type: 'number', min: 1, message: 'Quantity must be greater than 0' }
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>

        <Form.Item name="reason" label="Reason for Return">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
