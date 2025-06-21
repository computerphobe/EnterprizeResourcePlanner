import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Form, Select, InputNumber, message, Input, Spin, Alert, Row, Col, Divider, Card, Descriptions, List } from 'antd';
import { EyeOutlined, FilePdfOutlined, PlusOutlined, ReloadOutlined, WarningOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

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
  }; const fetchInventoryItems = async () => {
    setInventoryLoading(true);
    try {
      const response = await fetch('/api/inventory/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });      const data = await response.json(); if (data.success && Array.isArray(data.result)) {
        console.log('Inventory items loaded successfully, count:', data.result.length);
        setInventoryItems(data.result);
      } else {
        console.warn('Inventory items not returned as expected:', data);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      message.error('Failed to fetch inventory items');
      setInventoryItems([]);
    } finally {
      setInventoryLoading(false);
    }
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
      key: 'items', render: (items) => (
        <span>
          {Array.isArray(items) ?
            items.map(item => item?.inventoryItem?.name || 'Unknown Item').join(', ') :
            'No items'}
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
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
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
      }

      // Create order data with multiple items
      const orderData = {
        items: values.items.map(item => ({
          inventoryItem: item.inventoryItem,
          quantity: item.quantity,
          price: 0, // Default price, will be updated by backend
          purchaseType: item.purchaseType || 'regular',
          notes: item.notes || ''
        })),
        totalAmount: 0, // Will be calculated on backend
        status: 'pending',
        orderType: 'doctor',
        doctorId: current?.id || '',
        doctorName: current?.name || 'Unknown Doctor',
        hospitalName: current?.hospitalName || 'Unknown Hospital',
        createdBy: current?.id || '',
        notes: values.orderNotes || ''
      };

      const response = await fetch('/api/doctor/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

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
                          options={(inventoryItems || []).map(item => {
                            const itemId = item._id || item.id || item.inventoryId || '';
                            let itemName = 'Unknown Item';
                            
                            for (const key in item) {
                              if (
                                typeof item[key] === 'string' &&
                                (key.toLowerCase().includes('name') ||
                                  key.toLowerCase() === 'title' ||
                                  key.toLowerCase() === 'label')
                              ) {
                                itemName = item[key];
                                break;
                              }
                            }

                            let itemSku = '';
                            for (const key in item) {
                              if (
                                typeof item[key] === 'string' &&
                                (key.toLowerCase().includes('sku') ||
                                  key.toLowerCase().includes('code') ||
                                  key.toLowerCase() === 'id')
                              ) {
                                itemSku = item[key];
                                break;
                              }
                            }

                            if (itemName === 'Unknown Item') {
                              for (const key in item) {
                                if (typeof item[key] === 'string' && item[key].length > 0) {
                                  itemName = `${key}: ${item[key]}`;
                                  break;
                                }
                              }
                            }

                            return {
                              value: itemId,
                              label: itemSku ? `${itemName} - ${itemSku}` : itemName
                            };
                          })}                          showSearch
                          filterOption={(input, option) => {
                            const label = option?.label || option?.children || '';
                            const searchString = typeof label === 'string' ? label : String(label || '');
                            const inputString = typeof input === 'string' ? input : String(input || '');
                            return searchString.toLowerCase().includes(inputString.toLowerCase());
                          }}
                          onChange={(value) => {
                            const selectedItem = inventoryItems.find(item =>
                              item._id === value || item.id === value || item.inventoryId === value
                            );
                            if (selectedItem) {
                              message.success(`Selected: ${selectedItem.name || selectedItem.title || selectedItem.productName || 'Item'}`);
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