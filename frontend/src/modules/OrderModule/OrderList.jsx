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
  Divider,
  Image,
  Alert,
  Descriptions
} from 'antd';
import {
  EyeOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  EditOutlined,
  ClockCircleOutlined
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
      });      const data = await response.json();
      if (data.success && data.result) {
        console.log('✅ Fetched order details with substitutions:', data.result);
        console.log('✅ Order items with correct IDs:', data.result.items?.map(item => ({ 
          id: item._id, 
          name: item.inventoryItem?.itemName,
          quantity: item.quantity 
        })));
        
        // Log the raw _id values to check for any hidden characters
        if (data.result.items) {
          console.log('🔍 RAW ORDER ITEM IDs FROM BACKEND:');
          data.result.items.forEach((item, index) => {
            console.log(`  Item ${index}: "${item._id}" (length: ${item._id?.length})`);
          });
        }
        
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
  };  // Handle substitution - SIMPLIFIED APPROACH
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

    // SIMPLE APPROACH: Use inventory item ID instead of order item ID
    // This eliminates the need for ID synchronization
    const inventoryItemId = selectedItem.inventoryItem._id;
    
    console.log('🚀 MAKING SUBSTITUTION REQUEST (SIMPLIFIED):');
    console.log(`  selectedOrderId: "${selectedOrderId}"`);
    console.log(`  inventoryItemId: "${inventoryItemId}"`);
    console.log(`  selectedReturn._id: "${selectedReturn._id}"`);
    console.log(`  quantityToSubstitute: ${substituteQuantity}`);

    setSubmitting(true);
    try {
      const requestBody = {
        inventoryItemId: inventoryItemId,  // Use inventory item ID instead of order item ID
        returnItemId: selectedReturn._id,
        quantityToSubstitute: substituteQuantity,
      };
      
      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`/api/order/${selectedOrderId}/substitute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

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
    // Clear previous order data to force fresh fetch
    setOrder(null);
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
    console.log('🔍 Item ID (toString):', item._id?.toString());
    console.log('🔍 Inventory Item:', item.inventoryItem);
    console.log('🔍 Inventory Item ID:', item.inventoryItem?._id);
    
    // Double-check against current order items in state
    if (order?.items) {
      console.log('🔍 All current order items in state:');
      order.items.forEach((orderItem, index) => {
        console.log(`  Item ${index}: ID=${orderItem._id}, Name=${orderItem.inventoryItem?.itemName}`);
      });
      
      // Verify this item exists in current order
      const itemExists = order.items.find(orderItem => orderItem._id?.toString() === item._id?.toString());
      if (!itemExists) {
        console.error('❌ Item not found in current order state! This is the problem.');
        message.error('Item data is stale. Please close and reopen the order details.');
        return;
      }
    }
    
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
    },    {
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
    },    {
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
                />                {/* Substitution History */}
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
                )}                {/* Photo Verification Section */}
                {(order.pickupVerification || order.deliveryVerification) && (
                  <>
                    <Title level={4}>
                      <CameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      Photo Verification
                    </Title>
                    
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
                                    color: order.pickupVerification?.photo ? '#52c41a' : '#d9d9d9',
                                    marginRight: '8px'
                                  }} 
                                />
                                <span>Pickup Verified: </span>
                                <Tag color={order.pickupVerification?.photo ? 'green' : 'default'}>
                                  {order.pickupVerification?.photo ? 'YES' : 'NO'}
                                </Tag>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <CheckCircleOutlined 
                                  style={{ 
                                    color: order.deliveryVerification?.photo ? '#52c41a' : '#d9d9d9',
                                    marginRight: '8px'
                                  }} 
                                />
                                <span>Delivery Verified: </span>
                                <Tag color={order.deliveryVerification?.photo ? 'green' : 'default'}>
                                  {order.deliveryVerification?.photo ? 'YES' : 'NO'}
                                </Tag>
                              </div>
                            </Col>
                          </Row>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <EditOutlined 
                              style={{ 
                                color: order.deliveryVerification?.customerSignature ? '#52c41a' : '#d9d9d9',
                                marginRight: '8px'
                              }} 
                            />
                            <span>Customer Signature: </span>
                            <Tag color={order.deliveryVerification?.customerSignature ? 'green' : 'default'}>
                              {order.deliveryVerification?.customerSignature ? 'OBTAINED' : 'NOT OBTAINED'}
                            </Tag>
                          </div>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    {/* Pickup Verification */}
                    {order.pickupVerification && (
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
                              {order.pickupVerification.photo ? (
                                <Image
                                  src={order.pickupVerification.photo}
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
                                {order.pickupVerification.timestamp 
                                  ? new Date(order.pickupVerification.timestamp).toLocaleString()
                                  : 'Not recorded'
                                }
                              </Descriptions.Item>
                              <Descriptions.Item label="Location">
                                <EnvironmentOutlined style={{ marginRight: 8 }} />
                                {order.pickupVerification.location?.address || 'Not recorded'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Notes">
                                <EditOutlined style={{ marginRight: 8 }} />
                                {order.pickupVerification.notes || 'No notes'}
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* Delivery Verification */}
                    {order.deliveryVerification && (
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
                              {order.deliveryVerification.photo ? (
                                <Image
                                  src={order.deliveryVerification.photo}
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
                              {order.deliveryVerification.customerSignature ? (
                                <Image
                                  src={order.deliveryVerification.customerSignature}
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
                                {order.deliveryVerification.customerName || 'Not recorded'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Delivery Time">
                                <ClockCircleOutlined style={{ marginRight: 8 }} />
                                {order.deliveryVerification.timestamp 
                                  ? new Date(order.deliveryVerification.timestamp).toLocaleString()
                                  : 'Not recorded'
                                }
                              </Descriptions.Item>
                              <Descriptions.Item label="Location">
                                <EnvironmentOutlined style={{ marginRight: 8 }} />
                                {order.deliveryVerification.location?.address || 'Not recorded'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Notes">
                                <EditOutlined style={{ marginRight: 8 }} />
                                {order.deliveryVerification.notes || 'No notes'}
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* No Verification Alert */}
                    {!order.pickupVerification && !order.deliveryVerification && (
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