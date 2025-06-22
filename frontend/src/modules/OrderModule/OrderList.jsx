import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/serverApiConfig';
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
  Descriptions,
  Progress
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
  const token = current?.token || '';  // Fetch orders with enhanced customer and inventory information
  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching complete order list with customer and inventory details...');
      const res = await fetch(`${API_BASE_URL}order/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch orders');
        // Log some information about the returned data for debugging
      console.log(`✅ Successfully fetched ${data.result?.length || 0} orders`);
      if (data.result && data.result.length > 0) {
        console.log('📊 Sample order data structure:', {
          customerFields: {
            doctorId: data.result[0].doctorId,
            doctorName: data.result[0].doctorName,
            hospitalName: data.result[0].hospitalName
          },
          orderFields: {
            orderNumber: data.result[0].orderNumber,
            orderType: data.result[0].orderType,
            status: data.result[0].status,
            totalAmount: data.result[0].totalAmount
          },
          itemsCount: data.result[0].items?.length || 0,
          verificationData: {
            hasPickupVerification: !!data.result[0].pickupVerification,
            hasDeliveryVerification: !!data.result[0].deliveryVerification,
            pickupPhoto: data.result[0].pickupVerification?.photo ? 'HAS PHOTO' : 'NO PHOTO',
            deliveryPhoto: data.result[0].deliveryVerification?.photo ? 'HAS PHOTO' : 'NO PHOTO'
          }
        });
      }
      
      setOrders(data.result || []);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      message.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch deliverers
  const fetchDeliverers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}admin/list`, {
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
  // Enhanced order details fetching with substitutions and inventory details
  const fetchOrderDetails = async (orderId) => {
    console.log('🔍 Fetching enhanced order details for orderId:', orderId);
    if (!orderId) return;

    setOrderLoading(true);
    try {
      // First try the substitutions endpoint (with detailed error handling)      console.log(`📡 Calling API: ${API_BASE_URL}order/${orderId}/substitutions`);
      try {
        const response = await fetch(`${API_BASE_URL}order/${orderId}/substitutions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Substitutions endpoint returned status ${response.status}`);
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.result) {
          console.log('✅ Successfully fetched order details with substitutions:');
          console.log('  - Order Number:', data.result.orderNumber);
          console.log('  - Order Type:', data.result.orderType);
          console.log('  - Total Items:', data.result.items?.length || 0);
          console.log('  - Customer:', data.result.doctorId?.name || data.result.doctorName || 'Unknown');
          
          // Check for important customer data fields
          const customerFields = data.result.doctorId ? Object.keys(data.result.doctorId) : [];
          console.log('  - Available Customer Fields:', customerFields.join(', '));
          
          // Check if items have inventory information
          if (data.result.items && data.result.items.length > 0) {
            const sampleItem = data.result.items[0];
            const inventoryFields = sampleItem.inventoryItem ? Object.keys(sampleItem.inventoryItem) : [];
            console.log('  - Available Inventory Fields:', inventoryFields.join(', '));
            
            // Check for substitutions
            let totalSubstitutions = 0;
            data.result.items.forEach(item => {
              if (item.substitutions && item.substitutions.length > 0) {
                totalSubstitutions += item.substitutions.length;
              }
            });
            console.log('  - Total Substitutions:', totalSubstitutions);
          }
          
          setOrder(data.result);
          return;
        } else {
          throw new Error(data.message || 'API returned success:false');
        }
      } catch (substitutionError) {
        // Log the error and continue to fallback
        console.warn('⚠️ Failed to fetch from substitutions endpoint:', substitutionError.message);
      }

      // Fallback to basic order fetch      console.log(`📡 Calling fallback API: ${API_BASE_URL}order/${orderId}`);
      const fallbackResponse = await fetch(`${API_BASE_URL}order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!fallbackResponse.ok) {
        console.error(`❌ Fallback endpoint returned status ${fallbackResponse.status}`);
        throw new Error(`Fallback API returned status ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.success && fallbackData.result) {
        console.log('✅ Successfully fetched basic order details (without substitutions)');
        
        // Display warning for missing substitution data
        message.warning('Order loaded without substitution details. Some features may be limited.', 3);
        
        setOrder(fallbackData.result);
      } else {
        throw new Error(fallbackData.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      message.error(`Failed to fetch order details: ${error.message}`);
    } finally {
      setOrderLoading(false);
    }
  };

  // Fetch available returned items for substitution
  const fetchAvailableReturns = async (inventoryItemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}order/returns/available/${inventoryItemId}`, {
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
      
      const response = await fetch(`${API_BASE_URL}order/${selectedOrderId}/substitute`, {
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
      const res = await fetch(`${API_BASE_URL}order/${orderId}/assignDelivery`, {
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
  }, [token]);  // Enhanced main table columns with complete customer and order information
  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {new Date(record.createdAt).toLocaleDateString()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (type, record) => (
        <div>
          <Tag color={type === 'doctor' ? 'volcano' : 'geekblue'}>
            {type?.toUpperCase()}
          </Tag>
          {record.items && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.items.length} items
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Customer Information',
      key: 'customerInfo',
      render: (_, record) => {
        // Show doctor name from either doctorId or doctorName field
        const displayName = (record.doctorId && record.doctorId.name) || record.doctorName || '—';
        const email = record.doctorId?.email || '—';
        const role = record.doctorId?.role || '—';
        
        return (
          <div>
            <div>
              <Text strong>{displayName}</Text>
              {role !== '—' && (
                <Tag style={{ marginLeft: '4px' }} color="cyan" size="small">
                  {role.toUpperCase()}
                </Tag>
              )}
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }} copyable={email !== '—'}>
                {email}
              </Text>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Facility Details',
      key: 'facilityDetails',
      render: (_, record) => {
        // Show hospital name from either record or doctorId
        const hospitalName = record.hospitalName || record.doctorId?.hospitalName || '—';
        const address = record.doctorId?.address || '—';
        
        return (
          <div>
            <div>
              <Text strong>{hospitalName}</Text>
            </div>
            {address !== '—' && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <EnvironmentOutlined style={{ marginRight: '4px' }} />
                  {address}
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Contact',
      key: 'contactInfo',
      render: (_, record) => {
        const phone = record.doctorId?.phone || record.doctorId?.mobile || '—';
        const alternateContact = record.doctorId?.alternateContact || '—';
        
        return (
          <div>
            <div>
              <Text copyable={phone !== '—'}>{phone}</Text>
            </div>
            {alternateContact !== '—' && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }} copyable>
                  Alt: {alternateContact}
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Financial',
      key: 'financial',
      render: (_, record) => (
        <div>
          <div>
            <Text strong>₹{record.totalAmount?.toFixed(2) || '0.00'}</Text>
          </div>
          <div>
            <Tag color={record.status === 'completed' ? 'green' : 
                      record.status === 'pending' ? 'orange' : 
                      record.status === 'processing' ? 'blue' : 'default'}>
              {record.status?.toUpperCase()}
            </Tag>
          </div>
        </div>
      ),
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
  // Enhanced order items table columns with detailed inventory information
  const orderItemColumns = [
    {
      title: 'Item Details',
      key: 'itemDetails',
      render: (_, record) => {
        const itemName = record.inventoryItem?.itemName || 'N/A';
        const category = record.inventoryItem?.category || 'N/A';
        const manufacturer = record.inventoryItem?.manufacturer || 'N/A';
        const description = record.inventoryItem?.description || '';
        
        return (
          <div>
            <div>
              <Text strong>{itemName}</Text>
              <Tag color="blue" style={{ marginLeft: '8px' }}>{category}</Tag>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Manufacturer: {manufacturer}
              </Text>
            </div>
            {description && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {description.length > 40 ? `${description.substring(0, 40)}...` : description}
                </Text>
              </div>
            )}
            <div style={{ marginTop: '4px' }}>
              <Text code style={{ fontSize: '10px' }}>
                ID: {record._id}
              </Text>
            </div>
          </div>
        );
      },
      width: '30%',
    },
    {
      title: 'Specifications',
      key: 'specifications',
      render: (_, record) => {
        const batchNumber = record.inventoryItem?.batchNumber || 'N/A';
        const expiryDate = record.inventoryItem?.expiryDate 
          ? new Date(record.inventoryItem.expiryDate).toLocaleDateString()
          : 'N/A';
          
        // Calculate if item is expired or about to expire
        let expiryStatus = 'normal';
        let expiryColor = 'default';
        
        if (record.inventoryItem?.expiryDate) {
          const now = new Date();
          const expiryDate = new Date(record.inventoryItem.expiryDate);
          const daysToExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysToExpiry < 0) {
            expiryStatus = 'Expired';
            expiryColor = 'red';
          } else if (daysToExpiry < 30) {
            expiryStatus = 'Expiring Soon';
            expiryColor = 'orange';
          }
        }
        
        return (
          <div>
            <div>
              <Text strong>Batch: </Text>
              <Text>{batchNumber}</Text>
            </div>
            <div>
              <Text strong>Expiry: </Text>
              {expiryStatus !== 'normal' ? (
                <Tag color={expiryColor}>{expiryStatus} - {expiryDate}</Tag>
              ) : (
                <Text>{expiryDate}</Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Quantity & Status',
      key: 'quantityStatus',
      render: (_, record) => {
        const qty = record.quantity || 0;
        const substituted = calculateSubstitutedQuantity(record);
        const remaining = qty - substituted;

        return (
          <div>
            <div>
              <Text strong style={{ fontSize: '16px' }}>{qty}</Text>
              <Text type="secondary"> units</Text>
            </div>
            {substituted > 0 && (
              <div>
                <Badge status="success" />
                <Text type="success" style={{ fontSize: '12px' }}>
                  Substituted: {substituted}
                </Text>
              </div>
            )}
            {remaining > 0 && (
              <div>
                <Badge status="warning" />
                <Text type="warning" style={{ fontSize: '12px' }}>
                  Remaining: {remaining}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (_, record) => {
        const unitPrice = record.unitPrice || record.inventoryItem?.price || 0;
        const totalPrice = record.totalPrice || (unitPrice * record.quantity) || 0;
        
        return (
          <div>
            <div>
              <Text strong>Unit: </Text>
              <Text>₹{unitPrice.toFixed(2)}</Text>
            </div>
            <div>
              <Text strong>Total: </Text>
              <Text style={{ fontWeight: 'bold' }}>₹{totalPrice.toFixed(2)}</Text>
            </div>
          </div>
        );
      },
    },    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const substituted = calculateSubstitutedQuantity(record);
        const remaining = record.quantity - substituted;
        const percentage = record.quantity > 0 ? Math.round((substituted / record.quantity) * 100) : 0;

        if (substituted === record.quantity) {
          return (
            <div>
              <Tag color="green" icon={<CheckCircleOutlined />}>Fully Substituted</Tag>
              <div style={{ marginTop: '6px' }}>
                <Progress percent={100} size="small" status="success" showInfo={false} />
                <div style={{ textAlign: 'center', fontSize: '11px' }}>
                  <Text type="success">100% Complete</Text>
                </div>
              </div>
            </div>
          );
        } else if (substituted > 0) {
          return (
            <div>
              <Tag color="orange" icon={<ExclamationCircleOutlined />}>Partially Substituted</Tag>
              <div style={{ marginTop: '6px' }}>
                <Progress percent={percentage} size="small" status="active" showInfo={false} />
                <div style={{ textAlign: 'center', fontSize: '11px' }}>
                  <Text type="warning">{percentage}% Complete</Text>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <Tag color="blue">Pending Substitution</Tag>
              <div style={{ marginTop: '6px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <div style={{ textAlign: 'center', fontSize: '11px' }}>
                  <Text type="secondary">Not Started</Text>
                </div>
              </div>
            </div>
          );
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
      title: 'Return ID',
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
              <div>                {/* Order Summary */}
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
                  
                  {/* Customer Details */}
                  <Divider orientation="left">Customer Information</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text strong>Customer Name:</Text>
                      <br />
                      <Text>{(order.doctorId && order.doctorId.name) || order.doctorName || 'N/A'}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Hospital/Facility:</Text>
                      <br />
                      <Text>{order.hospitalName || (order.doctorId && order.doctorId.hospitalName) || 'N/A'}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Email:</Text>
                      <br />
                      <Text copyable>{(order.doctorId && order.doctorId.email) || 'N/A'}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Phone:</Text>
                      <br />
                      <Text copyable>{(order.doctorId && (order.doctorId.phone || order.doctorId.mobile)) || 'N/A'}</Text>
                    </Col>
                  </Row>
                  
                  {order.doctorId && order.doctorId.address && (
                    <Row style={{ marginTop: 16 }}>
                      <Col span={24}>
                        <Text strong>Address:</Text>
                        <br />
                        <Text>{order.doctorId.address}</Text>
                      </Col>
                    </Row>
                  )}
                  
                  <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                      <Text strong>Order ID:</Text>
                      <br />
                      <Text code>{order._id}</Text>
                    </Col>
                  </Row>
                </Card>

                {/* Enhanced Customer Details Section */}
                {order.doctorId && (
                  <Card 
                    title={
                      <div>
                        <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                        Detailed Customer Information
                      </div>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Customer ID" span={2}>
                        <Text code>{order.doctorId._id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Name">
                        {order.doctorId.name || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Role">
                        <Tag color="blue">{order.doctorId.role?.toUpperCase() || 'N/A'}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        <Text copyable>{order.doctorId.email || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        <Text copyable>{order.doctorId.phone || order.doctorId.mobile || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Hospital/Facility" span={2}>
                        {order.hospitalName || order.doctorId.hospitalName || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Address" span={2}>
                        {order.doctorId.address || 'N/A'}
                      </Descriptions.Item>
                      {order.doctorId.specialization && (
                        <Descriptions.Item label="Specialization" span={2}>
                          {order.doctorId.specialization}
                        </Descriptions.Item>
                      )}
                      {order.doctorId.notes && (
                        <Descriptions.Item label="Notes" span={2}>
                          {order.doctorId.notes}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                )}

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
                            >                              {order.pickupVerification.photo ? (
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
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
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
                            >                              {order.deliveryVerification.photo ? (
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
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
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
                            >                              {order.deliveryVerification.customerSignature ? (
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
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
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
                      <Text strong>Item ID:</Text>
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