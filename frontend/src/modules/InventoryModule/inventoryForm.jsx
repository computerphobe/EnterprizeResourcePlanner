import React, { useEffect, useState } from 'react';
import { 
  Modal, Form, Input, InputNumber, Select, message, 
  DatePicker, Row, Col, Divider, Tooltip, Alert 
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { createinventory, updateinventory, createInventorySimple } from './service';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  { value: 'medicines', label: 'Medicines' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'instruments', label: 'Instruments' },
  { value: 'reagents', label: 'Reagents' },
  { value: 'disposables', label: 'Disposables' },
  { value: 'other', label: 'Other' }
];

const GST_RATES = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' }
];

const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'vials', label: 'Vials' },
  { value: 'packs', label: 'Packs' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'grams', label: 'Grams' },
  { value: 'liters', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'meters', label: 'Meters' },
  { value: 'other', label: 'Other' }
];

export default function InventoryForm({ open, onClose, initialValues, refresh }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Editing mode - populate with existing values
        const formValues = {
          ...initialValues,
          expiryDate: initialValues.expiryDate ? moment(initialValues.expiryDate) : null
        };
        form.setFieldsValue(formValues);
        setShowAdvanced(true); // Show advanced fields when editing
      } else {
        // Creating mode - set defaults
        form.setFieldsValue({
          itemName: '',
          quantity: 0,
          price: 0,
          category: 'medicines',
          productCode: '',
          nameAlias: '',
          material: 'N/A',
          gstRate: 5,
          minimumStock: 10,
          maximumStock: 1000,
          unit: 'pieces'
        });
        setShowAdvanced(false);
      }
    }
  }, [open, initialValues, form]);

  // Auto-generate product code based on item name
  const handleItemNameChange = (e) => {
    const itemName = e.target.value;
    const currentProductCode = form.getFieldValue('productCode');
    const currentNameAlias = form.getFieldValue('nameAlias');
    
    // Auto-generate product code if not manually set
    if (!currentProductCode || currentProductCode.startsWith('INV-')) {
      const code = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8) + '-' + Date.now().toString().slice(-4);
      form.setFieldValue('productCode', code);
    }
    
    // Auto-set name alias if not manually set
    if (!currentNameAlias) {
      form.setFieldValue('nameAlias', itemName);
    }
  };

  // Validate minimum and maximum stock
  const validateStockLimits = () => {
    const minStock = form.getFieldValue('minimumStock');
    const maxStock = form.getFieldValue('maximumStock');
    
    if (minStock && maxStock && maxStock <= minStock) {
      form.setFieldValue('maximumStock', minStock * 10);
      message.warning('Maximum stock adjusted to be 10x minimum stock');
    }
  };

  // Submit handler
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
        // Ensure numeric fields are properly converted
        quantity: Number(values.quantity) || 0,
        price: Number(values.price) || 0,
        gstRate: Number(values.gstRate) || 5,
        minimumStock: Number(values.minimumStock) || 10,
        maximumStock: Number(values.maximumStock) || 1000
      };

      if (initialValues?._id) {
        // Update existing item
        await updateinventory(initialValues._id, submitData);
        message.success(`"${values.itemName}" updated successfully`);
      } else {
        // Create new item
        await createinventory(submitData);
        message.success(`"${values.itemName}" created successfully`);
      }
      
      form.resetFields();
      onClose();
      refresh(); // Refresh inventory table
    } catch (err) {
      console.error('Form submission error:', err);
      message.error(err.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    form.resetFields();
    setShowAdvanced(false);
    onClose();
  };

  return (
    <Modal
      title={
        <div>
          <span>{initialValues ? 'Edit Inventory Item' : 'Add New Inventory Item'}</span>
          {!initialValues && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Fill in the required fields to add a new inventory item
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText={initialValues ? 'Update' : 'Create'}
      cancelText="Cancel"
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="middle"
      >
        {/* Alert for editing mode */}
        {initialValues && (
          <Alert
            message="Editing Mode"
            description={`You are editing "${initialValues.itemName}". Make your changes and click Update.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Basic Information Section */}
        <Divider orientation="left">Basic Information</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="itemName" 
              label="Item Name" 
              rules={[
                { required: true, message: 'Item name is required' },
                { max: 100, message: 'Item name cannot exceed 100 characters' }
              ]}
            >
              <Input 
                placeholder="Enter item name"
                onChange={handleItemNameChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="category" 
              label="Category" 
              rules={[{ required: true, message: 'Category is required' }]}
            >
              <Select placeholder="Select category">
                {CATEGORIES.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item 
              name="quantity" 
              label={
                <span>
                  Current Stock{' '}
                  <Tooltip title="Current available quantity in stock">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Quantity is required' },
                { type: 'number', min: 0, message: 'Quantity cannot be negative' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="price" 
              label="Unit Price (₹)" 
              rules={[
                { required: true, message: 'Price is required' },
                { type: 'number', min: 0, message: 'Price cannot be negative' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                formatter={value => `₹ ${value}`}
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="unit" 
              label="Unit of Measurement"
              rules={[{ required: true, message: 'Unit is required' }]}
            >
              <Select placeholder="Select unit">
                {UNITS.map(unit => (
                  <Option key={unit.value} value={unit.value}>{unit.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Product Details Section */}
        <Divider orientation="left">Product Details</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="productCode" 
              label={
                <span>
                  Product Code{' '}
                  <Tooltip title="Unique identifier for the product">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Product code is required' },
                { max: 20, message: 'Product code cannot exceed 20 characters' }
              ]}
            >
              <Input 
                placeholder="Auto-generated or enter custom code"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="nameAlias" 
              label={
                <span>
                  Name Alias{' '}
                  <Tooltip title="Alternative name or short name">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Name alias is required' },
                { max: 100, message: 'Name alias cannot exceed 100 characters' }
              ]}
            >
              <Input placeholder="Alternative name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="material" 
              label="Material/Type"
              rules={[
                { required: true, message: 'Material is required' },
                { max: 50, message: 'Material cannot exceed 50 characters' }
              ]}
            >
              <Input placeholder="e.g., Plastic, Metal, Glass, Liquid" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="gstRate" 
              label="GST Rate (%)"
              rules={[{ required: true, message: 'GST rate is required' }]}
            >
              <Select placeholder="Select GST rate">
                {GST_RATES.map(rate => (
                  <Option key={rate.value} value={rate.value}>{rate.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Stock Management Section */}
        <Divider orientation="left">Stock Management</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="minimumStock" 
              label={
                <span>
                  Minimum Stock Level{' '}
                  <Tooltip title="Alert when stock goes below this level">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Minimum stock is required' },
                { type: 'number', min: 0, message: 'Cannot be negative' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="10"
                min={0}
                onChange={validateStockLimits}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="maximumStock" 
              label={
                <span>
                  Maximum Stock Level{' '}
                  <Tooltip title="Warning when stock exceeds this level">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Maximum stock is required' },
                { type: 'number', min: 1, message: 'Must be at least 1' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="1000"
                min={1}
                onChange={validateStockLimits}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Advanced Fields (Collapsible) */}
        <Divider orientation="left">
          <span 
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Information {showAdvanced ? '▼' : '▶'}
          </span>
        </Divider>

        {showAdvanced && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="manufacturer" 
                  label="Manufacturer"
                  rules={[{ max: 100, message: 'Cannot exceed 100 characters' }]}
                >
                  <Input placeholder="Manufacturer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="supplier" 
                  label="Supplier"
                  rules={[{ max: 100, message: 'Cannot exceed 100 characters' }]}
                >
                  <Input placeholder="Supplier name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="batchNumber" 
                  label="Batch Number"
                  rules={[{ max: 30, message: 'Cannot exceed 30 characters' }]}
                >
                  <Input 
                    placeholder="Batch/Lot number"
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="expiryDate" 
                  label="Expiry Date"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    placeholder="Select expiry date"
                    disabledDate={(current) => current && current <= moment().endOf('day')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="location" 
                  label="Storage Location"
                  rules={[{ max: 100, message: 'Cannot exceed 100 characters' }]}
                >
                  <Input placeholder="e.g., Shelf A-1, Room 102" />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* Spacer */}
              </Col>
            </Row>

            <Form.Item 
              name="description" 
              label="Description"
              rules={[{ max: 500, message: 'Cannot exceed 500 characters' }]}
            >
              <TextArea 
                rows={3}
                placeholder="Additional details about the item..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
