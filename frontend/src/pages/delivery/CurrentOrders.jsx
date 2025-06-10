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
  List
} from 'antd';
import { 
  EyeOutlined, 
  SwapOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

const CurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
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
        }

        const data = await response.json();

        if (data.success) {
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
  }, [token]);

  const handlePickup = async (id) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/pickup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Marked as picked up!');
        setOrders((prev) =>
          prev.map((order) => (order._id === id ? { ...order, status: 'picked_up' } : order))
        );
      } else {
        throw new Error(data.message || 'Failed to confirm pickup.');
      }
    } catch (err) {
      message.error(err.message || 'Error marking as picked up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Marked as delivered!');
        setOrders((prev) => prev.filter((order) => order._id !== id));
      } else {
        throw new Error(data.message || 'Failed to confirm delivery.');
      }
    } catch (err) {
      message.error(err.message || 'Error marking as delivered');
    } finally {
      setActionLoading(null);
    }  };

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

  // Status tag colors for better UX
  const statusColors = {
    pending: 'gold',
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
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'pending') {
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
        return '-';
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
    </div>
  );
};

export default CurrentOrders;
