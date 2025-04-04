import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { createPurchase } from './service';
import { getSuppliers } from '../SupplierModule/service';
import dayjs from 'dayjs';

export default function PurchaseForm({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getSuppliers();
        if (response?.result && Array.isArray(response.result)) {
          setSuppliers(response.result);
        }
      } catch (error) {
        console.error('Error loading suppliers:', error);
        message.error('Failed to load suppliers');
      }
    };
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Calculate totals
      const items = values.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * (values.taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Generate purchase number if not provided
      const purchaseNumber = values.purchaseNumber || `PO-${Date.now()}`;

      const purchaseData = {
        ...values,
        purchaseNumber,
        purchaseDate: values.purchaseDate.toISOString(),
        subtotal,
        taxAmount,
        totalAmount,
        status: 'Pending',
        paymentStatus: 'Unpaid'
      };

      console.log('Submitting purchase data:', purchaseData);
      const response = await createPurchase(purchaseData);
      
      if (response?.result) {
        message.success('Purchase created successfully');
        form.resetFields();
        onClose();
      } else {
        throw new Error(response?.message || 'Error creating purchase');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error(error.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Purchase Order"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="purchaseNumber"
          label="Purchase Number"
          rules={[{ required: true, message: 'Please enter purchase number' }]}
        >
          <Input placeholder="e.g., PO-001" />
        </Form.Item>

        <Form.Item
          name="supplier"
          label="Supplier"
          rules={[{ required: true, message: 'Please select supplier' }]}
        >
          <Select>
            {suppliers.map(supplier => (
              <Select.Option key={supplier._id} value={supplier._id}>
                {supplier.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="purchaseDate"
          label="Purchase Date"
          rules={[{ required: true, message: 'Please select date' }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'product']}
                    rules={[{ required: true, message: 'Missing product' }]}
                  >
                    <Input placeholder="Product" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[{ required: true, message: 'Missing quantity' }]}
                  >
                    <InputNumber placeholder="Quantity" min={1} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'unitPrice']}
                    rules={[{ required: true, message: 'Missing price' }]}
                  >
                    <InputNumber 
                      placeholder="Unit Price" 
                      min={0}
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item
          name="taxRate"
          label="Tax Rate (%)"
          rules={[{ required: true, message: 'Please enter tax rate' }]}
          initialValue={18}
        >
          <InputNumber min={0} max={100} />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
} 