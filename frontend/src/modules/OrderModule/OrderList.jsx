import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Spin,
  Typography,
  message,
  Select,
  Button,
  Space,
  Modal,
  Card,
  Row,
  Col,
  InputNumber,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  EyeOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title, Text } = Typography;
const { Option } = Select;

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Substitution modal states
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [substitutionModalVisible, setSubstitutionModalVisible] = useState(false);
  const [order, setOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [itemSubstitutionModal, setItemSubstitutionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableReturns, setAvailableReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [substituteQuantity, setSubstituteQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/order/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data.result || []);
    } catch (error) {
      message.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch deliverers
  const fetchDeliverers = async () => {
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const delivererUsers = data.result.filter((user) => user.role === 'deliverer');
      setDeliverers(delivererUsers);
    } catch (error) {
      message.error(error.message || 'Failed to load deliverers');
    }
  };

  // Fetch order details with substitutions - FIXED VERSION
  const fetchOrderDetails = async (orderId) => {
    console.log('🔍 Fetching order details for orderId:', orderId);
    if (!orderId) return;

    setOrderLoading(true);
    try {
      // First try the substitutions endpoint
      const response = await fetch(`/api/order/${orderId}/substitutions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.result) {
        console.log('✅ Fetched order details with substitutions:', data.result);
        console.log('✅ Order items with correct IDs:', data.result.items?.map(item => ({ 
          id: item._id, 
          name: item.inventoryItem?.itemName,
          quantity: item.quantity 
        })));
        
        setOrder(data.result);
        return;
      }

      // Fallback to basic order fetch if substitutions endpoint fails
      console.log('⚠️ Substitutions endpoint failed, trying basic fetch...');
      const fallbackResponse = await fetch(`/api/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.success && fallbackData.result) {
        console.log('✅ Fallback order details:', fallbackData.result);
        console.log('✅ Fallback order items with IDs:', fallbackData.result.items?.map(item => ({ 
          id: item._id, 
          name: item.inventoryItem?.itemName,
          quantity: item.quantity 
        })));
        setOrder(fallbackData.result);
      } else {
        throw new Error(fallbackData.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      message.error(error.message || 'Failed to fetch order details');
    } finally {
      setOrderLoading(false);
    }
  };

  // Fetch available returned items for substitution
  const fetchAvailableReturns = async (inventoryItemId) => {
    try {
      const response = await fetch(`/api/order/returns/available/${inventoryItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setAvailableReturns(data.result);

      if (data.result.length === 0) {
        message.info('No returned items available for substitution for this product');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch available returns');
      console.error(error.message)
      setAvailableReturns([]);
    }
  };

  // Handle substitution - ENHANCED WITH BETTER DEBUGGING
  const handleSubstitution = async () => {
    if (!selectedReturn || !substituteQuantity) {
      message.error('Please select a return item and specify quantity');
      return;
    }

    if (substituteQuantity > selectedReturn.returnedQuantity) {
      message.error('Substitute quantity cannot exceed available returned quantity');
      return;
    }

    if (substituteQuantity > selectedItem.quantity) {
      message.error('Substitute quantity cannot exceed order item quantity');
      return;
    }

    // ENHANCED DEBUG LOGGING
    console.log('🔍 SUBSTITUTION DEBUG INFO:');
    console.log('Selected Order ID:', selectedOrderId);
    console.log('Selected Item Object:', selectedItem);
    console.log('Selected Item ID (_id):', selectedItem._id);
    console.log('Selected Item ID (toString):', selectedItem._id?.toString());
    console.log('Selected Return Object:', selectedReturn);
    console.log('Selected Return ID (_id):', selectedReturn._id);
    console.log('Quantity to substitute:', substituteQuantity);
    
    // Double-check current order items
    if (order?.items) {
      console.log('🔍 Current order items in state:');
      order.items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item._id,
          name: item.inventoryItem?.itemName,
          quantity: item.quantity
        });
      });
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/order/${selectedOrderId}/substitute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderItemId: selectedItem._id,
          returnItemId: selectedReturn._id,
          quantityToSubstitute: substituteQuantity,
        }),
      });
      console.log('selected item ID', selectedItem._id);
      const data = await response.json();
      console.log('🔍 Substitution response:', data);
      if (!data.success) throw new Error(data.message);

      message.success(data.message || 'Item substituted successfully');
      setItemSubstitutionModal(false);
      setSelectedItem(null);
      setSelectedReturn(null);
      setSubstituteQuantity(1);
      
      // Refresh order details after successful substitution
      await fetchOrderDetails(selectedOrderId);
    } catch (error) {
      console.error('❌ Substitution error:', error);
      message.error(error.message || 'Failed to substitute item');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign a deliverer to an order
  const assignDelivererToOrder = async (orderId, delivererId) => {
    try {
      const res = await fetch(`/api/order/${orderId}/assignDelivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delivererId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      message.success('Deliverer assigned successfully');
      fetchOrders(); // Refresh orders
    } catch (error) {
      message.error(error.message || 'Failed to assign deliverer');
    }
  };

  // Open order details modal
  const openOrderDetailsModal = (orderId) => {
    console.log('🔍 Opening order details modal for orderId:', orderId);
    setSelectedOrderId(orderId);
    setSubstitutionModalVisible(true);
    fetchOrderDetails(orderId);
  };

  // Close order details modal
  const closeOrderDetailsModal = () => {
    setSelectedOrderId(null);
    setSubstitutionModalVisible(false);
    setOrder(null);
    setItemSubstitutionModal(false);
    setSelectedItem(null);
    setSelectedReturn(null);
    setSubstituteQuantity(1);
  };

  // Open item substitution modal - ENHANCED WITH VALIDATION
  const openItemSubstitutionModal = (item) => {
    console.log('🔍 Opening substitution modal for item:', item);
    console.log('🔍 Item ID:', item._id);
    console.log('🔍 Inventory Item:', item.inventoryItem);
    console.log('🔍 Inventory Item ID:', item.inventoryItem?._id);
    
    // Validate that we have the required data
    if (!item._id) {
      message.error('Invalid item: Missing item ID');
      return;
    }
    
    if (!item.inventoryItem?._id) {
      message.error('Invalid item: Missing inventory item ID');
      return;
    }
    
    setSelectedItem(item);
    setItemSubstitutionModal(true);
    fetchAvailableReturns(item.inventoryItem._id);
  };

  // Calculate substituted quantity
  const calculateSubstitutedQuantity = (item) => {
    if (!item.substitutions || item.substitutions.length === 0) return 0;
    return item.substitutions.reduce((total, sub) => total + sub.quantitySubstituted, 0);
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchDeliverers();
    }
  }, [token]);

  // Main table columns
  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (type) => (
        <Tag color={type === 'doctor' ? 'volcano' : 'geekblue'}>{type?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Doctor Name',
      dataIndex: ['doctorId', 'name'],
      key: 'doctorName',
      render: (_, record) => record.doctorName || '—',
    },
    {
      title: 'Hospital Name',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      render: (text) => text || '—',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹ ${amount?.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'pending') color = 'gold';
        else if (status === 'processing') color = 'blue';
        else if (status === 'completed') color = 'green';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Assign Deliverer',
      key: 'assignDeliverer',
      render: (text, record) => (
        <Select
          style={{ width: 180 }}
          placeholder="Select Deliverer"
          onChange={(value) => assignDelivererToOrder(record._id, value)}
          disabled={!!record.delivererId}
          defaultValue={record.delivererId ? record.delivererId._id : undefined}
        >
          {deliverers.map((d) => (
            <Option key={d._id} value={d._id}>
              {d.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openOrderDetailsModal(record._id)}
          >
            View & Substitute
          </Button>
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  // Order items table columns
  const orderItemColumns = [
    {
      title: 'Item Name',
      dataIndex: ['inventoryItem', 'itemName'],
      key: 'itemName',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Category',
      dataIndex: ['inventoryItem', 'category'],
      key: 'category',
      render: (category) => category || 'N/A',
    },
    {
      title: 'Item ID (Debug)',
      key: 'itemId',
      render: (_, record) => (
        <Text code style={{ fontSize: '10px' }}>
          {record._id}
        </Text>
      ),
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => {
        const substituted = calculateSubstitutedQuantity(record);
        const remaining = qty - substituted;

        return (
          <Space direction="vertical" size={0}>
            <Text strong>{qty}</Text>
            {substituted > 0 && (
              <Text type="success" style={{ fontSize: '12px' }}>
                Substituted: {substituted}
              </Text>
            )}
            {remaining > 0 && (
              <Text type="warning" style={{ fontSize: '12px' }}>
                Remaining: {remaining}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price) => price ? `₹${price.toFixed(2)}` : 'N/A',
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => price ? `₹${price.toFixed(2)}` : 'N/A',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const substituted = calculateSubstitutedQuantity(record);
        const remaining = record.quantity - substituted;

        if (substituted === record.quantity) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>Fully Substituted</Tag>;
        } else if (substituted > 0) {
          return <Tag color="orange" icon={<ExclamationCircleOutlined />}>Partially Substituted</Tag>;
        } else {
          return <Tag color="blue">Pending</Tag>;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const substituted = calculateSubstitutedQuantity(record);
        const canSubstitute = substituted < record.quantity;

        return (
          <Space>
            <Tooltip title={canSubstitute ? 'Substitute with returned items' : 'Fully substituted'}>
              <Button
                type="primary"
                icon={<SwapOutlined />}
                size="small"
                disabled={!canSubstitute}
                onClick={() => openItemSubstitutionModal(record)}
              >
                Substitute
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Available returns table columns
  const availableReturnsColumns = [
    {
      title: 'Return Order',
      dataIndex: ['returnOrder', 'orderNumber'],
      key: 'returnOrderNumber',
      render: (orderNumber) => orderNumber || 'N/A',
    },
    {
      title: 'Return ID (Debug)',
      key: 'returnId',
      render: (_, record) => (
        <Text code style={{ fontSize: '10px' }}>
          {record._id}
        </Text>
      ),
    },
    {
      title: 'Returned Date',
      dataIndex: 'returnedDate',
      key: 'returnedDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Available Qty',
      dataIndex: 'returnedQuantity',
      key: 'returnedQuantity',
      render: (qty) => (
        <Badge count={qty} color="green" showZero>
          <Text>{qty} units</Text>
        </Badge>
      ),
    },
    {
      title: 'Expiry Date',
      dataIndex: ['inventoryItem', 'expiryDate'],
      key: 'expiryDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Batch Number',
      dataIndex: ['inventoryItem', 'batchNumber'],
      key: 'batchNumber',
      render: (batch) => batch || 'N/A',
    },
    {
      title: 'Select',
      key: 'select',
      render: (_, record) => (
        <Button
          type={selectedReturn?._id === record._id ? 'primary' : 'default'}
          size="small"
          onClick={() => setSelectedReturn(record)}
        >
          {selectedReturn?._id === record._id ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Orders Management</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <Table
            dataSource={orders}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />

          {/* Order Details & Substitution Modal */}
          <Modal
            title={`Order Details - ${order?.orderNumber || ''}`}
            visible={substitutionModalVisible}
            onCancel={closeOrderDetailsModal}
            width={1200}
            footer={[
              <Button key="close" onClick={closeOrderDetailsModal}>
                Close
              </Button>,
            ]}
          >
            {orderLoading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : order ? (
              <div>
                {/* Order Summary */}
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text strong>Order Number:</Text>
                      <br />
                      <Text>{order.orderNumber}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Order Type:</Text>
                      <br />
                      <Tag color={order.orderType === 'doctor' ? 'volcano' : 'geekblue'}>
                        {order.orderType?.toUpperCase()}
                      </Tag>
                    </Col>
                    <Col span={6}>
                      <Text strong>Total Amount:</Text>
                      <br />
                      <Text>₹{order.totalAmount?.toFixed(2)}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Status:</Text>
                      <br />
                      <Tag color={order.status === 'completed' ? 'green' : 'blue'}>
                        {order.status?.toUpperCase()}
                      </Tag>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                      <Text strong>Order ID (Debug):</Text>
                      <br />
                      <Text code>{order._id}</Text>
                    </Col>
                  </Row>
                </Card>

                {/* Order Items */}
                <Title level={4}>Order Items</Title>
                <Table
                  dataSource={order.items || []}
                  columns={orderItemColumns}
                  rowKey="_id"
                  pagination={false}
                  style={{ marginBottom: 24 }}
                />

                {/* Substitution History */}
                {order.items?.some(item => item.substitutions?.length > 0) && (
                  <>
                    <Title level={4}>Substitution History</Title>
                    {order.items
                      .filter(item => item.substitutions?.length > 0)
                      .map(item => (
                        <Card key={item._id} style={{ marginBottom: 16 }}>
                          <Title level={5}>{item.inventoryItem?.itemName}</Title>
                          <Table
                            dataSource={item.substitutions}
                            columns={[
                              {
                                title: 'Substituted Date',
                                dataIndex: 'substitutedDate',
                                key: 'substitutedDate',
                                render: (date) => new Date(date).toLocaleDateString(),
                              },
                              {
                                title: 'Quantity',
                                dataIndex: 'quantitySubstituted',
                                key: 'quantitySubstituted',
                              },
                              {
                                title: 'Return Order',
                                dataIndex: ['returnItem', 'returnOrder', 'orderNumber'],
                                key: 'returnOrderNumber',
                              },
                              {
                                title: 'Substituted By',
                                dataIndex: ['substitutedBy', 'name'],
                                key: 'substitutedBy',
                              },
                            ]}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                          />
                        </Card>
                      ))}
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text>No order data available</Text>
              </div>
            )}
          </Modal>

          {/* Item Substitution Modal */}
          <Modal
            title={`Substitute Item: ${selectedItem?.inventoryItem?.itemName || ''}`}
            visible={itemSubstitutionModal}
            onCancel={() => {
              setItemSubstitutionModal(false);
              setSelectedItem(null);
              setSelectedReturn(null);
              setSubstituteQuantity(1);
            }}
            onOk={handleSubstitution}
            confirmLoading={submitting}
            width={800}
            okText="Confirm Substitution"
            okButtonProps={{ disabled: !selectedReturn || !substituteQuantity }}
          >
            {selectedItem && (
              <div>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>Item:</Text>
                      <br />
                      <Text>{selectedItem.inventoryItem?.itemName}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>Ordered Quantity:</Text>
                      <br />
                      <Text>{selectedItem.quantity}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>Already Substituted:</Text>
                      <br />
                      <Text>{calculateSubstitutedQuantity(selectedItem)}</Text>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                      <Text strong>Item ID (Debug):</Text>
                      <br />
                      <Text code>{selectedItem._id}</Text>
                    </Col>
                  </Row>
                </Card>

                <Divider>Available Returned Items</Divider>

                {availableReturns.length > 0 ? (
                  <>
                    <Table
                      dataSource={availableReturns}
                      columns={availableReturnsColumns}
                      rowKey="_id"
                      pagination={false}
                      style={{ marginBottom: 16 }}
                    />

                    {selectedReturn && (
                      <Card>
                        <Row gutter={16} align="middle">
                          <Col span={12}>
                            <Text strong>Selected Return Item:</Text>
                            <br />
                            <Text>{selectedReturn.returnOrder?.orderNumber}</Text>
                            <br />
                            <Text type="secondary">
                              Available: {selectedReturn.returnedQuantity} units
                            </Text>
                            <br />
                            <Text code style={{ fontSize: '10px' }}>
                              ID: {selectedReturn._id}
                            </Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>Quantity to Substitute:</Text>
                            <br />
                            <InputNumber
                              min={1}
                              max={Math.min(
                                selectedReturn.returnedQuantity,
                                selectedItem.quantity - calculateSubstitutedQuantity(selectedItem)
                              )}
                              value={substituteQuantity}
                              onChange={setSubstituteQuantity}
                              style={{ width: '100%' }}
                            />
                          </Col>
                        </Row>
                      </Card>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <InfoCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <br />
                    <Text>No returned items available for substitution</Text>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default OrderList;