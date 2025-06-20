import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message, Input, Row, Col, Divider, Card, Descriptions, List } from 'antd';
import { EyeOutlined, FilePdfOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title, Text } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [form] = Form.useForm();
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Helper function to calculate subtotal and tax amounts
  const calculateOrderTotals = (order) => {
    if (!order || !order.items) return { subtotal: 0, tax: 0, total: order?.totalAmount || 0 };
    
    let subtotal = 0;
    let tax = 0;
    
    order.items.forEach(item => {
      const price = item.price || (item.inventoryItem?.price * item.quantity) || 0;
      const gstRate = item.inventoryItem?.gstRate || 5; // Default to 5% if not specified
      
      subtotal += price;
      tax += (price * gstRate / 100);
    });
    
    return {
      subtotal: subtotal,
      tax: tax,
      total: order.totalAmount || (subtotal + tax)
    };
  };

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
      console.log('🟢 Fetching inventory items...');
      const response = await fetch('/api/inventory/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response from inventory API:', response);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory items: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🟢 Inventory data received:', data);
      
      if (data.success) {
        console.log('🟢 Setting inventory items:', data.result.length, 'items');
        setInventoryItems(data.result || []);
      } else {
        console.log('🟠 API returned success=false:', data.message);
        message.error(data.message || 'Failed to fetch inventory items');
      }
    } catch (error) {
      console.error('🔴 Error fetching inventory:', error);
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
  };  const handleViewOrder = async (order) => {
    try {
      // Fetch the detailed order to ensure we have all inventory details
      const response = await fetch(`/api/hospital/orders/${order._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.result);
        setOrderDetailsVisible(true);
      } else {
        throw new Error(data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch order details');
      // Fall back to using the basic order data if detailed fetch fails
      setSelectedOrder(order);
      setOrderDetailsVisible(true);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetailsVisible(false);
  };

  const handleGeneratePDF = (order) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF for order:', order);
  };
  const handlePlaceOrder = () => {
    setIsModalVisible(true);
    // Initialize form with one empty item
    setTimeout(() => {
      form.setFieldsValue({ items: [{}] });
    }, 100);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    // Reset with one empty item
    form.setFieldsValue({ items: [{}] });
  };
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate that at least one item is present
      if (!values.items || values.items.length === 0) {
        message.error('Please add at least one item to the order');
        return;
      }

      // Validate each item
      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        if (!item.inventoryItem) {
          message.error(`Please select an inventory item for item ${i + 1}`);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error(`Please enter a valid quantity for item ${i + 1}`);
          return;
        }
        if (!item.purchaseType) {
          message.error(`Please select a purchase type for item ${i + 1}`);
          return;
        }
      }
      
      // Create order data with multiple items
      const orderData = {
        items: values.items.map(item => ({
          inventoryItem: item.inventoryItem,
          quantity: item.quantity,
          price: 0, // Default price, will be updated by backend
          purchaseType: item.purchaseType,
          notes: item.notes || ''
        })),
        totalAmount: 0, // Will be calculated on backend
        status: 'pending',
        orderType: 'doctor',
        doctorId: current?.id,
        doctorName: current?.name,
        hospitalName: current?.hospitalName,
        createdBy: current?.id,
        notes: values.orderNotes || ''
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
        message.success(`Order placed successfully with ${values.items.length} item(s)`);
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
      </div>      <Modal
        title="Place New Order"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText="Submit"
        cancelText="Cancel"
        width={900}
        destroyOnClose={true}
        footer={[
          <Button key="reset" onClick={() => {
            form.resetFields();
            form.setFieldsValue({ items: [{}] });
          }}>
            Reset
          </Button>,
          <Button key="cancel" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleModalSubmit}>
            Submit Order
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            items: [{}] // Start with one empty item
          }}
        >
          <Divider orientation="left">Order Items</Divider>
          
          <Row gutter={[12, 0]} style={{ marginBottom: 10 }}>
            <Col span={7}><strong>Item</strong></Col>
            <Col span={4}><strong>Quantity</strong></Col>
            <Col span={4}><strong>Category</strong></Col>
            <Col span={4}><strong>Purchase Type</strong></Col>
            <Col span={4}><strong>Notes</strong></Col>
            <Col span={1}><strong>Action</strong></Col>
          </Row>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row key={field.key} gutter={[12, 8]} style={{ marginBottom: 8 }}>
                    <Col span={7}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'inventoryItem']}
                        rules={[{ required: true, message: 'Select an item' }]}
                      >
                        <Select 
                          placeholder="Search and select item"                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) => {
                            const children = option?.children || option?.label || '';
                            const searchString = typeof children === 'string' ? children : String(children || '');
                            const inputString = typeof input === 'string' ? input : String(input || '');
                            return searchString.toLowerCase().includes(inputString.toLowerCase());
                          }}
                          style={{ width: '100%' }}
                        >
                          {inventoryItems.map(item => (
                            <Select.Option key={item._id} value={item._id}>
                              {item.itemName} - {item.category} (₹{item.price} | Stock: {item.quantity})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        rules={[{ required: true, message: 'Enter quantity' }]}
                      >
                        <InputNumber 
                          min={1} 
                          style={{ width: '100%' }} 
                          placeholder="Qty"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'category']}
                        rules={[{ required: true, message: 'Select category' }]}
                      >
                        <Select placeholder="Category">
                          {categories.map(cat => (
                            <Select.Option key={cat.value} value={cat.value}>
                              {cat.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'purchaseType']}
                        rules={[{ required: true, message: 'Select type' }]}
                      >
                        <Select placeholder="Purchase type">
                          <Select.Option value="buy">Buy</Select.Option>
                          <Select.Option value="rent">Rent</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'notes']}
                      >
                        <Input placeholder="Item notes" />
                      </Form.Item>
                    </Col>

                    <Col span={1}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          style={{ marginTop: 4 }}
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                  >
                    Add Another Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item
            name="orderNotes"
            label="Order Notes (Optional)"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes for the entire order..." 
            />
          </Form.Item>        </Form>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        title={
          <div>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <span>Order Details</span>
          </div>
        }
        open={orderDetailsVisible}
        onCancel={closeOrderDetails}
        footer={[
          <Button key="close" onClick={closeOrderDetails}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            {/* Basic Order Information */}
            <Card title="Order Information" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order ID">
                      <Text code>{selectedOrder._id?.slice(-8)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={selectedOrder.status === 'completed' ? 'green' : 'blue'}>
                        {selectedOrder.status?.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Total Amount">
                      <Text strong>₹{selectedOrder.totalAmount?.toFixed(2)}</Text>
                    </Descriptions.Item>
                    {selectedOrder.orderNumber && (
                      <Descriptions.Item label="Order Number">
                        <Tag color="blue">{selectedOrder.orderNumber}</Tag>
                      </Descriptions.Item>
                    )}
                    {selectedOrder.delivererId && (
                      <Descriptions.Item label="Deliverer">
                        {selectedOrder.delivererId.name || 'Assigned'}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedOrder.items}
                  renderItem={(item, index) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">                          <Col span={16}>
                            <Text strong>{item.inventoryItem?.itemName || item.inventoryItem?.name || `Item ${index + 1}`}</Text>
                            {item.inventoryItem?.productCode && (
                              <>
                                <br />
                                <Text type="secondary">Product Code: {item.inventoryItem.productCode}</Text>
                              </>
                            )}
                            <br />
                            <Text type="secondary">
                              Quantity: {item.quantity}
                              {item.purchaseType && ` • Type: ${item.purchaseType}`}
                              {item.inventoryItem?.category && ` • Category: ${item.inventoryItem.category}`}
                            </Text>
                            {item.notes && (
                              <>
                                <br />
                                <Text type="secondary">Notes: {item.notes}</Text>
                              </>
                            )}
                          </Col>                          <Col span={8} style={{ textAlign: 'right' }}>
                            {item.price && <Text strong>₹{item.price.toFixed(2)}</Text>}
                            {item.inventoryItem?.price && !item.price && <Text strong>₹{item.inventoryItem.price.toFixed(2)}</Text>}
                            {item.inventoryItem?.gstRate && (
                              <div>
                                <Text type="secondary">GST: {item.inventoryItem.gstRate}%</Text>
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
                
                {/* Order Totals */}
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="end">
                  <Col span={12}>
                    <div style={{ textAlign: 'right', paddingRight: '16px' }}>
                      {(() => {
                        const totals = calculateOrderTotals(selectedOrder);
                        return (
                          <>
                            <div>
                              <Text>Subtotal: </Text>
                              <Text strong>₹{totals.subtotal.toFixed(2)}</Text>
                            </div>
                            <div>
                              <Text>Tax: </Text>
                              <Text strong>₹{totals.tax.toFixed(2)}</Text>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <Text strong>Total: </Text>
                              <Text strong style={{ fontSize: '16px' }}>₹{totals.total.toFixed(2)}</Text>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Additional Information */}
            {selectedOrder.notes && (
              <Card title="Order Notes" size="small">
                <Text>{selectedOrder.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;