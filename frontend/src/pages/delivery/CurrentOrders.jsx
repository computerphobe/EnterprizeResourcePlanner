import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { 
  Table, 
  Button, 
  Typography, 
  Alert, 
  message, 
  Tag, 
  Modal, 
  Card, 
  Row, 
  Col, 
  Badge, 
  Descriptions, 
  Divider, 
  Tooltip,
  List,
  Input,
  Upload,
  Form,
  Space
} from 'antd';
import { 
  EyeOutlined, 
  SwapOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CurrentOrders = () => {  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  
  // Verification modal states
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'pickup' or 'delivery'
  const [verificationForm] = Form.useForm();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/order/current', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch current orders');
        }        const data = await response.json();

        if (data.success) {
          console.log('🔍 Fetched orders:', data.result);
          console.log('🔍 Order statuses:', data.result.map(order => ({ 
            id: order._id, 
            status: order.status,
            orderNumber: order.orderNumber 
          })));
          setOrders(data.result || []);
        } else {
          throw new Error(data.message || 'Failed to fetch current orders');
        }
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);  const handlePickup = async (id) => {
    // Open verification modal instead of direct pickup
    setSelectedOrderForAction(orders.find(order => order._id === id));
    setVerificationType('pickup');
    setVerificationModalVisible(true);
  };

  const handleDeliver = async (id) => {
    // Open verification modal instead of direct delivery
    setSelectedOrderForAction(orders.find(order => order._id === id));
    setVerificationType('delivery');
    setVerificationModalVisible(true);
  };

  // Open order details modal
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };
  // Close order details modal
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetailsVisible(false);
  };
  // Close verification modal
  const closeVerificationModal = () => {
    setVerificationModalVisible(false);
    setSelectedOrderForAction(null);
    setVerificationType(null);
    setCapturedPhoto(null);
    setCustomerSignature(null);
    setCustomerName('');
    setNotes('');
    setCurrentLocation('');
    verificationForm.resetFields();
  };

  // Handle photo capture for verification
  const handlePhotoCapture = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  // Handle signature capture for delivery verification
  const handleSignatureCapture = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomerSignature(e.target.result);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  // Handle verification form submission
  const handleVerificationSubmit = async (values) => {
    if (!capturedPhoto) {
      message.error('Please capture a photo for verification');
      return;
    }

    if (verificationType === 'delivery') {
      if (!customerSignature) {
        message.error('Please capture customer signature for delivery verification');
        return;
      }
      if (!values.customerName) {
        message.error('Please enter customer name for delivery verification');
        return;
      }
    }

    try {
      setActionLoading(selectedOrderForAction._id);

      const requestData = {
        photo: capturedPhoto,
        notes: values.notes || '',
        location: currentLocation ? { address: currentLocation } : null
      };

      // Add delivery-specific fields
      if (verificationType === 'delivery') {
        requestData.customerSignature = customerSignature;
        requestData.customerName = values.customerName;
      }

      const endpoint = verificationType === 'pickup'
        ? `/api/order/${selectedOrderForAction._id}/mark-pickup`
        : `/api/order/${selectedOrderForAction._id}/mark-delivered`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${verificationType} order`);
      }

      if (data.success) {
        message.success(data.message || `Order ${verificationType} completed successfully`);
        
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === selectedOrderForAction._id 
              ? { ...order, status: data.result.status }
              : order
          )
        );

        // Close modal and reset
        closeVerificationModal();
      } else {
        throw new Error(data.message || `Failed to ${verificationType} order`);
      }
    } catch (error) {
      console.error(`Error during ${verificationType}:`, error);
      message.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };
  // Status tag colors for better UX
  const statusColors = {
    pending: 'gold',
    processing: 'orange', 
    picked_up: 'blue',
    completed: 'green',
    cancelled: 'red',
  };
  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 180,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text.slice(-8)}</span>,
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => record.doctorId?.name || '-',
    },
    {
      title: 'Hospital',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={statusColors[text] || 'default'}>
          {text.charAt(0).toUpperCase() + text.slice(1).replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <div>
          <div>
            {record.items?.map((item) => item.inventoryItem?.itemName || 'Unnamed Item').join(', ') || '-'}
          </div>
          {record.hasSubstitutions && (
            <div style={{ marginTop: 4 }}>
              <Badge 
                count={record.substitutionSummary?.totalSubstitutions || 0} 
                style={{ backgroundColor: '#f50' }}
              >
                <Tag icon={<SwapOutlined />} color="orange" size="small">
                  Substitutions
                </Tag>
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <Button
          type="default"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => openOrderDetails(record)}
        >
          View Details
        </Button>
      ),
    },    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        console.log('🔍 Rendering action for order:', { id: record._id, status: record.status });
        
        if (record.status === 'pending' || record.status === 'processing') {
          return (
            <Button
              type="default"
              onClick={() => handlePickup(record._id)}
              loading={actionLoading === record._id}
              disabled={actionLoading !== null && actionLoading !== record._id}
            >
              Mark as Picked Up
            </Button>
          );
        } else if (record.status === 'picked_up') {
          return (
            <Button
              type="primary"
              onClick={() => handleDeliver(record._id)}
              loading={actionLoading === record._id}
              disabled={actionLoading !== null && actionLoading !== record._id}
            >
              Mark as Delivered
            </Button>
          );
        }
        return (
          <span style={{ color: '#999' }}>
            No action available (Status: {record.status})
          </span>
        );
      },
    },
  ];
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Current Orders</Title>
      {loading ? (
        <Alert message="Loading current orders..." type="info" />
      ) : orders.length === 0 ? (
        <Alert message="No current orders to display" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={{ pageSize: 5 }}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        title={
          <div>
            <span>Order Details</span>
            {selectedOrder?.hasSubstitutions && (
              <Tag icon={<SwapOutlined />} color="orange" style={{ marginLeft: 8 }}>
                Has Substitutions
              </Tag>
            )}
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
                <Col span={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order Number">
                      <Tag color="blue">{selectedOrder.orderNumber}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={statusColors[selectedOrder.status] || 'default'}>
                        {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1).replace('_', ' ')}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Doctor">
                      {selectedOrder.doctorId?.name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hospital">
                      {selectedOrder.hospitalName || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Total Amount">
                      ₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>            {/* Order Items */}
            <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
              <List
                itemLayout="horizontal"
                dataSource={selectedOrder.items || []}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          count={item.substitutions?.length || 0} 
                          showZero={false}
                          style={{ backgroundColor: '#f50' }}
                        >
                          <div 
                            style={{ 
                              width: 40, 
                              height: 40, 
                              backgroundColor: '#f0f0f0', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </div>
                        </Badge>
                      }
                      title={
                        <div>
                          <span style={{ fontWeight: 'bold' }}>
                            {item.inventoryItem?.itemName || 'Unknown Item'}
                          </span>
                          {item.substitutions && item.substitutions.length > 0 && (
                            <Tag icon={<SwapOutlined />} color="orange" size="small" style={{ marginLeft: 8 }}>
                              Modified
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Text strong>Quantity:</Text> {item.quantity}
                            </Col>
                            <Col span={6}>
                              <Text strong>Unit Price:</Text> ₹{((item.price || 0) / (item.quantity || 1)).toFixed(2)}
                            </Col>
                            <Col span={6}>
                              <Text strong>Total:</Text> ₹{(item.price || 0).toFixed(2)}
                            </Col>
                            <Col span={6}>
                              {item.inventoryItem?.category && (
                                <div><Text strong>Category:</Text> {item.inventoryItem.category}</div>
                              )}
                            </Col>
                          </Row>
                          {item.inventoryItem?.batchNumber && (
                            <div style={{ marginTop: 4 }}>
                              <Text strong>Batch:</Text> {item.inventoryItem.batchNumber}
                            </div>
                          )}
                          {item.substitutions && item.substitutions.length > 0 && (
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff7e6', borderRadius: 4 }}>
                              <Text strong style={{ color: '#fa8c16' }}>Substitutions Applied:</Text>
                              {item.substitutions.map((sub, subIndex) => (
                                <div key={subIndex} style={{ marginTop: 4, fontSize: '12px' }}>
                                  <Tag size="small" color="orange">
                                    {sub.quantitySubstituted} units substituted
                                  </Tag>
                                  <Text type="secondary">
                                    by {sub.substitutedBy?.name || 'Unknown'} on {new Date(sub.substitutedAt).toLocaleDateString()}
                                  </Text>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>{/* Returns Information */}
            {selectedOrder.returnInfo?.hasReturns && (
              <Card 
                title={
                  <div>
                    <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    Returns Information
                    <Badge 
                      count={selectedOrder.returnInfo.itemsWithReturns} 
                      style={{ backgroundColor: '#1890ff', marginLeft: 8 }} 
                    />
                  </div>
                } 
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Items with Returns">
                        <Tag color="orange">{selectedOrder.returnInfo.itemsWithReturns}</Tag> / {selectedOrder.returnInfo.totalItems}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={6}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Total Returned Qty">
                        <Tag color="red">{selectedOrder.returnInfo.totalReturnedQuantity}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={6}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Return Rate">
                        <Tag color="purple">
                          {((selectedOrder.returnInfo.totalReturnedQuantity / selectedOrder.returnInfo.totalOriginalQuantity) * 100).toFixed(1)}%
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={6}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Returned Value">
                        <Tag color="green">₹{selectedOrder.returnInfo.totalReturnedValue?.toFixed(2) || '0.00'}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>

                {/* Detailed Return Items */}
                {selectedOrder.returnInfo.returnDetails && selectedOrder.returnInfo.returnDetails.length > 0 && (
                  <div>
                    <Divider orientation="left" orientationMargin="0">
                      <Text strong>Returned Items Details</Text>
                    </Divider>
                    <List
                      itemLayout="horizontal"
                      dataSource={selectedOrder.returnInfo.returnDetails}
                      renderItem={(returnDetail, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <div 
                                style={{ 
                                  width: 40, 
                                  height: 40, 
                                  backgroundColor: '#fff1f0', 
                                  borderRadius: '50%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  border: '2px solid #ff4d4f'
                                }}
                              >
                                <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                  {index + 1}
                                </Text>
                              </div>
                            }
                            title={
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text strong>{returnDetail.itemName}</Text>
                                <Tag color="orange" size="small">
                                  {returnDetail.returnedQuantity}/{returnDetail.originalQuantity} returned
                                </Tag>
                              </div>
                            }
                            description={
                              <div>
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Text type="secondary">Unit Price: </Text>
                                    <Text strong>₹{returnDetail.itemPrice?.toFixed(2) || '0.00'}</Text>
                                  </Col>
                                  <Col span={8}>
                                    <Text type="secondary">Returned Value: </Text>
                                    <Text strong style={{ color: '#ff4d4f' }}>
                                      ₹{returnDetail.returnedValue?.toFixed(2) || '0.00'}
                                    </Text>
                                  </Col>
                                  <Col span={8}>
                                    <Text type="secondary">Return Rate: </Text>
                                    <Text strong>
                                      {((returnDetail.returnedQuantity / returnDetail.originalQuantity) * 100).toFixed(1)}%
                                    </Text>
                                  </Col>
                                </Row>
                                {returnDetail.returns && returnDetail.returns.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      Return History: {returnDetail.returns.map((ret, idx) => (
                                        <Tag key={idx} size="small" color="volcano" style={{ margin: '2px' }}>
                                          {ret.quantity} × {ret.status}
                                        </Tag>
                                      ))}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </Card>
            )}            {/* Substitution Details */}
            {selectedOrder.hasSubstitutions && selectedOrder.substitutionSummary && (
              <Card 
                title={
                  <div>
                    <SwapOutlined style={{ marginRight: 8, color: '#f50' }} />
                    Substitution Details
                    <Badge 
                      count={selectedOrder.substitutionSummary.totalSubstitutions} 
                      style={{ backgroundColor: '#f50', marginLeft: 8 }}
                    />
                  </div>
                } 
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Alert
                  message="Items Modified"
                  description={`${selectedOrder.substitutionSummary.itemsWithSubstitutions} out of ${selectedOrder.items?.length || 0} items have been modified with substitutions.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <List
                  header={<div><strong>Substitution History</strong></div>}
                  itemLayout="horizontal"
                  dataSource={selectedOrder.substitutionSummary.details || []}
                  renderItem={(detail, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              backgroundColor: '#fff2e8', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '2px solid #ffa940'
                            }}
                          >
                            <SwapOutlined style={{ color: '#ffa940' }} />
                          </div>
                        }
                        title={
                          <div>
                            <Text strong>{detail.originalItem}</Text>
                            <Tag color="orange" size="small" style={{ marginLeft: 8 }}>
                              {detail.quantitySubstituted} units substituted
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <Row gutter={16}>
                              <Col span={8}>
                                <Text type="secondary">Returned Item: </Text>
                                <Text>{detail.returnedItem}</Text>
                              </Col>
                              <Col span={8}>
                                <Text type="secondary">Substituted by: </Text>
                                <Text>{detail.substitutedBy}</Text>
                              </Col>
                              <Col span={8}>
                                <Text type="secondary">Date: </Text>
                                <Text>{new Date(detail.substitutedAt).toLocaleDateString()}</Text>
                              </Col>
                            </Row>
                          </div>                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Verification Modal */}
      <Modal
        title={`Order ${verificationType === 'pickup' ? 'Pickup' : 'Delivery'} Verification`}
        open={verificationModalVisible}
        onCancel={closeVerificationModal}
        footer={null}
        width={600}
      >
        <Form
          form={verificationForm}
          layout="vertical"
          onFinish={handleVerificationSubmit}
          initialValues={{
            notes: '',
            customerName: '',
          }}
        >
          <Form.Item
            label="Verification Photo"
            required
            tooltip="Capture a clear photo as proof of {verificationType === 'pickup' ? 'pickup' : 'delivery'}."
          >
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handlePhotoCapture}
              onRemove={() => setCapturedPhoto(null)}
            >
              <Button icon={<CameraOutlined />}>
                {capturedPhoto ? 'Retake Photo' : 'Capture Photo'}
              </Button>
            </Upload>
            {capturedPhoto && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={capturedPhoto}
                  alt="Verification"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </div>
            )}
          </Form.Item>

          {verificationType === 'delivery' && (
            <>
              <Form.Item
                label="Customer Name"
                name="customerName"
                rules={[{ required: true, message: 'Customer name is required' }]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>

              <Form.Item
                label="Customer Signature"
                required
                tooltip="Capture the customer's signature for delivery verification."
              >
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleSignatureCapture}
                  onRemove={() => setCustomerSignature(null)}
                >
                  <Button icon={<CameraOutlined />}>
                    {customerSignature ? 'Retake Signature' : 'Capture Signature'}
                  </Button>
                </Upload>
                {customerSignature && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={customerSignature}
                      alt="Signature"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                )}
              </Form.Item>
            </>
          )}

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Enter any additional notes" />
          </Form.Item>

          <Form.Item label="Current Location">
            <Input
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="Enter current location (optional)"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={actionLoading}>
              Submit Verification
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CurrentOrders;
