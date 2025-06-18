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

  useEffect(() => {
    fetchOrders();
    fetchInventoryItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/doctor/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory/items', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInventoryItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      message.error('Failed to fetch inventory items');
    }
  };

  const handlePlaceOrder = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <span>
          {items.map(item => item.inventoryItem.name).join(', ')}
        </span>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'warning',
          processing: 'processing',
          completed: 'success',
          cancelled: 'error'
        };
        return (
          <Tag color={statusColors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          >
            View
          </Button>
          {record.status === 'completed' && (
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handleDownloadInvoice(record)}
            >
              Invoice
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleViewOrder = (order) => {
    // Implement view order details
    console.log('View order:', order);
  };

  const handleDownloadInvoice = (order) => {
    // Implement download invoice
    console.log('Download invoice for order:', order);
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

      const response = await fetch('/api/doctor/orders/create', {
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
        <Title level={2}>Doctor Orders</Title>
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
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="inventoryItem"
            label="Select Item"
            rules={[{ required: true, message: 'Please select an item' }]}
          >
            <Select
              placeholder="Select an item"
              options={inventoryItems.map(item => ({
                value: item._id,
                label: item.name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="purchaseType"
            label="Purchase Type"
            rules={[{ required: true, message: 'Please select purchase type' }]}
          >
            <Select
              placeholder="Select purchase type"
              options={[
                { value: 'regular', label: 'Regular Purchase' },
                { value: 'emergency', label: 'Emergency Purchase' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders; 