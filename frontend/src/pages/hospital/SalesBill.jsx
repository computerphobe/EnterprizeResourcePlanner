import React, { useState, useEffect } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, message, Modal, Descriptions, Divider, Card, List, Row, Col } from 'antd';
import { EyeOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const { Title, Text } = Typography;

const SalesBill = () => {
  const [salesBills, setSalesBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    fetchSalesBills();
  }, [token]);

  const fetchSalesBills = async () => {
    if (!token) return setLoading(false);

    try {
      const response = await fetch('/api/hospital/sales-bills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales bills');
      }
        const data = await response.json();
      if (data.success) {
        setSalesBills(data.result || []);
        
        // Show notification if a new client was created
        if (data.clientInfo && data.clientInfo.isNewClient) {
          message.info(`Welcome! A new client record has been created for ${data.clientInfo.name}`);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch sales bills');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch sales bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
    setDetailsVisible(true);
  };

  const handleGeneratePDF = (bill) => {
    if (bill.pdf) {
      window.open(`/api/pdf/${bill.pdf}`, '_blank');
    } else {
      message.warning('PDF not available for this invoice');
    }
  };
  
  const closeDetails = () => {
    setSelectedBill(null);
    setDetailsVisible(false);
  };
  const columns = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Patient Name',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (patientName) => patientName || '-',
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
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  const paidBills = salesBills.filter(bill => bill.status === 'paid');
  const pendingBills = salesBills.filter(bill => bill.status === 'pending');

  const items = [
    {
      key: '1',
      label: 'All Bills',
      children: (
        <Table
          dataSource={salesBills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: 'Paid Bills',
      children: (
        <Table
          dataSource={paidBills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '3',
      label: 'Pending Bills',
      children: (
        <Table
          dataSource={pendingBills}
          columns={columns}
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
        <Title level={2}>Sales Bills</Title>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>

      {/* Invoice Details Modal */}
      <Modal
        title={`Invoice Details - ${selectedBill?.billNumber || ''}`}
        open={detailsVisible}
        onCancel={closeDetails}
        footer={[
          <Button key="close" onClick={closeDetails}>
            Close
          </Button>,
          selectedBill?.pdf && (
            <Button 
              key="pdf" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleGeneratePDF(selectedBill)}
            >
              Download PDF
            </Button>
          )
        ]}
        width={800}
      >
        {selectedBill && (
          <div>
            <Card title="Invoice Information" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Invoice Number">
                      <Text strong>{selectedBill.billNumber}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {new Date(selectedBill.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">
                      {selectedBill.dueDate ? new Date(selectedBill.dueDate).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Status">
                      <Tag color={selectedBill.status === 'paid' ? 'green' : 
                              selectedBill.status === 'partially' ? 'blue' : 'orange'}>
                        {selectedBill.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                      <Text strong>₹{selectedBill.totalAmount.toFixed(2)}</Text>
                    </Descriptions.Item>
                    {selectedBill.credit > 0 && (
                      <Descriptions.Item label="Amount Paid">
                        <Text type="success">₹{selectedBill.credit.toFixed(2)}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {selectedBill.items && selectedBill.items.length > 0 && (
              <Card title="Invoice Items" size="small" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedBill.items}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                          <Col span={16}>
                            <Text strong>{item.itemName}</Text>
                            {item.description && (
                              <>
                                <br />
                                <Text type="secondary">{item.description}</Text>
                              </>
                            )}
                          </Col>
                          <Col span={8} style={{ textAlign: 'right' }}>
                            <div>{item.quantity} x ₹{item.price.toFixed(2)}</div>
                            <Text strong>₹{item.total.toFixed(2)}</Text>
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
                
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="end">
                  <Col span={12}>
                    <div style={{ textAlign: 'right', paddingRight: '16px' }}>
                      <div>
                        <Text>Subtotal: </Text>
                        <Text strong>₹{selectedBill.subTotal.toFixed(2)}</Text>
                      </div>
                      {selectedBill.taxRate > 0 && (
                        <div>
                          <Text>Tax ({selectedBill.taxRate}%): </Text>
                          <Text strong>₹{selectedBill.taxTotal.toFixed(2)}</Text>
                        </div>
                      )}
                      {selectedBill.discount > 0 && (
                        <div>
                          <Text>Discount: </Text>
                          <Text strong>₹{selectedBill.discount.toFixed(2)}</Text>
                        </div>
                      )}
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Total: </Text>
                        <Text strong style={{ fontSize: '16px' }}>₹{selectedBill.totalAmount.toFixed(2)}</Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {selectedBill.notes && (
              <Card title="Notes" size="small">
                <Text>{selectedBill.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesBill;