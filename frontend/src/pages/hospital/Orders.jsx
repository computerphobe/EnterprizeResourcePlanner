import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message, Input } from 'antd';
import { EyeOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [form] = Form.useForm();
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Sample categories and subcategories - replace with actual data from your backend
  const categories = [
    { value: 'equipment', label: 'Medical Equipment' },
    { value: 'supplies', label: 'Medical Supplies' },
    { value: 'furniture', label: 'Hospital Furniture' },
    { value: 'pharmacy', label: 'Pharmacy Items' },
    { value: 'laboratory', label: 'Laboratory Equipment' },
  ];

  const subcategories = {
    equipment: [
      { value: 'diagnostic', label: 'Diagnostic Equipment' },
      { value: 'monitoring', label: 'Patient Monitoring' },
      { value: 'imaging', label: 'Medical Imaging' },
      { value: 'surgical', label: 'Surgical Equipment' },
      { value: 'emergency', label: 'Emergency Equipment' },
    ],
    supplies: [
      { value: 'disposable', label: 'Disposable Supplies' },
      { value: 'surgical', label: 'Surgical Supplies' },
      { value: 'wound', label: 'Wound Care Supplies' },
      { value: 'sterilization', label: 'Sterilization Supplies' },
      { value: 'protective', label: 'Protective Equipment' },
    ],
    furniture: [
      { value: 'beds', label: 'Hospital Beds' },
      { value: 'chairs', label: 'Medical Chairs' },
      { value: 'cabinets', label: 'Medical Cabinets' },
      { value: 'tables', label: 'Medical Tables' },
      { value: 'stretchers', label: 'Stretchers' },
    ],
    pharmacy: [
      { value: 'medicines', label: 'Medicines' },
      { value: 'vaccines', label: 'Vaccines' },
      { value: 'injections', label: 'Injections' },
      { value: 'firstaid', label: 'First Aid Kits' },
      { value: 'vitamins', label: 'Vitamins & Supplements' },
    ],
    laboratory: [
      { value: 'analyzers', label: 'Medical Analyzers' },
      { value: 'microscopes', label: 'Microscopes' },
      { value: 'centrifuges', label: 'Centrifuges' },
      { value: 'incubators', label: 'Incubators' },
      { value: 'reagents', label: 'Laboratory Reagents' },
    ],
  };

  useEffect(() => {
    fetchOrders();
    fetchInventoryItems();
  }, [token]);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      
      const data = await response.json();
      if (data.success) {
        setInventoryItems(data.result || []);
      }
    } catch (error) {
      message.error('Failed to fetch inventory items');
    }
  };

  const fetchOrders = async () => {
    if (!token) return setLoading(false);

    try {
      const response = await fetch('/api/hospital/orders', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      if (data.success) {
        setOrders(data.result || []);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'completed') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'processing') color = 'blue';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewOrder = (order) => {
    // TODO: Implement view order details
    console.log('View order:', order);
  };

  const handleGeneratePDF = (order) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF for order:', order);
  };

  const handlePlaceOrder = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Create order data with required fields
      const orderData = {
        items: [{
          inventoryItem: values.inventoryItem,
          quantity: values.quantity,
          price: 0, // Default price, will be updated by backend
          purchaseType: values.purchaseType // Add purchase type to items
        }],
        totalAmount: 0, // Will be calculated on backend
        status: 'pending',
        orderType: 'doctor',
        doctorId: current?.id,
        doctorName: current?.name,
        hospitalName: current?.hospitalName,
        createdBy: current?.id
      };

      const response = await fetch('/api/hospital/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      
      const data = await response.json();
      
      if (data.success) {
        message.success('Order placed successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchOrders();
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      message.error(error.message || 'Failed to place order');
    }
  };

  const paidOrders = orders.filter(order => order.status === 'completed');
  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing');

  const items = [
    {
      key: '1',
      label: 'All Orders',
      children: (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Paid Orders',
      children: (
        <Table
          dataSource={paidOrders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Pending Orders',
      children: (
        <Table
          dataSource={pendingOrders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Hospital Orders</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handlePlaceOrder}
          size="large"
        >
          Place Order
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>

      <Modal
        title="Place New Order"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText="Submit"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ purchaseType: 'buy' }}
        >
          <Form.Item
            name="inventoryItem"
            label="Inventory Item"
            rules={[{ required: true, message: 'Please select an inventory item' }]}
          >
            <Select 
              placeholder="Search and select inventory item"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {inventoryItems.map(item => (
                <Select.Option key={item._id} value={item._id}>
                  {item.name} - {item.category} (Stock: {item.quantity})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {categories.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="purchaseType"
            label="Purchase Type"
            rules={[{ required: true, message: 'Please select purchase type' }]}
          >
            <Select placeholder="Select purchase type">
              <Select.Option value="buy">Buy</Select.Option>
              <Select.Option value="rent">Rent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' }
            ]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              placeholder="Enter quantity"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter any additional notes or requirements"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders; 