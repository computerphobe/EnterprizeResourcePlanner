import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Table, 
  message, 
  Card, 
  Row, 
  Col, 
  Space,
  Typography,
  Tag,
  Spin
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../../services/request';
import { getAvailableInventoryForOrders } from '@/services/inventoryService';

const { Title } = Typography;
const { Option } = Select;

const OrderForm = () => {
  const [form] = Form.useForm();
  const { current: currentUser } = useSelector((state) => state.auth);
  
  // State for form and inventory
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Load available inventory items when component mounts
  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    setLoadingInventory(true);
    try {
      console.log('🔍 [OrderForm] Loading available inventory items...');
      const items = await getAvailableInventoryForOrders();
      
      setInventoryItems(items);
      console.log(`✅ [OrderForm] Loaded ${items.length} available inventory items`);
    } catch (error) {
      console.error('❌ [OrderForm] Error loading inventory:', error);
      message.error('Failed to load inventory items: ' + error.message);
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const addItemToOrder = (itemId) => {
    const inventoryItem = inventoryItems.find(item => item._id === itemId);
    if (!inventoryItem) {
      message.error('Inventory item not found');
      return;
    }

    // Check if item is already added
    const existingItem = selectedItems.find(item => item.inventoryItemId === itemId);
    if (existingItem) {
      message.warning('Item already added to order');
      return;
    }

    const newItem = {
      key: itemId,
      inventoryItemId: itemId,
      itemName: inventoryItem.itemName,
      itemPrice: inventoryItem.price,
      availableQuantity: inventoryItem.quantity,
      orderedQuantity: 1,
      unit: inventoryItem.unit || 'pieces',
      category: inventoryItem.category,
      totalPrice: inventoryItem.price * 1
    };

    setSelectedItems([...selectedItems, newItem]);
    console.log(`✅ [OrderForm] Added item to order: ${inventoryItem.itemName}`);
  };

  const removeItemFromOrder = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.inventoryItemId !== itemId));
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }

    setSelectedItems(selectedItems.map(item => {
      if (item.inventoryItemId === itemId) {
        const newTotalPrice = item.itemPrice * quantity;
        return {
          ...item,
          orderedQuantity: quantity,
          totalPrice: newTotalPrice
        };
      }
      return item;
    }));
  };

  const calculateTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleSubmit = async (values) => {
    if (selectedItems.length === 0) {
      message.error('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        ...values,
        orderType: 'doctor',
        doctorId: currentUser._id,
        doctorName: currentUser.name,
        hospitalName: currentUser.hospitalName,
        items: selectedItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.orderedQuantity,
          price: item.itemPrice,
          totalPrice: item.totalPrice,
          unit: item.unit,
          category: item.category
        })),
        totalAmount: calculateTotalAmount(),
        status: 'pending',
        createdBy: currentUser._id
      };

      console.log('🔍 [OrderForm] Submitting order:', orderData);

      const response = await request.create({
        entity: 'orders',
        jsonData: orderData
      });

      if (response.success) {
        message.success('Order created successfully');
        form.resetFields();
        setSelectedItems([]);
        console.log('✅ [OrderForm] Order created successfully:', response.result);
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('❌ [OrderForm] Error creating order:', error);
      message.error('Failed to create order: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns for selected items
  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: 'Unit Price',
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      render: (price) => `₹${price.toFixed(2)}`
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      render: (qty) => <Tag color={qty > 10 ? 'green' : qty > 0 ? 'orange' : 'red'}>{qty}</Tag>
    },
    {
      title: 'Quantity',
      dataIndex: 'orderedQuantity',
      key: 'orderedQuantity',
      render: (qty, record) => (
        <InputNumber
          min={1}
          max={record.availableQuantity}
          value={qty}
          onChange={(value) => updateItemQuantity(record.inventoryItemId, value)}
        />
      )
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => `₹${price.toFixed(2)}`
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => removeItemFromOrder(record.inventoryItemId)}
        />
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Create New Order</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select priority">
                <Option value="normal">Normal</Option>
                <Option value="urgent">Urgent</Option>
                <Option value="emergency">Emergency</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="notes"
              label="Notes"
            >
              <Input.TextArea placeholder="Additional notes or instructions" />
            </Form.Item>
          </Col>
        </Row>

        <Card title="Add Items to Order" style={{ marginBottom: 24 }}>
          <Form.Item label="Select Inventory Item">
            <Select
              placeholder="Search and select inventory items"
              showSearch
              loading={loadingInventory}
              onChange={addItemToOrder}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {inventoryItems.map(item => (
                <Option key={item._id} value={item._id}>
                  {item.itemName} - ₹{item.price} ({item.quantity} available)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Table
            columns={columns}
            dataSource={selectedItems}
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <strong>Total Amount:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>₹{calculateTotalAmount().toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              disabled={selectedItems.length === 0}
            >
              Create Order
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default OrderForm; 