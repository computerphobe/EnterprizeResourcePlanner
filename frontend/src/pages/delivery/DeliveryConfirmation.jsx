import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { 
  Table, 
  Button, 
  Typography, 
  Alert, 
  Upload, 
  message, 
  Modal, 
  Card, 
  Form, 
  Input, 
  Select, 
  Checkbox, 
  InputNumber, 
  Divider, 
  Space, 
  List, 
  Tag, 
  Row, 
  Col,
  Descriptions
} from 'antd';
import { 
  UploadOutlined, 
  CameraOutlined, 
  UndoOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DeliveryConfirmation = () => {
  // Use AntD's message hook
  const [messageApi, contextHolder] = message.useMessage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState({});
  const [confirmed, setConfirmed] = useState({});
  
  // Return collection states
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedOrderForReturns, setSelectedOrderForReturns] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnForm] = Form.useForm();
  const [returnPhoto, setReturnPhoto] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [submittingReturns, setSubmittingReturns] = useState(false);
  
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Return reasons options
  const returnReasons = [
    'Expired product',
    'Damaged during transport',
    'Customer refused delivery',
    'Wrong item delivered',
    'Quality issues',
    'Customer request',
    'Excess inventory',
    'Other'
  ];
  useEffect(() => {
    if (!token) return setLoading(false);

    fetch('/api/order/current', {  // Changed to use order endpoint instead of deliveries
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Filter orders that are picked up or completed for delivery/return collection
          const deliveryOrders = data.result.filter(order => 
            ['picked_up', 'completed'].includes(order.status)
          );
          setOrders(deliveryOrders);
        } else {
          setOrders([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery orders', err);
        setLoading(false);
      });
  }, [token]);

  // Handle photo upload for delivery confirmation
  const handlePhotoChange = ({ file }, orderId) => {
    const realFile = file.originFileObj || file;
    if (realFile) {
      setPhotos(prev => ({
        ...prev,
        [String(orderId)]: realFile,
      }));
      messageApi.success(`Photo selected for Order ID: ${orderId}`);
    }
  };

  // Handle return photo capture
  const handleReturnPhotoCapture = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setReturnPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  // Handle customer signature capture for returns
  const handleCustomerSignatureCapture = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomerSignature(e.target.result);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  // Open return collection modal
  const openReturnModal = (order) => {
    setSelectedOrderForReturns(order);
    
    // Initialize return items from order items
    const initialReturnItems = order.items.map(item => ({
      _id: item._id,
      inventoryItem: item.inventoryItem,
      deliveredQuantity: item.quantity,
      returnQuantity: 0,
      reason: '',
      selected: false
    }));
    
    setReturnItems(initialReturnItems);
    setReturnModalVisible(true);
    returnForm.resetFields();
  };

  // Close return modal
  const closeReturnModal = () => {
    setReturnModalVisible(false);
    setSelectedOrderForReturns(null);
    setReturnItems([]);
    setReturnPhoto(null);
    setCustomerSignature(null);
    returnForm.resetFields();
  };

  // Handle return item selection
  const handleReturnItemChange = (itemId, field, value) => {
    setReturnItems(prev => prev.map(item => 
      item._id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };  // Submit return collection
  const submitReturnCollection = async (values) => {
    console.log('=== FRONTEND: Submit return collection called ===');
    console.log('Values received:', values);
      // Prevent default form submission behavior
    try {
      console.log('Current user:', current);
      console.log('Token:', token);
      console.log('Selected order:', selectedOrderForReturns);
      console.log('Return items:', returnItems);
      console.log('Return photo exists:', !!returnPhoto);
      console.log('Customer signature exists:', !!customerSignature);
      
      const selectedReturns = returnItems.filter(item => item.selected && item.returnQuantity > 0);
      console.log('Selected returns:', selectedReturns);
      
      if (selectedReturns.length === 0) {
        messageApi.warning('Please select at least one item to return');
        return;
      }

      if (!returnPhoto) {
        messageApi.warning('Please capture a photo of the returned items');
        return;
      }

      if (!customerSignature) {
        messageApi.warning('Please capture customer signature for return confirmation');
        return;
      }

      setSubmittingReturns(true);
      const returnData = {
        orderId: selectedOrderForReturns?._id,
        returnType: 'doctor', // Assuming this is a doctor return from delivery
        doctorId: selectedOrderForReturns?.doctorId?._id,
        doctorName: selectedOrderForReturns?.doctorName,
        hospitalName: selectedOrderForReturns?.hospitalName,
        items: selectedReturns.map(item => ({
          originalItemId: item.inventoryItem?._id,
          returnedQuantity: item.returnQuantity,
          reason: item.reason || 'Customer return during delivery'
        })),
        photo: returnPhoto,
        customerSignature: customerSignature,
        customerName: values?.customerName,
        notes: values?.notes || '',
        collectedBy: current?._id, // Deliverer who collected the return
        collectionDate: new Date().toISOString()
      };

      console.log('=== FRONTEND: Sending return data ===');
      console.log('Return data:', JSON.stringify(returnData, null, 2));      const response = await fetch('/api/returns/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(returnData),
      });

      console.log('=== FRONTEND: Response received ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('=== FRONTEND: Response parsed ===');
      console.log('Response result:', result);

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to submit return collection');
      }      if (result?.success) {
        messageApi.success(`Successfully collected returns for Order ${selectedOrderForReturns?.orderNumber || 'Unknown'}`);
        closeReturnModal();
        
        // REMOVED: Refresh orders list to show updated status
        // window.location.reload(); // Simple refresh for now
        console.log('SUCCESS: Return collection completed successfully');
      } else {
        throw new Error(result?.message || 'Failed to submit return collection');
      }} catch (error) {
      console.error('Error submitting return collection:', error);
      messageApi.error(`Error: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setSubmittingReturns(false);
    }
  };

  const confirmDelivery = async (id) => {
    const photo = photos[id];
    if (!photo) {
      messageApi.warning('Please upload a photo before confirming delivery.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photo);

    try {
      const res = await fetch(`/api/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        messageApi.success('Delivery confirmed!');
        setOrders(prev => prev.filter(order => order._id !== id));
        setPhotos(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setConfirmed(prev => ({
          ...prev,
          [id]: true,
        }));
      } else {
        const err = await res.json();
        messageApi.error(err?.error || 'Failed to confirm delivery.');
      }
    } catch (err) {
      console.error('Error confirming delivery:', err);
      messageApi.error('Something went wrong while confirming delivery.');
    }
  };
  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber) => <Tag color="blue">{orderNumber}</Tag>,
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, record) => record.doctorId?.name || record.doctorName || '-',
    },
    {
      title: 'Hospital',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      render: (hospital) => hospital || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          picked_up: 'orange',
          completed: 'green'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Items Count',
      key: 'itemsCount',
      render: (_, record) => (
        <span>{record.items?.length || 0} items</span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => {
        const orderId = String(record._id);
        const photo = photos[orderId];
        const isConfirmed = confirmed[orderId];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Delivery Confirmation Section */}
            {record.status === 'picked_up' && (
              <>
                <Upload
                  beforeUpload={() => false}
                  onChange={(info) => handlePhotoChange(info, orderId)}
                  accept="image/*"
                  showUploadList={false}
                  disabled={isConfirmed}
                >
                  <Button icon={<UploadOutlined />} disabled={isConfirmed} size="small">
                    {photo ? 'Photo Ready' : 'Upload Delivery Photo'}
                  </Button>
                </Upload>

                {photo && !isConfirmed && (
                  <div style={{ fontSize: '0.75rem', color: '#555' }}>
                    Selected: {photo.name}
                  </div>
                )}

                <Button
                  type="primary"
                  disabled={!photo || isConfirmed}
                  onClick={() => confirmDelivery(orderId)}
                  size="small"
                >
                  {isConfirmed ? 'Delivered' : 'Confirm Delivery'}
                </Button>
              </>
            )}

            {/* Return Collection Section */}
            <Divider style={{ margin: '4px 0' }} />
            <Button
              type="default"
              icon={<UndoOutlined />}
              onClick={() => openReturnModal(record)}
              size="small"
              disabled={isConfirmed}
            >
              Collect Returns
            </Button>

            {record.status === 'completed' && (
              <Tag color="green" style={{ margin: 0 }}>
                <CheckCircleOutlined /> Completed
              </Tag>
            )}
          </div>
        );
      },
    },
  ];
  return (
    <div style={{ padding: 24 }}>
      {/* Place contextHolder here so messages can render */}
      {contextHolder}
      <Title level={2}>Delivery & Return Collection</Title>
      
      <Alert
        message="Delivery & Return Collection Instructions"
        description="Complete deliveries by uploading delivery photos. You can also collect returns from customers during your visits."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <Alert message="Loading orders..." type="info" />
      ) : orders.length === 0 ? (
        <Alert message="No orders available for delivery or return collection" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={record => record._id}
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* Return Collection Modal */}
      <Modal
        title={
          <div>
            <UndoOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
            Collect Returns - Order {selectedOrderForReturns?.orderNumber}
          </div>
        }
        open={returnModalVisible}
        onCancel={closeReturnModal}
        footer={null}
        width={800}
      >
        {selectedOrderForReturns && (
          <Form
            form={returnForm}
            layout="vertical"
            onFinish={submitReturnCollection}
          >
            {/* Order Information */}
            <Card title="Order Information" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Doctor">
                  {selectedOrderForReturns.doctorName}
                </Descriptions.Item>
                <Descriptions.Item label="Hospital">
                  {selectedOrderForReturns.hospitalName}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Return Items Selection */}
            <Card title="Select Items to Return" size="small" style={{ marginBottom: 16 }}>
              <List
                dataSource={returnItems}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Row gutter={16} align="middle">
                        <Col span={2}>
                          <Checkbox
                            checked={item.selected}
                            onChange={(e) => 
                              handleReturnItemChange(item._id, 'selected', e.target.checked)
                            }
                          />
                        </Col>
                        <Col span={8}>
                          <div>
                            <Text strong>{item.inventoryItem?.itemName || 'Unknown Item'}</Text>
                            <br />
                            <Text type="secondary">
                              Delivered: {item.deliveredQuantity} units
                            </Text>
                          </div>
                        </Col>
                        <Col span={6}>
                          <div>
                            <Text>Return Quantity:</Text>
                            <InputNumber
                              min={0}
                              max={item.deliveredQuantity}
                              value={item.returnQuantity}
                              onChange={(value) => 
                                handleReturnItemChange(item._id, 'returnQuantity', value || 0)
                              }
                              disabled={!item.selected}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </Col>
                        <Col span={8}>
                          <div>
                            <Text>Return Reason:</Text>
                            <Select
                              value={item.reason}
                              onChange={(value) => 
                                handleReturnItemChange(item._id, 'reason', value)
                              }
                              disabled={!item.selected}
                              placeholder="Select reason"
                              style={{ width: '100%' }}
                            >
                              {returnReasons.map(reason => (
                                <Option key={reason} value={reason}>
                                  {reason}
                                </Option>
                              ))}
                            </Select>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Return Documentation */}
            <Card title="Return Documentation" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Return Photo"
                    required
                    help="Take a photo of the returned items"
                  >
                    <Upload
                      beforeUpload={handleReturnPhotoCapture}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<CameraOutlined />} block>
                        {returnPhoto ? 'Retake Photo' : 'Capture Return Photo'}
                      </Button>
                    </Upload>
                    {returnPhoto && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img 
                          src={returnPhoto} 
                          alt="Return" 
                          style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #d9d9d9' }}
                        />
                      </div>
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Customer Signature"
                    required
                    help="Customer signature confirming return"
                  >
                    <Upload
                      beforeUpload={handleCustomerSignatureCapture}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<EditOutlined />} block>
                        {customerSignature ? 'Retake Signature' : 'Capture Signature'}
                      </Button>
                    </Upload>
                    {customerSignature && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img 
                          src={customerSignature} 
                          alt="Signature" 
                          style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #d9d9d9' }}
                        />
                      </div>
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Customer Details */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Customer Name"
                  name="customerName"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Additional Notes"
                  name="notes"
                >
                  <TextArea 
                    rows={2} 
                    placeholder="Any additional notes about the return..."
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Submit Buttons */}
            <Row justify="end" gutter={8}>
              <Col>
                <Button onClick={closeReturnModal}>
                  Cancel
                </Button>
              </Col>              <Col>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submittingReturns}
                  icon={<CheckCircleOutlined />}
                >
                  Submit Return Collection
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryConfirmation;
