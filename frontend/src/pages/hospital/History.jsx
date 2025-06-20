import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, message, Modal, Card, Row, Col, Descriptions, List, Divider } from 'antd';
import { EyeOutlined, FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title, Text } = Typography;

const History = () => {
  const [history, setHistory] = useState({
    orders: [],
    deliveries: [],
    salesBills: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchHistory();
  }, [token]);
  const fetchHistory = async () => {
    if (!token) return setLoading(false);

    try {
      const [ordersRes, deliveriesRes, salesBillsRes] = await Promise.all([
        fetch('/api/hospital/orders/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/hospital/deliveries/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/hospital/sales-bills/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!ordersRes.ok || !deliveriesRes.ok || !salesBillsRes.ok) {
        throw new Error('Failed to fetch history data');
      }

      const [ordersData, deliveriesData, salesBillsData] = await Promise.all([
        ordersRes.json(),
        deliveriesRes.json(),
        salesBillsRes.json()
      ]);

      if (ordersData.success && deliveriesData.success && salesBillsData.success) {
        setHistory({
          orders: ordersData.result || [],
          deliveries: deliveriesData.result || [],
          salesBills: salesBillsData.result || []
        });
      } else {
        throw new Error('Failed to fetch history data');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch history data');
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

  const handleGeneratePDF = (record, type) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF:', record, type);
  };

  const orderColumns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'completed') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'order')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'order')}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const deliveryColumns = [
    {
      title: 'Delivery ID',
      dataIndex: 'deliveryId',
      key: 'deliveryId',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'delivered') color = 'green';
        else if (status === 'in_transit') color = 'blue';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'delivery')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'delivery')}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const salesBillColumns = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'paid') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record, 'salesBill')}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record, 'salesBill')}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: '1',
      label: 'Order History',
      children: (
        <Table
          dataSource={history.orders}
          columns={orderColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Delivery History',
      children: (
        <Table
          dataSource={history.deliveries}
          columns={deliveryColumns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Sales Bill History',
      children: (
        <Table
          dataSource={history.salesBills}
          columns={salesBillColumns}
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
        <Title level={2}>History</Title>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
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
                        <Text strong>₹{selectedRecord.totalAmount.toFixed(2)}</Text>
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
                            {item.price && <Text>₹{item.price.toFixed(2)}</Text>}
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