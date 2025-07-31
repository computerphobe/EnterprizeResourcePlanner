import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message, Input, Spin, Alert, Row, Col, Divider, Card, Descriptions, List, Image, Badge } from 'antd';
import { EyeOutlined, FilePdfOutlined, PlusOutlined, ReloadOutlined, WarningOutlined, DeleteOutlined, CheckCircleOutlined, CameraOutlined, ClockCircleOutlined, EnvironmentOutlined, EditOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { getAvailableInventoryForOrders } from '@/services/inventoryService';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title, Text } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
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
      console.log('🔍 [DoctorOrders] Fetching orders...');
      const response = await fetch(`${API_BASE_URL}doctor/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('🔍 [DoctorOrders] Received orders data:', data);
      
      if (data.success) {
        console.log('✅ [DoctorOrders] Successfully loaded orders:', data.orders?.length || 0);
        
        // Log sample order structure for debugging
        if (data.orders && data.orders.length > 0) {
          const sampleOrder = data.orders[0];
          console.log('📊 [DoctorOrders] Sample order structure:', {
            id: sampleOrder._id,
            orderNumber: sampleOrder.orderNumber,
            itemsCount: sampleOrder.items?.length || 0,
            sampleItem: sampleOrder.items?.[0] ? {
              inventoryItem: sampleOrder.items[0].inventoryItem,
              itemName: sampleOrder.items[0].inventoryItem?.itemName,
              quantity: sampleOrder.items[0].quantity
            } : null
          });
        }
        
        setOrders(data.orders);
      } else {
        console.error('❌ [DoctorOrders] Failed to fetch orders:', data.message);
        message.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ [DoctorOrders] Error fetching orders:', error);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    setInventoryLoading(true);
    try {
      console.log('🔍 [DoctorOrders] Loading available inventory items...');
      const items = await getAvailableInventoryForOrders();
      
      console.log(`✅ [DoctorOrders] Loaded ${items.length} available inventory items`);
      setInventoryItems(items);
    } catch (error) {
      console.error('❌ [DoctorOrders] Error fetching inventory items:', error);
      message.error('Failed to fetch inventory items: ' + error.message);
      setInventoryItems([]);
    } finally {
      setInventoryLoading(false);
    }
  };
  const handlePlaceOrder = () => {
    setIsModalVisible(true);
    // Refresh inventory data when opening the modal to ensure we have latest data
    fetchInventoryItems();
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
      render: (items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return <span style={{ color: '#999' }}>No items</span>;
        }
        
        const itemsList = items.map((item, index) => {
          const itemName = item?.inventoryItem?.itemName || item?.itemName || `Item ${index + 1}`;
          const quantity = item?.quantity || 0;
          return `${itemName} (${quantity})`;
        }).join(', ');
        
        return (
          <div>
            <Text>{itemsList}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Text>
          </div>
        );
      }
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
      title: 'Photo Verification',
      key: 'photoVerification',
      render: (_, record) => {
        const verification = getVerificationStatus(record);
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Badge 
              count={verification.count} 
              size="small" 
              style={{ backgroundColor: verification.color }}
              showZero={false}
            >
              <CameraOutlined 
                style={{ 
                  color: verification.color, 
                  fontSize: '16px' 
                }} 
              />
            </Badge>
            <div style={{ 
              fontSize: '10px', 
              color: verification.color, 
              marginTop: '2px',
              fontWeight: '500'
            }}>
              {verification.text}
            </div>
          </div>
        );
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
  // Get photo verification status for display
  const getVerificationStatus = (order) => {
    const hasPickup = order.pickupVerification?.photo;
    const hasDelivery = order.deliveryVerification?.photo;
    const hasSignature = order.deliveryVerification?.customerSignature;
    
    if (order.status === 'completed') {
      if (hasPickup && hasDelivery && hasSignature) {
        return { status: 'complete', count: 2, color: '#52c41a', text: 'Complete' };
      } else if (hasPickup || hasDelivery) {
        return { status: 'partial', count: 1, color: '#faad14', text: 'Partial' };
      } else {
        return { status: 'missing', count: 0, color: '#ff4d4f', text: 'Missing' };
      }
    } else if (order.status === 'picked_up') {
      if (hasPickup) {
        return { status: 'pickup-verified', count: 1, color: '#1890ff', text: 'Pickup OK' };
      } else {
        return { status: 'pending', count: 0, color: '#d9d9d9', text: 'Pending' };
      }
    } else {
      return { status: 'pending', count: 0, color: '#d9d9d9', text: 'Pending' };
    }
  };

  const handleViewOrder = (order) => {
    console.log('🔍 [DoctorOrders] Viewing order details for:', order._id);
    // Fetch detailed order data including photo verification
    fetchDetailedOrder(order._id);
  };

  // Fetch detailed order information including photo verification
  const fetchDetailedOrder = async (orderId) => {
    try {
      console.log('🔍 [DoctorOrders] Fetching detailed order with verification data...');
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}doctor/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('🔍 [DoctorOrders] Detailed order response:', data);
      
      if (data.success && data.result) {
        setSelectedOrder(data.result);
        setOrderDetailsVisible(true);
        console.log('✅ [DoctorOrders] Order details loaded with verification data');
      } else {
        console.error('❌ [DoctorOrders] Failed to fetch detailed order:', data.message);
        message.error(data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('❌ [DoctorOrders] Error fetching detailed order:', error);
      message.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetailsVisible(false);
  };

  const handleDownloadInvoice = (order) => {
    // Implement download invoice
    console.log('Download invoice for order:', order);
  };  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate that at least one item is present
      if (!values.items || values.items.length === 0) {
        message.error('Please add at least one item to the order');
        return;
      }

      // Validate each item and find the corresponding inventory item
      const validatedItems = [];
      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        
        // Check if inventory item ID is selected
        if (!item.inventoryItem) {
          message.error(`Please select an inventory item for item ${i + 1}`);
          return;
        }
        
        // Find the full inventory item object
        const inventoryItem = inventoryItems.find(invItem => 
          invItem._id === item.inventoryItem || 
          invItem.id === item.inventoryItem || 
          invItem.inventoryId === item.inventoryItem
        );
        
        if (!inventoryItem) {
          console.error(`❌ [DoctorOrders] Inventory item not found in current list for item ${i + 1}`);
          console.error(`❌ Looking for ID: "${item.inventoryItem}"`);
          console.error(`❌ Available IDs:`, inventoryItems.map(inv => inv._id));
          message.error(`Inventory item not found for item ${i + 1}. Please refresh and try again.`);
          
          // Refresh inventory data
          await fetchInventoryItems();
          return;
        }
        
        if (!item.quantity || item.quantity <= 0) {
          message.error(`Please enter a valid quantity for item ${i + 1}`);
          return;
        }

        // Check stock availability
        if (inventoryItem.quantity < item.quantity) {
          message.warning(`Only ${inventoryItem.quantity} units available for ${inventoryItem.itemName || inventoryItem.name || 'this item'}`);
        }

        validatedItems.push({
          inventoryItem: inventoryItem._id || inventoryItem.id,  // Backend expects 'inventoryItem'
          itemName: inventoryItem.itemName || inventoryItem.name || inventoryItem.title || 'Unknown Item',
          quantity: item.quantity,
          price: inventoryItem.price || 0,
          unit: inventoryItem.unit || 'pieces',
          category: inventoryItem.category || 'other',
          purchaseType: item.purchaseType || 'regular',
          notes: item.notes || ''
        });
      }

      // Create order data with validated items
      const orderData = {
        items: validatedItems,
        totalAmount: validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        orderType: 'doctor',
        doctorId: current?.id || current?._id || '',
        doctorName: current?.name || 'Unknown Doctor',
        hospitalName: current?.hospitalName || 'Unknown Hospital',
        createdBy: current?.id || current?._id || '',
        notes: values.orderNotes || ''
      };

      console.log('🔍 [DoctorOrders] Submitting order data:', JSON.stringify(orderData, null, 2));
      console.log('🔍 [DoctorOrders] Items being sent:', orderData.items.map((item, i) => ({
        index: i + 1,
        inventoryItem: item.inventoryItem,
        itemName: item.itemName,
        quantity: item.quantity,
        purchaseType: item.purchaseType
      })));

      const response = await fetch(`${API_BASE_URL}doctor/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to create order`);
      }

      if (data.success) {
        message.success(`Order placed successfully with ${validatedItems.length} item(s)`);
        setIsModalVisible(false);
        form.resetFields();
        // Reset form with one empty item
        setTimeout(() => {
          form.setFieldsValue({ items: [{}] });
        }, 100);
        fetchOrders();
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ [DoctorOrders] Error creating order:', error);
      message.error(error.message || 'Failed to place order');
    }
  };
  const paidOrders = (orders || []).filter(order => order?.status === 'completed');
  const pendingOrders = (orders || []).filter(order => order?.status === 'pending' || order?.status === 'processing');

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
        <div>          <Button
          style={{ marginRight: '10px' }}
          icon={<ReloadOutlined />}
          loading={inventoryLoading}
          onClick={() => {
            console.log('Current inventory items:', inventoryItems);
            message.info('Refreshing inventory items...');
            fetchInventoryItems();
          }}
        >
          {inventoryLoading ? 'Loading...' : 'Refresh Inventory'}
        </Button>
          <Button
            style={{ marginRight: '10px' }}
            onClick={() => {
              if (inventoryItems.length > 0) {
                // Show a detailed alert with the first item structure
                const firstItem = inventoryItems[0];
                const structure = {};

                // Log each property and its type
                for (const key in firstItem) {
                  structure[key] = {
                    type: typeof firstItem[key],
                    value: String(firstItem[key]).substring(0, 50) // Truncate long values
                  };
                }

                // Create a displayable message
                const infoMsg = `Inventory data structure:\n${JSON.stringify(structure, null, 2)}`;
                console.log(infoMsg);
                message.info(`Found ${inventoryItems.length} inventory items. See console for details.`);

                // Alert with simplified info
                const fieldNames = Object.keys(firstItem).join(', ');
                alert(`Available fields: ${fieldNames}`);
              } else {
                message.warning('No inventory items available to inspect');
              }
            }}
          >
            Inspect Items
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handlePlaceOrder}
            size="large"
          >
            Place Order
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>      <Modal
        title="Place New Order"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={900}
        destroyOnClose={true}        footer={[
          <Button key="reset" onClick={() => {
            form.resetFields();
            // Reset with at least one empty item
            form.setFieldsValue({ items: [{}] });
            fetchInventoryItems();
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
          {inventoryItems.length === 0 && !inventoryLoading && (
            <Alert
              message="No inventory items found"
              description="Try refreshing the inventory data."
              type="warning"
              showIcon
              action={
                <Button size="small" type="ghost" onClick={fetchInventoryItems}>
                  <ReloadOutlined /> Refresh
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {inventoryItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Button onClick={() => {
                if (inventoryItems.length > 0) {
                  const firstItem = inventoryItems[0];
                  console.log('First inventory item full details:', firstItem);
                  message.info(`Available fields: ${Object.keys(firstItem).join(', ')}`);
                }
              }}>
                Show Available Fields
              </Button>
            </div>
          )}

          <Divider orientation="left">Order Items</Divider>
          
          <Row gutter={[12, 0]} style={{ marginBottom: 10 }}>
            <Col span={8}><strong>Item</strong></Col>
            <Col span={4}><strong>Quantity</strong></Col>
            <Col span={5}><strong>Purchase Type</strong></Col>
            <Col span={6}><strong>Notes</strong></Col>
            <Col span={1}><strong>Action</strong></Col>
          </Row>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row key={field.key} gutter={[12, 8]} style={{ marginBottom: 8 }}>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'inventoryItem']}
                        rules={[{ required: true, message: 'Select an item' }]}
                      >
                        <Select
                          placeholder="Select an item"
                          loading={inventoryLoading}
                          style={{ width: '100%' }}
                          options={(inventoryItems || []).map(item => ({
                            value: item._id,
                            label: `${item.itemName} - ₹${item.price} (${item.quantity} available)`,
                            item: item // Store full item for easy access
                          }))}
                          showSearch
                          filterOption={(input, option) => {
                            return option.label.toLowerCase().includes(input.toLowerCase());
                          }}
                          onChange={(value, option) => {
                            if (option?.item) {
                              console.log(`✅ [DoctorOrders] Selected inventory item: ${option.item.itemName}`);
                            }
                          }}
                        />
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

                    <Col span={5}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'purchaseType']}
                        rules={[{ required: true, message: 'Select type' }]}
                      >
                        <Select
                          placeholder="Purchase type"
                          options={[
                            { value: 'regular', label: 'Regular' },
                            { value: 'emergency', label: 'Emergency' }
                          ]}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
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
                        <Row justify="space-between" align="middle">
                          <Col span={16}>
                            <Text strong>{item.inventoryItem?.itemName || item.inventoryItem?.name || `Item ${index + 1}`}</Text>
                            <br />
                            <Text type="secondary">
                              Quantity: {item.quantity}
                              {item.purchaseType && ` • Type: ${item.purchaseType}`}
                            </Text>
                            {item.notes && (
                              <>
                                <br />
                                <Text type="secondary">Notes: {item.notes}</Text>
                              </>
                            )}
                          </Col>
                          <Col span={8} style={{ textAlign: 'right' }}>
                            {item.price && <Text strong>₹{item.price.toFixed(2)}</Text>}
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Additional Information */}
            {selectedOrder.notes && (
              <Card title="Order Notes" size="small" style={{ marginBottom: 16 }}>
                <Text>{selectedOrder.notes}</Text>
              </Card>
            )}

            {/* Photo Verification Section */}
            {(selectedOrder.pickupVerification || selectedOrder.deliveryVerification) && (
              <>
                <Divider orientation="left">
                  <CameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  Photo Verification
                </Divider>
                
                {/* Verification Status Summary */}
                <Alert
                  message="Verification Status"
                  description={
                    <div>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <CheckCircleOutlined 
                              style={{ 
                                color: selectedOrder.pickupVerification?.photo ? '#52c41a' : '#d9d9d9',
                                marginRight: '8px'
                              }} 
                            />
                            <span>Pickup Verified: </span>
                            <Tag color={selectedOrder.pickupVerification?.photo ? 'green' : 'default'}>
                              {selectedOrder.pickupVerification?.photo ? 'YES' : 'NO'}
                            </Tag>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <CheckCircleOutlined 
                              style={{ 
                                color: selectedOrder.deliveryVerification?.photo ? '#52c41a' : '#d9d9d9',
                                marginRight: '8px'
                              }} 
                            />
                            <span>Delivery Verified: </span>
                            <Tag color={selectedOrder.deliveryVerification?.photo ? 'green' : 'default'}>
                              {selectedOrder.deliveryVerification?.photo ? 'YES' : 'NO'}
                            </Tag>
                          </div>
                        </Col>
                      </Row>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EditOutlined 
                          style={{ 
                            color: selectedOrder.deliveryVerification?.customerSignature ? '#52c41a' : '#d9d9d9',
                            marginRight: '8px'
                          }} 
                        />
                        <span>Customer Signature: </span>
                        <Tag color={selectedOrder.deliveryVerification?.customerSignature ? 'green' : 'default'}>
                          {selectedOrder.deliveryVerification?.customerSignature ? 'OBTAINED' : 'NOT OBTAINED'}
                        </Tag>
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {/* Pickup Verification */}
                {selectedOrder.pickupVerification && (
                  <Card 
                    title={
                      <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Pickup Verification
                      </div>
                    }
                    size="small" 
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card 
                          title="Pickup Photo" 
                          size="small"
                          style={{ textAlign: 'center' }}
                        >
                          {selectedOrder.pickupVerification.photo ? (
                            <Image
                              src={selectedOrder.pickupVerification.photo}
                              alt="Pickup Verification"
                              style={{ maxWidth: '100%', maxHeight: '300px' }}
                              placeholder={
                                <div style={{ padding: '50px' }}>
                                  <CameraOutlined style={{ fontSize: '24px', color: '#ccc' }} />
                                  <div>Loading photo...</div>
                                </div>
                              }
                            />
                          ) : (
                            <div style={{ padding: '50px', color: '#999' }}>
                              <CameraOutlined style={{ fontSize: '24px' }} />
                              <div>No photo available</div>
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Verification Time">
                            <ClockCircleOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.pickupVerification.timestamp 
                              ? new Date(selectedOrder.pickupVerification.timestamp).toLocaleString()
                              : 'Not recorded'
                            }
                          </Descriptions.Item>
                          <Descriptions.Item label="Location">
                            <EnvironmentOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.pickupVerification.location?.address || 'Not recorded'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Notes">
                            <EditOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.pickupVerification.notes || 'No notes'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Delivery Verification */}
                {selectedOrder.deliveryVerification && (
                  <Card 
                    title={
                      <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Delivery Verification
                      </div>
                    }
                    size="small" 
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card 
                          title="Delivery Photo" 
                          size="small"
                          style={{ textAlign: 'center' }}
                        >
                          {selectedOrder.deliveryVerification.photo ? (
                            <Image
                              src={selectedOrder.deliveryVerification.photo}
                              alt="Delivery Verification"
                              style={{ maxWidth: '100%', maxHeight: '250px' }}
                              placeholder={
                                <div style={{ padding: '40px' }}>
                                  <CameraOutlined style={{ fontSize: '24px', color: '#ccc' }} />
                                  <div>Loading photo...</div>
                                </div>
                              }
                            />
                          ) : (
                            <div style={{ padding: '40px', color: '#999' }}>
                              <CameraOutlined style={{ fontSize: '24px' }} />
                              <div>No photo available</div>
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card 
                          title="Customer Signature" 
                          size="small"
                          style={{ textAlign: 'center' }}
                        >
                          {selectedOrder.deliveryVerification.customerSignature ? (
                            <Image
                              src={selectedOrder.deliveryVerification.customerSignature}
                              alt="Customer Signature"
                              style={{ maxWidth: '100%', maxHeight: '250px' }}
                              placeholder={
                                <div style={{ padding: '40px' }}>
                                  <EditOutlined style={{ fontSize: '24px', color: '#ccc' }} />
                                  <div>Loading signature...</div>
                                </div>
                              }
                            />
                          ) : (
                            <div style={{ padding: '40px', color: '#999' }}>
                              <EditOutlined style={{ fontSize: '24px' }} />
                              <div>No signature available</div>
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Customer Name">
                            {selectedOrder.deliveryVerification.customerName || 'Not recorded'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Delivery Time">
                            <ClockCircleOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.deliveryVerification.timestamp 
                              ? new Date(selectedOrder.deliveryVerification.timestamp).toLocaleString()
                              : 'Not recorded'
                            }
                          </Descriptions.Item>
                          <Descriptions.Item label="Location">
                            <EnvironmentOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.deliveryVerification.location?.address || 'Not recorded'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Notes">
                            <EditOutlined style={{ marginRight: 8 }} />
                            {selectedOrder.deliveryVerification.notes || 'No notes'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* No Verification Alert */}
                {!selectedOrder.pickupVerification && !selectedOrder.deliveryVerification && (
                  <Alert
                    message="No Photo Verification Available"
                    description="This order doesn't have any photo verification records. Photo verification is required for orders processed through the deliverer module."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;