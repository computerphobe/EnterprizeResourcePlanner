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
        ? `/api/order/${selectedOrderForAction._id}/pickup`
        : `/api/order/${selectedOrderForAction._id}/deliver`;

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
            </Card>

            {/* Order Items */}
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
                          <div>
                            <strong>Quantity:</strong> {item.quantity} | 
                            <strong> Price:</strong> ₹{item.price?.toFixed(2) || '0.00'}
                          </div>
                          {item.inventoryItem?.category && (
                            <div><strong>Category:</strong> {item.inventoryItem.category}</div>
                          )}
                          {item.inventoryItem?.batchNumber && (
                            <div><strong>Batch:</strong> {item.inventoryItem.batchNumber}</div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* Substitution Details */}
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
              >
                <Alert
                  message="Items Modified"
                  description={`${selectedOrder.substitutionSummary.itemsWithSubstitutions} out of ${selectedOrder.items?.length || 0} items have been modified with substitutions.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <List
                  header={<div><strong>Substitution History (Read-Only)</strong></div>}
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
                            <span style={{ color: '#f50' }}>Original:</span> {detail.originalItem}
                            <span style={{ margin: '0 8px' }}>→</span>
                            <span style={{ color: '#52c41a' }}>Replaced with:</span> {detail.returnedItem}
                          </div>
                        }
                        description={
                          <div>
                            <div>
                              <strong>Quantity Substituted:</strong> {detail.quantitySubstituted}
                            </div>
                            <div>
                              <strong>Substituted On:</strong> {new Date(detail.substitutedAt).toLocaleString()}
                            </div>
                            <div>
                              <strong>Substituted By:</strong> {detail.substitutedBy}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />

                <Divider />
                <Alert
                  message="Note for Deliverer"
                  description="These substitutions were made by the admin team to ensure product availability. Please verify the substituted items match the delivery requirements before delivery."
                  type="warning"
                  showIcon
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

      {/* Photo Verification Modal */}
      <Modal
        title={
          <div>
            <CameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {verificationType === 'pickup' ? 'Pickup Verification' : 'Delivery Verification'}
          </div>
        }
        open={verificationModalVisible}
        onCancel={closeVerificationModal}
        footer={[
          <Button key="cancel" onClick={closeVerificationModal}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleVerificationSubmit}
            loading={actionLoading === selectedOrderForAction?._id}
          >
            {verificationType === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
          </Button>
        ]}
        width={600}
      >
        {selectedOrderForAction && (
          <div>
            <Alert
              message={`${verificationType === 'pickup' ? 'Pickup' : 'Delivery'} Verification Required`}
              description={`Please provide photo verification ${verificationType === 'delivery' ? 'and customer signature ' : ''}for Order ${selectedOrderForAction.orderNumber}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={verificationForm} layout="vertical">
              {/* Photo Upload */}
              <Form.Item
                label="Photo Verification"
                required
                help="Take a photo to verify the action"
              >
                <Upload
                  beforeUpload={handlePhotoCapture}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<CameraOutlined />} size="large" block>
                    {capturedPhoto ? 'Retake Photo' : 'Capture Photo'}
                  </Button>
                </Upload>
                {capturedPhoto && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <img 
                      src={capturedPhoto} 
                      alt="Captured" 
                      style={{ maxWidth: '100%', maxHeight: 200, border: '1px solid #d9d9d9' }}
                    />
                  </div>
                )}
              </Form.Item>

              {/* Customer Details for Delivery */}
              {verificationType === 'delivery' && (
                <>
                  <Form.Item
                    label="Customer Name"
                    required
                  >
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Customer Signature"
                    required
                    help="Customer signature for delivery confirmation"
                  >
                    <div
                      style={{
                        border: '2px dashed #d9d9d9',
                        borderRadius: 6,
                        padding: 16,
                        textAlign: 'center',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <EditOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                      <div style={{ marginTop: 8 }}>
                        <Input
                          placeholder="Customer signature (text or draw)"
                          value={customerSignature}
                          onChange={(e) => setCustomerSignature(e.target.value)}
                        />
                      </div>
                    </div>
                  </Form.Item>
                </>
              )}

              {/* Notes */}
              <Form.Item label="Notes (Optional)">
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CurrentOrders;
