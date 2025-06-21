import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { 
  Table, 
  Typography, 
  Alert, 
  Button, 
  Tag, 
  Modal, 
  Card, 
  Row, 
  Col, 
  Descriptions, 
  List, 
  Badge, 
  Divider 
} from 'antd';
import { 
  EyeOutlined, 
  SwapOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }    fetch('/api/order/delivered-history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Filter to show only completed orders for deliverer's history
          const completedOrders = (data.result || []).filter(order => 
            order.status === 'completed' && order.deliveredAt
          );
          setHistory(completedOrders);
          console.log(`Loaded ${completedOrders.length} completed orders for deliverer history`);
        } else {
          console.error('Failed to fetch delivery history:', data.message);
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery history', err);
        setHistory([]);
        setLoading(false);
      });
  }, [token]);
  // Open order details modal
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  // Close order details modal
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setDetailsModalVisible(false);
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber) => (
        <Tag color="blue">{orderNumber}</Tag>
      ),
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
      render: (hospital) => hospital || '-',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Substitutions',
      key: 'substitutions',
      render: (_, record) => {
        if (record.hasSubstitutions && record.substitutionSummary?.totalSubstitutions > 0) {
          return (
            <Badge 
              count={record.substitutionSummary.totalSubstitutions} 
              style={{ backgroundColor: '#f50' }}
            >
              <Tag icon={<SwapOutlined />} color="orange">
                Modified
              </Tag>
            </Badge>
          );
        }
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Original
          </Tag>
        );
      },
    },
    {
      title: 'Delivered At',
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      render: (time) =>
        time ? new Date(time).toLocaleString() : '-',
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
  ];
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Delivery History</Title>
      {loading ? (
        <Alert message="Loading delivery history..." type="info" />
      ) : history.length === 0 ? (
        <Alert message="No delivered orders found" type="warning" />
      ) : (
        <Table
          dataSource={history}
          columns={columns}
          rowKey={record => record._id}
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        title={
          <div>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <span>Delivered Order Details</span>
            {selectedOrder?.hasSubstitutions && (
              <Tag icon={<SwapOutlined />} color="orange" style={{ marginLeft: 8 }}>
                Has Substitutions
              </Tag>
            )}
          </div>
        }
        open={detailsModalVisible}
        onCancel={closeOrderDetails}
        footer={[
          <Button key="close" onClick={closeOrderDetails}>
            Close
          </Button>
        ]}
        width={900}
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
                      <Tag color="green">
                        <CheckCircleOutlined /> DELIVERED
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
                    <Descriptions.Item label="Delivered On">
                      {selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString() : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Order Items */}
            <Card title="Delivered Items" size="small" style={{ marginBottom: 16 }}>
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
                              backgroundColor: '#f6ffed', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              border: '2px solid #52c41a'
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
                    Substitution History
                    <Badge 
                      count={selectedOrder.substitutionSummary.totalSubstitutions} 
                      style={{ backgroundColor: '#f50', marginLeft: 8 }}
                    />
                  </div>
                } 
                size="small"
              >
                <Alert
                  message="Items Modified During Delivery"
                  description={`${selectedOrder.substitutionSummary.itemsWithSubstitutions} out of ${selectedOrder.items?.length || 0} items were modified with substitutions before delivery.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <List
                  header={<div><strong>Substitution Details</strong></div>}
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
                            <span style={{ color: '#52c41a' }}>Substituted with:</span> {detail.returnedItem}
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
                  message="Delivery Completed Successfully"
                  description="This order was delivered with the above substitutions. All modifications were made to ensure product availability and customer satisfaction."
                  type="success"
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

export default History;
