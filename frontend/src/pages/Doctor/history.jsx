import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Card, Row, Col, Statistic, Modal, Descriptions, List, Divider } from 'antd';
import { FilePdfOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, ShoppingOutlined, CarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title, Text } = Typography;

const History = () => {
  const [history, setHistory] = useState({
    salesbill: [],
    deliveries: [],
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchHistory();
  }, []);
  const fetchHistory = async () => {
    try {
      // Fetch all history data
      const [salesbillRes, deliveriesRes, ordersRes] = await Promise.all([
        fetch('/api/doctor/sales-bills', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/doctor/deliveries-history', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/doctor/orders-history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [salesbillData, deliveriesData, ordersData] = await Promise.all([
        salesbillRes.json(),
        deliveriesRes.json(),
        ordersRes.json()
      ]);

      setHistory({
        salesbill: salesbillData.success ? salesbillData.bills : [],
        deliveries: deliveriesData.success ? deliveriesData.deliveries : [],
        orders: ordersData.success ? ordersData.orders : []
      });
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open details modal
  const openDetailsModal = (record, type) => {
    setSelectedRecord(record);
    setModalType(type);
    setDetailsModalVisible(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setSelectedRecord(null);
    setModalType('');
    setDetailsModalVisible(false);
  };

  const handleViewDetails = (record, type) => {
    openDetailsModal(record, type);
  };

  const handleDownloadInvoice = (record) => {
    // Implement download invoice functionality
    console.log('Download invoice:', record);
  };

  const salesbillColumns = [
    {
      title: 'Bill ID',
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
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
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
          paid: 'success',
          pending: 'warning',
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
            onClick={() => handleViewDetails(record, 'salesbill')}
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadInvoice(record)}
          >
            Invoice
          </Button>
        </Space>
      )
    }
  ];

  const deliveriesColumns = [
    {
      title: 'Delivery ID',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <span>{text.slice(-6)}</span>
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
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
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          delivered: 'success',
          in_transit: 'processing',
          pending: 'warning',
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
            onClick={() => handleViewDetails(record, 'delivery')}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const ordersColumns = [
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
      render: (items) => (
        <span>
          {items.map(item => item.name).join(', ')}
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
          completed: 'success',
          processing: 'processing',
          pending: 'warning',
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
            onClick={() => handleViewDetails(record, 'order')}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const items = [
    {
      key: 'salesbill',
      label: 'Sales Bill History',
      children: (
        <Table
          dataSource={history.salesbill}
          columns={salesbillColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'deliveries',
      label: 'Deliveries History',
      children: (
        <Table
          dataSource={history.deliveries}
          columns={deliveriesColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'orders',
      label: 'Orders History',
      children: (
        <Table
          dataSource={history.orders}
          columns={ordersColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];
  return (
    <div className="p-4">
      <Title level={2}>History</Title>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="salesbill" items={items} />
      </div>

      {/* Details Modal */}
      <Modal
        title={
          <div>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <span>{modalType === 'order' ? 'Order Details' : modalType === 'delivery' ? 'Delivery Details' : 'Sales Bill Details'}</span>
          </div>
        }
        open={detailsModalVisible}
        onCancel={closeDetailsModal}
        footer={[
          <Button key="close" onClick={closeDetailsModal}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <div>
            {/* Basic Information */}
            <Card title="Basic Information" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="ID">
                      <Text code>{selectedRecord._id?.slice(-8)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {new Date(selectedRecord.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                    {selectedRecord.status && (
                      <Descriptions.Item label="Status">
                        <Tag color={selectedRecord.status === 'completed' ? 'green' : 'blue'}>
                          {selectedRecord.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    {selectedRecord.totalAmount && (
                      <Descriptions.Item label="Total Amount">
                        <Text strong>${selectedRecord.totalAmount.toFixed(2)}</Text>
                      </Descriptions.Item>
                    )}
                    {modalType === 'order' && selectedRecord.orderNumber && (
                      <Descriptions.Item label="Order Number">
                        <Tag color="blue">{selectedRecord.orderNumber}</Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Items List */}
            {selectedRecord.items && selectedRecord.items.length > 0 && (
              <Card title="Items" size="small" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedRecord.items}
                  renderItem={(item, index) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Text strong>{item.name || item.itemName || `Item ${index + 1}`}</Text>
                            {item.quantity && <Text type="secondary"> - Qty: {item.quantity}</Text>}
                          </Col>
                          <Col>
                            {item.price && <Text>${item.price.toFixed(2)}</Text>}
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Additional Information */}
            {(selectedRecord.notes || selectedRecord.deliveryAddress) && (
              <Card title="Additional Information" size="small">
                {selectedRecord.notes && (
                  <Descriptions.Item label="Notes" span={3}>
                    {selectedRecord.notes}
                  </Descriptions.Item>
                )}
                {selectedRecord.deliveryAddress && (
                  <Descriptions.Item label="Delivery Address" span={3}>
                    {selectedRecord.deliveryAddress}
                  </Descriptions.Item>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default History; 